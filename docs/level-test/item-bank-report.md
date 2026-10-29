# Venoxa Level Test — item bank generation report

- Model: `nvidia/nemotron-3-ultra-550b-a55b:free`
- Generated: 2026-10-29T00:29:00.655Z
- Items: **101** · passages: **8**
- Verification pass: enabled

## Counts by level and type

| Level | Grammar | Vocabulary | Reading | Listening | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| A1 | 14 | 8 | 12 | 6 | 40 |
| A2 | 13 | 8 | 12 | 6 | 39 |
| B1 | 14 | 8 | 0 | 0 | 22 |
| B2 | 0 | 0 | 0 | 0 | 0 |
| C1 | 0 | 0 | 0 | 0 | 0 |
| C2 | 0 | 0 | 0 | 0 | 0 |

## Correct-option distribution (before per-session shuffling)

A: 32 · B: 34 · C: 21 · D: 14

## Rejected during validation

| Reason | Count |
| --- | ---: |
| verify-missing | 27 |
| verify-mismatch | 9 |
| option-length-outlier | 4 |
| verify-implausible-distractor | 4 |
| empty-batch | 2 |
| duplicate-stem | 2 |
| verify-ambiguous | 2 |
| verify-failed-kept | 1 |
| fatal-B1-listening | 1 |
| fatal-B2-grammar | 1 |
| fatal-B1-reading | 1 |
| fatal-B2-vocab | 1 |
| fatal-B2-reading | 1 |
| fatal-B2-listening | 1 |
| fatal-C1-grammar | 1 |
| fatal-C1-vocab | 1 |
| fatal-C1-reading | 1 |
| fatal-C1-listening | 1 |
| fatal-C2-grammar | 1 |
| fatal-C2-vocab | 1 |
| fatal-C2-reading | 1 |
| fatal-C2-listening | 1 |

## Review requirements

- Every generated item is `reviewed=false` and `status=draft`.
- A teacher must review a sample of at least 20 items across levels before activation.
- **All C1 and C2 items must be reviewed** before they are activated.
- Check that no item reproduces a published exam question; the generator prompts for original content, but human review is the final safeguard.
- After review, activate items with: `update lt_items set reviewed = true, status = 'active' where id = ...;`
