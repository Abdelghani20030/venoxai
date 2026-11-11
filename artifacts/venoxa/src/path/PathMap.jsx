// src/path/PathMap.jsx — the learning-path map (spec §5.2, design p.04/p.09).
//
// "The journey is the interface": level tabs, unit sections and a vertical
// zig-zag path of nodes — completed (green check), current (blue play with the
// black CONTINUE pill), locked (grey lock), revision (dashed amber recap) and
// assessment (trophy). The right rail holds the current-lesson card, the level
// summary and the revisit list.
//
// States come from /api/path/map (server-enforced chain, guests read-only).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  Lock,
  Pencil,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { _resolveTranslation } from '../translations.js';
import {
  Btn,
  Card,
  CardTitle,
  Chip,
  EmptyState,
  Eyebrow,
  FOCUS_RING,
  ProgressBar,
  RTL_FLIP,
} from '../ui/index.jsx';

/* ── helpers ────────────────────────────────────────────────────────────── */

// "Grammar · Listening · A1" → "Grammar · Listening" (drops the level tail).
function parseTopic(subtitle) {
  if (!subtitle) return '';
  const parts = String(subtitle).split('·').map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1 && /^[abc][12]$/i.test(parts[parts.length - 1])) parts.pop();
  return parts.join(' · ');
}

// Content chips for the current-lesson card (p.04: Grammar/Vocabulary/Listening/Check).
function chipsFor(kind, topic, T) {
  if (kind === 'assessment') {
    return [{ icon: Trophy, label: T('اختبار', 'Check'), variant: 'grey' }];
  }
  if (kind === 'revision') {
    return [{ icon: RotateCcw, label: T('مراجعة', 'Recap'), variant: 'amber' }];
  }
  const chips = [];
  if (/vocabulary/i.test(topic)) chips.push({ icon: Pencil, label: T('مفردات', 'Vocabulary'), variant: 'mint' });
  if (/listening|pronunciation/i.test(topic)) {
    chips.push({ icon: Headphones, label: T('استماع', 'Listening'), variant: 'amber' });
  }
  if (!chips.length || /grammar/i.test(topic)) {
    chips.unshift({ icon: BookOpen, label: T('قواعد', 'Grammar'), variant: 'blue' });
  }
  chips.push({ icon: Check, label: T('اختبار', 'Check'), variant: 'grey' });
  return chips;
}

// Node geometry: gentle zig-zag offsets cycling down the path (p.04).
const ZIGZAG = [0, 32, 44, 24];
const NODE_R = 30; // completed/locked node radius (56px circle)
const CUR_R = 34; // current node radius (68px circle)

/* ── one path node ──────────────────────────────────────────────────────── */

