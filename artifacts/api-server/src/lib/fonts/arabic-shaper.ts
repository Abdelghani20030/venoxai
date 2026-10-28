// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// arabic-shaper.ts — minimal RTL shaping for pdf-lib text (certificates).
//
// pdf-lib draws codepoints left-to-right with no bidi / Arabic joining, so
// plain Arabic renders reversed and disconnected. This module converts a name
// line into { text, isArabic } RUNS in VISUAL order:
//   • Arabic runs get Unicode presentation forms (isol/init/medi/fina chosen
//     by joining context) + lam-alef ligatures, then are reversed so drawing
//     left-to-right produces correct right-to-left script
//   • paragraph direction follows the first strong character
// (Data table generated from the Unicode Character Database; see
//  scripts/src/level-test/gen-arabic-table.ts.)
// ─────────────────────────────────────────────────────────────────────────────
import { FORMS, JOIN, LAMALEF } from "./arabic-presentation";

const AR_BASE = /[\u0620-\u064A\u066E-\u06D3\u0640]/;
const MARK_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;

// lam-alef ligature variants: lam → alef → { isol, fina } presentation cps
const LIGA = new Map<string, Map<string, { isol?: number; fina?: number }>>();
for (const l of LAMALEF) {
  if (0x0644 !== l.a) continue;
  const inner = LIGA.get(String(l.a)) ?? new Map();
  const slot = inner.get(String(l.b)) ?? {};
  if (l.kind === "isol") slot.isol = l.cp;
  if (l.kind === "fina") slot.fina = l.cp;
  inner.set(String(l.b), slot);
  LIGA.set(String(l.a), inner);
}

interface Tok {
  cp: number;              // base codepoint (or alef cp for lam-alef)
  jt: string;              // joining type R/D/L/U/C/T
  la?: number;             // lam-alef: ligature forms {isol, fina}
  mark?: boolean;          // zero-width combining mark, glued to previous base
}

function tokenize(text: string): Tok[] {
  const out: Tok[] = [];
  const cps = [...text].map(c => c.codePointAt(0)!);
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (cp === 0x0644 && i + 1 < cps.length) {
      const liga = LIGA.get(String(cp))?.get(String(cps[i + 1]));
      if (liga) { out.push({ cp: cps[i + 1], jt: "R", la: 1 }); i++; continue; }
    }
    const isMark = MARK_RE.test(String.fromCodePoint(cp)) || JOIN[cp] === "T";
    out.push({ cp, jt: isMark ? "T" : (JOIN[cp] ?? "U"), ...(isMark ? { mark: true } : {}) });
  }
  return out;
}

function pickForm(cp: number, want: "medi" | "fina" | "init" | "isol"): number {
  const f = FORMS[cp] || {};
  for (const k of [want, "isol", "fina", "init", "medi"]) {
    if (f[k]) return parseInt(f[k], 16);
  }
  return cp; // no presentation form for this char (e.g. rare letter) — draw as-is
}

/** Shape one pure-Arabic logical run into a VISUAL (reversed) string of presentation forms. */
export function shapeArabicRun(text: string): string {
  const toks = tokenize(text);

  const prevBase = (i: number) => { for (let k = i - 1; k >= 0; k--) if (!toks[k].mark) return k; return -1; };
  const nextBase = (i: number) => { for (let k = i + 1; k < toks.length; k++) if (!toks[k].mark) return k; return -1; };
  const joinsFwd = (t: Tok) => t.jt === "D" || t.jt === "L" || t.jt === "C";
  const joinsBack = (t: Tok) => t.jt === "D" || t.jt === "R" || t.jt === "C";

  const visual: string[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.mark) continue; // drawn attached to the previous base below
    const pb = prevBase(i), nb = nextBase(i);
    const prevOk = pb >= 0 && joinsFwd(toks[pb]);
    const nextOk = nb >= 0 && joinsBack(toks[nb]) && joinsFwd(t);
    let glyph: number;
    if (t.la) {
      // lam-alef ligature: FINAL variant connects from the left (previous joins lam)
      const v = LIGA.get(String(0x0644))!.get(String(t.cp)) || {};
      glyph = (prevOk ? v.fina : v.isol) ?? v.isol ?? v.fina ?? t.cp;
    } else {
      glyph = pickForm(t.cp, prevOk && nextOk ? "medi" : prevOk ? "fina" : nextOk ? "init" : "isol");
    }
    let s = String.fromCodePoint(glyph);
    for (let k = i + 1; k < toks.length && toks[k].mark; k++) s += String.fromCodePoint(toks[k].cp);
    visual.push(s);
  }
  return visual.reverse().join("");
}

/**
 * Segment a display name into visual-order { text, isArabic } runs.
 * Paragraph direction = first strong character (Arabic ⇒ RTL).
 */
export function segmentName(name: string): Array<{ text: string; isArabic: boolean }> {
  const isArabicChar = (ch: string) => AR_BASE.test(ch);
  const isLatinChar = (ch: string) => /[A-Za-z0-9\u00C0-\u024F]/.test(ch);

  // split into strong runs; neutrals attach to the current run
  const segs: Array<{ text: string; isArabic: boolean }> = [];
  let cur = "";
  let curAr: boolean = true;
  for (const ch of name) {
    const strong = isArabicChar(ch) ? true : isLatinChar(ch) ? false : null;
    if (strong !== null && cur && strong !== curAr) {
      segs.push({ text: cur, isArabic: curAr });
      cur = "";
    }
    cur += ch;
    if (strong !== null) curAr = strong;
  }
  if (cur.trim()) segs.push({ text: cur, isArabic: curAr });

  const shaped = segs.map(s => ({ text: s.isArabic ? shapeArabicRun(s.text) : s.text, isArabic: s.isArabic }));
  const paraRTL = isArabicChar(segs[0]?.text ?? "a");
  return paraRTL ? shaped.reverse() : shaped;
}
