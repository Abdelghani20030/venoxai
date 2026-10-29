# Venoxa Level Test — Phase A simulation report

- Learners: **2,000** in standard mode, **1,000** in quick mode (abilities evenly spread from −3 to +3 logits)
- RNG seed: `20261029` (deterministic)
- Bank: 240 synthetic Rasch items (40 per CEFR level; grammar 14 / vocab 8 / reading 12 / listening 6)
- Engine: 1PL EAP, N(0, 1.5) prior, grid −4…4 step 0.05, early-step clip 1 logit for the first 6 answers

## Standard mode (max 32 items)

| Metric | Result | Target |
| --- | ---: | ---: |
| Mean absolute error (logits) | **0.296** | < 0.40 |
| RMSE (logits) | 0.370 | — |
| Bias (estimated − true) | -0.000 | ≈ 0 |
| Average items answered | 32.0 (median 32) | 20–32 |
| CEFR band exact | 74.9% | — |
| CEFR band within one | 100.0% | — |
| 95% CI coverage | 94.5% | ≈ 95% |
| Average posterior SE | 0.365 | — |

### Accuracy by true CEFR band

| True band | Learners | MAE | Band exact |
| --- | ---: | ---: | ---: |
| A1 | 325 | 0.330 | 73.5% |
| A2 | 333 | 0.293 | 74.5% |
| B1 | 334 | 0.270 | 74.9% |
| B2 | 333 | 0.267 | 74.5% |
| C1 | 333 | 0.313 | 71.5% |
| C2 | 342 | 0.305 | 80.1% |

### Stop reasons

| Reason | Sessions | Share |
| --- | ---: | ---: |
| max-items | 1990 | 99.5% |
| se | 10 | 0.5% |

### Item exposure

- Mean shows per item: 266.4 (13.3% of learners)
- Median: 271 · 95th percentile: 436 · max: 655 (32.8%)
- Items never shown: 0 / 240 (0.0%)
- Most exposed items: `g-B1-10` (655), `g-B2-10` (650), `g-B1-14` (629), `g-B1-1` (619), `g-B2-11` (603), `r-A2-1-1` (538), `r-B1-3-1` (489), `r-A2-2-1` (481)

## Quick mode (max 15 items, less precise)

| Metric | Result |
| --- | ---: |
| Mean absolute error (logits) | **0.422** |
| CEFR band exact | 62.2% |
| CEFR band within one | 99.4% |
| Average items answered | 14.9 |
| 95% CI coverage | 94.6% |

## Notes

- The synthetic bank uses seed difficulties by CEFR tag with ±0.55-logit jitter, so these numbers measure the engine, not the quality of the real item bank. Real-bank accuracy depends on item calibration and review.
- The early-step clip limits how far one lucky answer can move the reported theta in the first six items; the posterior SE is unaffected.
- With 1PL, 32 perfectly targeted items yield SE ≈ 0.354, so the SE < 0.35 stop rule is reached only in a small minority of sessions; most learners use the 32-item cap. This is expected from the specified model and matches the ~25-minute target. The 20-item minimum still applies when a session times out or runs out of items.
- Exposure control picks randomly among the five most informative candidates (or passages), which spreads usage across the bank; items near the middle of the ability range are naturally shown most often.
- Item selection targets the 35/20/30/15 content mix. Reading is served passage-by-passage, so the mix can overshoot by one passage early in a session and self-corrects later.