function PathNodeCircle({ lesson, onClick, T }) {
  const state = lesson.state;
  const draft = lesson.draft;
  const isCurrent = state === 'current';
  const done = state === 'completed';
  const revision = state === 'revision';
  const locked = state === 'locked';

  const openable = !draft && !locked && (isCurrent || done || revision);
  const Icon = isCurrent
    ? draft
      ? Lock
      : Play
    : done
      ? lesson.kind === 'assessment'
        ? Trophy
        : Check
      : revision
        ? RotateCcw
        : lesson.kind === 'assessment'
          ? Trophy
          : Lock;

  const size = isCurrent ? CUR_R * 2 : NODE_R * 2;
  const halo = done
    ? 'shadow-[0_0_0_10px_var(--vxp-success-tint)]'
    : isCurrent && !draft
      ? 'shadow-[0_0_0_12px_var(--vxp-primary-tint)]'
      : '';

  const circle = (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full transition-transform ${
        openable ? 'group-hover:scale-105' : ''
      } ${halo} ${
        isCurrent
          ? 'bg-[var(--vxp-primary)] text-white'
          : done
            ? 'bg-[var(--vxp-success)] text-white'
            : revision
              ? 'border-[3px] border-dashed border-[var(--vxp-amber-text)] bg-transparent text-[var(--vxp-amber-text)]'
              : 'bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]'
      }`}
      style={{ width: size, height: size }}
    >
      <Icon
        className={isCurrent || done ? 'h-6 w-6' : 'h-5 w-5'}
        aria-hidden="true"
      />
      {isCurrent && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2">
          <span
            className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] shadow-md ${
              draft
                ? 'bg-[var(--vxp-amber)] text-[var(--vxp-amber-text)]'
                : 'bg-neutral-900 text-white'
            }`}
          >
            {draft ? T('قيد الإنهاء', 'BEING FINALIZED') : T('تابع', 'CONTINUE')}
          </span>
          <span
            aria-hidden="true"
            className={`absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 ${
              draft ? 'bg-[var(--vxp-amber)]' : 'bg-neutral-900'
            }`}
          />
        </span>
      )}
    </span>
  );

  const subtitle = revision
    ? T('اختياري', 'Optional')
    : draft && isCurrent
      ? T('قيد الإنهاء', 'being finalized')
      : lesson.kind === 'assessment'
        ? T('اختبار', 'Check')
        : parseTopic(lesson.subtitle) || T('درس', 'Lesson');

  return (
    <button
      type="button"
      onClick={() => {
        if (!openable) return;
        onClick?.();
      }}
      title={openable ? lesson.title : draft ? T('هذا الدرس قيد الإنهاء', 'This lesson is being finalized') : T('مقفل — أكمل الدرس السابق', 'Locked — finish the previous lesson')}
      aria-label={`${lesson.title} — ${state}`}
      className={`group -m-1 flex flex-1 items-center gap-4 rounded-2xl p-1 text-start ${openable ? FOCUS_RING : 'cursor-default'}`}
    >
      {circle}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[15px] font-extrabold ${
            locked || (draft && !isCurrent)
              ? 'text-[var(--vxp-dim)]'
              : 'text-[var(--vxp-text)]'
          }`}
        >
          {lesson.title}
          {draft && (
            <Lock className="ms-1.5 inline h-3.5 w-3.5 text-[var(--vxp-dim)]" aria-hidden="true" />
          )}
        </span>
        <span
          className={`mt-0.5 block truncate text-[12px] font-semibold ${
            isCurrent && !draft
              ? 'text-[var(--vxp-primary)]'
              : revision
                ? 'text-[var(--vxp-amber-text)]'
                : 'text-[var(--vxp-dim)]'
          }`}
        >
          {lesson.kind === 'lesson' && lesson.lessonNo
            ? `${T('الدرس', 'Lesson')} ${lesson.lessonNo} · ${subtitle}`
            : subtitle}
        </span>
      </span>
    </button>
  );
}

/* ── connector elbow between two nodes ──────────────────────────────────── */

function Connector({ fromOffset, toOffset, active }) {
  const x1 = fromOffset + NODE_R;
  const x2 = toOffset + NODE_R;
  const minX = Math.min(x1, x2) - 1.5;
  const width = Math.abs(x2 - x1) + 3;
  return (
    <div aria-hidden="true" className="relative h-9">
      {/* vertical drop from the previous node */}
      <div
        className="absolute top-0 h-full"
        style={{
          insetInlineStart: fromOffset + NODE_R - 1.5,
          width: 3,
          borderRadius: 2,
          ...(active
            ? { background: 'var(--vxp-success)' }
            : { borderInlineStart: '3px dotted var(--vxp-track)', width: 0 }),
        }}
      />
      {/* horizontal step to the next node's centre (only when offset changes) */}
      {width > 6 && (
        <div
          className="absolute bottom-0"
          style={{
            insetInlineStart: minX,
            width,
            height: 3,
            borderRadius: 2,
            ...(active
              ? { background: 'var(--vxp-success)' }
              : { borderTop: '3px dotted var(--vxp-track)', height: 0 }),
          }}
        />
      )}
    </div>
  );
}

/* ── one unit section: header + node path ───────────────────────────────── */

function UnitSection({ unit, levelCode, unitIndex, onOpenLesson, currentRef, T }) {
  const lessons = unit.lessons ?? [];
  const publishedTotal = lessons.filter((l) => !l.draft).length;
  const doneCount = lessons.filter((l) => l.state === 'completed').length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--vxp-border-strong)] bg-[var(--vxp-surface)] px-4 py-3">
        <div className="min-w-0">
          <p className="vx-eyebrow !text-[11px]">
            {T('الوحدة', 'UNIT')} {unitIndex + 1}
          </p>
          <h3 className="truncate text-[16px] font-extrabold text-[var(--vxp-text)]">{unit.title}</h3>
        </div>
        <span className="shrink-0 text-[13px] font-bold text-[var(--vxp-dim)]">
          {doneCount} {T('من', 'of')} {publishedTotal} {T('منجز', 'done')}
        </span>
      </div>

      <div className={lessons[0]?.state === 'current' ? 'pt-11' : ''}>
        {lessons.map((lesson, i) => {
          const offset = ZIGZAG[i % ZIGZAG.length];
          const prev = i > 0 ? lessons[i - 1] : null;
          const prevOffset = prev ? ZIGZAG[(i - 1) % ZIGZAG.length] : 0;
          const isCurrent = lesson.state === 'current';
          // Segment colour: green when the path has reached this node.
          const reached = lesson.state === 'completed' || lesson.state === 'current' || isCurrent;
          return (
            <div key={lesson.id} className="relative">
              {i > 0 && (
                <Connector
                  fromOffset={prevOffset}
                  toOffset={offset}
                  active={reached}
                />
              )}
              <div className="relative" style={{ marginInlineStart: offset }}>
                <div ref={isCurrent ? currentRef : undefined}>
                  <PathNodeCircle
                    lesson={lesson}
                    T={T}
                    onClick={() =>
                      lesson.draft
                        ? undefined
                        : onOpenLesson?.(levelCode, lesson.slug)
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── the screen ─────────────────────────────────────────────────────────── */

export function PathMap({
  lang,
  summary,
  map,
  loading = false,
  user = null,
  onNavigate,
  onOpenLesson,
  onOpenAuth,
}) {
  const T = (ar, en) => _resolveTranslation(lang, ar, en);
  const levels = map?.levels ?? [];
  const completion = summary?.completion ?? {};
  const startLevel = summary?.startLevel ?? 'A1';
  const cur = summary?.current ?? null;
  const authenticated = Boolean(summary?.authenticated);

  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (!selected && map) setSelected(cur?.level || startLevel);
  }, [map, cur?.level, startLevel, selected]);

  const selLevel = levels.find((l) => l.code === selected);
  const selCompletion = completion[selected] ?? { done: 0, total: 0 };
  const selPct = selCompletion.total ? Math.round((selCompletion.done / selCompletion.total) * 100) : 0;

  const levelOpen = (code) => {
    const lv = levels.find((l) => l.code === code);
    return Boolean(lv?.units?.some((u) => u.lessons?.some((l) => l.state !== 'locked')));
  };

  const revisits = useMemo(
    () =>
      (selLevel?.units ?? [])
        .flatMap((u) => u.lessons ?? [])
        .filter((l) => l.state === 'completed'),
    [selLevel],
  );

  const currentRef = useRef(null);
  const didScroll = useRef(false);
  useEffect(() => {
    if (!map || didScroll.current) return;
    didScroll.current = true;
    const el = currentRef.current;
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [map, selected]);

  const openCurrent = () => {
    if (!cur) return;
    if (!authenticated) {
      onOpenAuth?.();
      return;
    }
    if (cur.draft) return;
    onOpenLesson?.(cur.level || startLevel, cur.slug);
  };

  /* ── loading skeleton ─────────────────────────────────────────────────── */
  if (loading && !map) {
    return (
      <div className="vx-font space-y-4" aria-busy="true">
        <div className="h-[68px] animate-pulse rounded-[16px] bg-[var(--vxp-surface-3)]" />
        <div className="h-[320px] animate-pulse rounded-[20px] bg-[var(--vxp-surface-3)]" />
      </div>
    );
  }

  const chips = chipsFor(cur?.kind, parseTopic(cur?.subtitle ?? ''), T);
  const totalLessons = selCompletion.total || 0;

  return (
    <div className="vx-font space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* ═══════════════ LEFT: level tabs + unit paths ═══════════════ */}
        <div className="min-w-0 space-y-4">
          {/* Level tabs (p.04: five tiles; selected solid blue with pct) */}
          <div className="grid grid-cols-5 gap-2">
            {levels.map((lv) => {
              const isActive = lv.code === selected;
              const open = levelOpen(lv.code);
              const c = completion[lv.code] ?? { done: 0, total: 0 };
              const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <button
                  key={lv.code}
                  type="button"
                  disabled={!open}
                  title={
                    open
                      ? `${lv.title} — ${pct}%`
                      : T('مقفل — أكمل اختبار المستوى السابق', 'Locked — pass the previous level check')
                  }
                  onClick={() => open && setSelected(lv.code)}
                  className={`flex h-[62px] flex-col items-center justify-center gap-0.5 rounded-[14px] transition-colors sm:h-[68px] sm:rounded-[16px] ${
                    isActive
                      ? 'bg-[var(--vxp-primary)] text-white shadow-[var(--vxp-shadow)]'
                      : open
                        ? `bg-[var(--vxp-surface-3)] text-[var(--vxp-text)] hover:bg-[var(--vxp-primary-tint)] ${FOCUS_RING}`
                        : `cursor-not-allowed bg-[var(--vxp-surface-3)] text-[var(--vxp-dim)]`
                  }`}
                >
                  <span className="text-[17px] font-extrabold sm:text-[19px]">{lv.code}</span>
                  {open ? (
                    <span
                      className={`text-[11px] font-bold ${isActive ? 'text-white/85' : 'text-[var(--vxp-dim)]'}`}
                    >
                      {pct}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--vxp-dim)]">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {T('مقفل', 'Locked')}
                    </span>
                  )}
                </button>
              );
            })}
            {levels.length === 0 &&
              ['A1', 'A2', 'B1', 'B2', 'C1'].map((code) => (
                <div key={code} className="h-[62px] rounded-[14px] bg-[var(--vxp-surface-3)]" />
              ))}
          </div>

          {/* Unit sections with the node path */}
          {selLevel ? (
            (selLevel.units ?? []).map((unit, i) => (
              <UnitSection
                key={unit.id}
                unit={unit}
                levelCode={selLevel.code}
                unitIndex={i}
                onOpenLesson={onOpenLesson}
                currentRef={currentRef}
                T={T}
              />
            ))
          ) : (
            <Card>
              <EmptyState
                icon={Trophy}
                title={T('لا يوجد محتوى في هذا المستوى بعد', 'No content in this level yet')}
              />
            </Card>
          )}
        </div>

        {/* ═══════════════ RIGHT rail ═══════════════ */}
        <div className="min-w-0 space-y-4">
          {/* Current lesson card (2px blue border) */}
          {cur ? (
            <div className="rounded-[20px] border-2 border-[var(--vxp-primary)] bg-[var(--vxp-surface)] p-5 shadow-[var(--vxp-shadow)]">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-[var(--vxp-primary)]">
                {T('الدرس الحالي', 'Current lesson')} · {cur.lessonNo ?? '—'} {T('من', 'of')}{' '}
                {totalLessons}
              </p>
              <h2 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-[var(--vxp-text)]">
                {cur.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--vxp-dim)]">
                {cur.objective}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Chip key={c.label} variant={c.variant} icon={c.icon}>
                    {c.label}
                  </Chip>
                ))}
              </div>
              <Btn
                variant="primary"
                size="md"
                icon={ArrowRight}
                className="mt-4 w-full"
                disabled={cur.draft}
                onClick={openCurrent}
              >
                {cur.draft ? T('قيد الإنهاء', 'Being finalized') : T('ابدأ الدرس', 'Start lesson')}
              </Btn>
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={Trophy}
                title={T('أنجزت هذا المستوى بالكامل', 'You finished this level')}
                hint={T(
                  'أكمل اختبار المستوى لفتح المستوى التالي.',
                  'Pass the level check to unlock the next level.',
                )}
                action={
                  <Btn variant="primary" icon={ArrowRight} onClick={() => onNavigate('placement')}>
                    {T('اختبار المستوى', 'Level check')}
                  </Btn>
                }
              />
            </Card>
          )}

          {/* Level summary card */}
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[16px] font-extrabold text-[var(--vxp-text)]">
                {selected} · {selLevel?.title || ''}
              </span>
              <span className="shrink-0 text-[13px] text-[var(--vxp-dim)]">
                <b className="text-[15px] font-extrabold text-[var(--vxp-text)]">
                  {selCompletion.done}
                </b>{' '}
                / {totalLessons} {T('دروس', 'lessons')}
              </span>
            </div>
            <ProgressBar value={selPct / 100} className="mt-3" ariaLabel={`${selected} progress`} />
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-semibold text-[var(--vxp-dim)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--vxp-success)]" />
                {T('منجز', 'Done')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--vxp-primary)]" />
                {T('الحالي', 'Current')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--vxp-track)]" />
                {T('مقفل', 'Locked')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--vxp-amber-text)]" />
                {T('مراجعة', 'Revision')}
              </span>
            </div>
          </Card>

          {/* Revisit anytime */}
          <Card>
            <CardTitle title={T('راجع في أي وقت', 'Revisit anytime')} />
            {revisits.length === 0 ? (
              <p className="py-2 text-[13px] text-[var(--vxp-dim)]">
                {T('أكمل دروساً لتظهر هنا للمراجعة.', 'Complete lessons to revisit them here.')}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--vxp-border)]">
                {revisits.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onOpenLesson?.(selLevel.code, l.slug)}
                      className={`flex w-full items-center gap-3 py-2.5 text-start ${FOCUS_RING} group rounded`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--vxp-success)] text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--vxp-text)] group-hover:text-[var(--vxp-primary)]">
                        {l.title}
                      </span>
                      {l.bestScore != null && (
                        <span className="shrink-0 text-[13px] font-semibold text-[var(--vxp-dim)]">
                          {T('النتيجة', 'Score')} {l.bestScore}%
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Link back to the dashboard */}
          <div className="flex items-center justify-center gap-2">
            <Eyebrow className="!text-[11px]">{T('الرئيسية', 'Dashboard')}</Eyebrow>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`inline-flex items-center gap-1 rounded text-[12px] font-bold text-[var(--vxp-primary)] transition-colors hover:brightness-110 ${FOCUS_RING}`}
            >
              {T('لوحة التحكم', 'Back to dashboard')}
              <ArrowRight className={`h-3.5 w-3.5 ${RTL_FLIP}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
