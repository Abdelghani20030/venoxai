# Venoxa Level Test — Adaptive Engine Simulation Report

_Script: `scripts/src/level-test/simulate.ts` (deterministic seeds; rerunnable.)_

**Bank:** 240 synthetic items — 10 per type per CEFR level, difficulty = CEFR seed ± uniform(0.5 logit).
This matches the shape of the real seed bank (~240 items, 40/level) and the ±0.5 within-level spread the generator produces.

**Learners:** 2000 simulated, true ability θ stratified over **[−3, 3]** (≈ A1 … C2), answers drawn with probability `raschP(θ, b)`.

## Full mode (stop at SE < 0.35 & ≥ 20 items, hard cap 32)

| Metric | Value | Target | Status |
|---|---|---|---|
| **MAE of θ estimate** | 0.291 logits | < 0.40 | ✔ pass |
| median \|err\| / p90 \|err\| | 0.241 / 0.610 | — | — |
| MAE of 0–100 score | 5.08 pts | — | — |
| avg items answered | 32.0 | 20–32 | ✔ |
| CEFR band exact | 73.7% | — | — |
| CEFR band ±1 | 100.0% | ≥ 95% recommended | ✔ |
| score-CI coverage | 96.7% | ≈ 95% i.i.d. | ✔ acceptable |

> CI coverage may sit below 95% because the EAP posterior is slightly overconfident under a truncated grid and item-response dependence (adaptive selection); a ±1-band answer remains useful for placement.

**Note on the SE stop rule:** under 1PL, max per-item information is 0.25 (p = 0.5), so SE after 20 perfectly-targeted items can't fall below ~0.45 and after 32 tops out ≈ 0.35. With the ±0.5 within-level difficulty spread and top-5 exposure randomization, the SE<0.35 rule becomes a rarely-binding safety valve — **typical sessions run the full 32 items ≈ 25 minutes**, which matches the spec ("minimum 20, maximum 32, about 25 minutes") and the preview's "31 questions · 24 minutes" sample. The rule will start binding after recalibration if items concentrate harder around θ.

## Quick mode (max 15 items — deliberately less precise)

| Metric | Value |
|---|---|
| MAE of θ | 0.417 logits |
| median / p90 \|err\| | 0.353 / 0.875 |
| avg items | 15.0 |
| band exact / ±1 | 63.7% / 99.4% |

As intended, Quick trades precision for length (1.4× the full-mode error).

## Item exposure (full mode)

- Items shown: **240/240** (0 unused)
- Max exposure of one item: **35.6%** of learners (`i125` = 713 learners)
- Top-10 most-shown: `i125` — 36% · `i139` — 34% · `i100` — 33% · `i113` — 33% · `i153` — 33% · `i122` — 23% · `i88` — 23% · `i82` — 22% · `i136` — 22% · `i103` — 22%
- All 240 items appear at least once — top-5 randomization spreads the load.
- Everything is seeded `draft` after generation; recalibration will smooth exposure further.

## MAE by true θ (full mode)

| true θ | n | MAE (logits) | avg items |
|---|---|---|---|
| -3 | 84 | 0.309 | 31.9 |
| -2.5 | 166 | 0.288 | 32.0 |
| -2 | 167 | 0.318 | 32.0 |
| -1.5 | 166 | 0.288 | 32.0 |
| -1 | 167 | 0.289 | 32.0 |
| -0.5 | 167 | 0.252 | 32.0 |
| 0 | 167 | 0.257 | 32.0 |
| 0.5 | 166 | 0.308 | 32.0 |
| 1 | 167 | 0.291 | 32.0 |
| 1.5 | 166 | 0.272 | 32.0 |
| 2 | 167 | 0.302 | 32.0 |
| 2.5 | 167 | 0.300 | 32.0 |
| 3 | 83 | 0.337 | 31.7 |

## Notes
- Early-step clamp (±1 logit/answer) keeps lucky first guesses from jumping a level; visible only in the first ~3 answers.
- Stratified learner spread: `θ = −3 + 6·(i + frac(i·0.375))/2000` (deterministic, uniform-ish).
- Recalibration script (after ≥100 real responses/item) will replace seed difficulties; engine code is agnostic to `difficulty_b` provenance.

**Verdict: the engine meets the accuracy targets with the seed bank** — MAE 0.29 < 0.40 logits; 100% of placements within one CEFR band.
