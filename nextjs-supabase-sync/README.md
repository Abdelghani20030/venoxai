# Next.js Supabase Auth & Cloud Sync System

A production-ready, offline-first cloud synchronization and authentication template. Built using **Next.js App Router**, **Supabase (PostgreSQL + RLS)**, and **TailwindCSS**.

This architecture is optimized for performance, security, and scalability to handle thousands of concurrent users.

---

## Folder Architecture

The codebase utilizes a clean and scalable folder structure designed for Next.js App Router:

```text
nextjs-supabase-sync/
├── supabase/
│   └── migrations/
│       └── 20260527000000_schema.sql  # SQL DDL, RLS policies, triggers
├── src/
│   ├── app/                           # App Router routes
│   │   ├── globals.css                # Tailwind base & theme system
│   │   ├── layout.tsx                 # Root layout with AuthProvider
│   │   ├── page.tsx                   # Splash page
│   │   ├── login/
│   │   │   └── page.tsx               # Login container
│   │   ├── signup/
│   │   │   └── page.tsx               # Registration container
│   │   └── dashboard/
│   │       └── page.tsx               # Authenticated user dashboard
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx          # Login UI (form + error validation)
│   │   │   └── SignupForm.tsx         # Signup UI (form + error validation)
│   │   └── dashboard/
│   │       ├── ProgressDashboard.tsx  # Dynamic statistics & vocabulary grids
│   │       └── LessonSimulator.tsx    # Live emulator triggering sync events
│   ├── context/
│   │   └── AuthContext.tsx            # Context provider listening to auth state
│   ├── hooks/
│   │   ├── useAuth.ts                 # React hook wrapping auth API functions
│   │   └── useSync.ts                 # Cloud Sync hook with local queuing
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              # Browser-side client instance
│   │       ├── server.ts              # Server-side cookie client
│   │       └── middleware.ts          # Session refresher & page guards
│   ├── middleware.ts                  # Root middleware calling route guards
│   └── types/
│       └── index.ts                   # TypeScript interfaces
├── .env.example                       # Env setup template
├── package.json                       # Scripts and project dependencies
├── tailwind.config.js                 # Styling configurations
└── tsconfig.json                      # Path aliases and TS options
```

---

## Features

1. **Persistent Authentication**: Cookie-based persistent session management using Supabase Server-Side Rendering (`@supabase/ssr`).
2. **Offline-First Synchronization**: Progress (XP, streaks, settings, lesson states, vocabulary, quiz results) is updated immediately in local memory.
3. **Queueing & Conflict Resolution**: If network status changes to offline:
   - Changes are queued in `localStorage`.
   - The application listens to `window.online` events to automatically flush queued records once a connection is re-established.
   - Merging algorithm uses a last-write-wins policy for configuration settings and union operations for records (lessons, vocabulary) to resolve conflicts.
4. **Traffic Optimizations (Debouncing)**: Incremental modifications (such as incrementing 10 XP points repeatedly) are debounced for 1.5 seconds to batch write operations, avoiding rate limits.
5. **Row Level Security (RLS)**: PostgreSQL schema configured with strict RLS policies to restrict database operations so that users can only select/insert/update/delete records belonging to their unique UUID (`auth.uid()`).

---

## Database Schema (PostgreSQL)

See the full definition in `supabase/migrations/20260527000000_schema.sql`.

### Relational Tables:
- `user_progress`: General user profile state (XP, streak, last active date, last visited lesson, user settings JSONB).
- `user_completed_lessons`: Relational map of completed lessons (unique index on `user_id` and `lesson_id`).
- `user_vocabulary`: Vocabulary logs with status and SRS (Spaced Repetition System) stages.
- `user_quiz_results`: Cumulative log of user quiz evaluations.

### Triggers:
An `on_auth_user_created` trigger automatically runs when a new row enters the `auth.users` schema (upon signing up), inserting default profile values into the public `user_progress` table.

---

## Security Best Practices

1. **Always Use RLS**: Do not bypass Row Level Security. Ensure every table has RLS enabled with matching `auth.uid() = user_id` policies.
2. **Secret Key Concealment**: Never expose the `SERVICE_ROLE_KEY` to the client. Keep it secure inside your server environment. Use only the `ANON_KEY` client-side.
3. **Trigger Security Definership**: Define the user initialization function with `SECURITY DEFINER`. This runs the execution as the superuser database role, bypassing user restrictions so that it can write to the public profile even during signup before the user session is authenticated.
4. **HTTP-Only Cookies**: The Supabase SSR middleware reads and updates tokens in secure, HTTP-only cookies, protecting session logs from Cross-Site Scripting (XSS) tokens.

---

## Scalability Guidelines (For thousands of users)

1. **Create Indices**: Database indices are configured on all foreign keys (`user_id` references) to prevent table scans on large tables.
2. **Batch Upserts**: Multiple new items (e.g. queueing vocab words offline) are batched and uploaded in a single network request using `upsert` rather than running a loop of multiple insert queries.
3. **Debounced Syncs**: Rapid state changes are debounced in React to reduce query load.
4. **No Server Roundtrips for Auth Checking**: The Next.js routing middleware runs on the Edge, examining and renewing JWT tokens locally, optimizing latency.

---

## How to Set Up & Run

### 1. Database Configuration
Go to your **Supabase Dashboard** -> **SQL Editor**, paste the contents of `supabase/migrations/20260527000000_schema.sql`, and execute. This initializes the tables, indices, triggers, and security policies.

### 2. Install Dependencies
Navigate into this project directory and run:
```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables
Rename `.env.example` to `.env.local` and input your project keys from Supabase Settings:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Vercel Deployment
To deploy this project to production on **Vercel**:
1. Connect your repository to Vercel.
2. Add your environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel project settings.
3. Deploy! Next.js App Router and Supabase SSR cookies will operate seamlessly.
