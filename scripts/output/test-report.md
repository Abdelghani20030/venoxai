# Venoxa Level Test — item bank generation report

- Model: `openai/gpt-oss-120b`
- Generated: 2026-10-29T09:19:33.337Z
- Items: **2** · passages: **0**
- Verification pass: disabled

## Counts by level and type

| Level | Grammar | Vocabulary | Reading | Listening | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| A1 | 0 | 0 | 0 | 0 | 0 |
| A2 | 0 | 0 | 0 | 0 | 0 |
| B1 | 0 | 0 | 0 | 0 | 0 |
| B2 | 2 | 0 | 0 | 0 | 2 |
| C1 | 0 | 0 | 0 | 0 | 0 |
| C2 | 0 | 0 | 0 | 0 | 0 |

## Correct-option distribution (before per-session shuffling)

A: 1 · B: 0 · C: 1 · D: 0

## Rejected during validation

None.

## Review requirements

- Every generated item is `reviewed=false` and `status=draft`.
- A teacher must review a sample of at least 20 items across levels before activation.
- **All C1 and C2 items must be reviewed** before they are activated.
- Check that no item reproduces a published exam question; the generator prompts for original content, but human review is the final safeguard.
- After review, activate items with: `update lt_items set reviewed = true, status = 'active' where id = ...;`
