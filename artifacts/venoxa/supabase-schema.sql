-- ═══════════════════════════════════════════════════════════════════════════
--  supabase-schema.sql — Venoxa on Supabase
--
--  Run this ONCE in the Supabase Dashboard → SQL Editor → New query.
--  It replaces the Firebase setup (Firestore users doc + Firebase Storage):
--
--    • public.users        one row per account; every word/progress/history
--                          field lives inside the `data` JSONB column
--                          (mirrors the old Firestore document shape)
--    • handle_new_user()   trigger: auto-creates the row on signup and seeds
--                          `data` with the signup metadata (username, dob,
--                          gender) so profiles survive email confirmation
--    • merge_beacon_data() used by the page-unload beacon (fetch keepalive)
--    • delete_own_account() used by "Delete account" in ProfileDashboard
--    • RLS                  every user can only read/write their own row
--    • vocab bucket         private Storage bucket for custom word-list CSVs
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Users table (one row = one old Firestore document) ──────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 2. Row Level Security — users may only touch their own row ─────────────
alter table public.users enable row level security;

drop policy if exists "users_select_own"  on public.users;
drop policy if exists "users_insert_own"  on public.users;
drop policy if exists "users_update_own"  on public.users;
drop policy if exists "users_delete_own"  on public.users;

create policy "users_select_own" on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users_delete_own" on public.users
  for delete to authenticated
  using (auth.uid() = id);

-- ── 3. Auto-create the row on signup (seeds profile from metadata) ────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, data)
  values (new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 4. Page-unload beacon: merge a small delta into `data` ────────────────
-- Invoked by syncBeacon() as  supabase.rpc('merge_beacon_data', { p_data })
-- with fetch keepalive, so it survives the tab closing.
create or replace function public.merge_beacon_data(p_data jsonb)
returns void
language plpgsql
security invoker
as $$
begin
  update public.users
  set data       = data || p_data,
      updated_at = now()
  where id = auth.uid();
end;
$$;

-- ── 5. Account self-deletion (DELETE / ProfileDashboard) ──────────────────
-- Supabase doesn't allow clients to delete their own auth record directly,
-- so this SECURITY DEFINER function does it once the owner calls it.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  -- The ON DELETE CASCADE on public.users.id removes the synced data too.
  delete from auth.users where id = auth.uid();
end;
$$;

-- ── 6. Storage bucket for custom vocabulary CSVs (private) ────────────────
insert into storage.buckets (id, name, public)
values ('vocab', 'vocab', false)
on conflict (id) do nothing;

drop policy if exists "vocab_select_own" on storage.objects;
drop policy if exists "vocab_insert_own" on storage.objects;
drop policy if exists "vocab_update_own" on storage.objects;
drop policy if exists "vocab_delete_own" on storage.objects;

create policy "vocab_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vocab' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vocab_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vocab' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vocab_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'vocab' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vocab_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vocab' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 7. Realtime subscription (subscribeToProgress) ────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'users'
  ) then
    alter publication supabase_realtime add table public.users;
  end if;
end;
$$;
