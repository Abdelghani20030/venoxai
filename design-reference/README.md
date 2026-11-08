# design-reference

Approved design for the Venoxa AI redesign. Put this whole folder in the repo root as `design-reference/`.

| File | What it is |
|---|---|
| `pages/page-01.png` … `page-22.png` | The approved screens, 1280×820 |
| `showcase.html` | Exact HTML + CSS that produced the pages (one `<section class="page">` per page) |
| `reference-tokens.css` | Light and dark tokens (`--vx-*`) and component dimensions |
| `PathMap.reference.jsx` | Tested React component for the Learning Path map (exact geometry, 5 states, RTL, keyboard accessible) |

## Page map

| Page | Screen |
|---|---|
| 1 | Cover (not a screen) |
| 2 | Navigation before and after: all 26 existing destinations and where they go |
| 3 | Dashboard (desktop) |
| 4 | Learning Path (desktop, light) |
| 5 | Lesson player |
| 6 | Practice feedback + lesson complete |
| 7 | Placement flow |
| 8 | My Library hub + My Progress |
| 9 | Mobile: dashboard, path, lesson |
| 10 | Learning Path, dark mode |
| 11 | Five states + how server-side locking works |
| 12 | My Progress › Study Plan (existing generator, restyled) |
| 13 | Library › Vocabulary |
| 14 | Library › Grammar |
| 15 | Library › Listening, Reading, Writing |
| 16 | Library › Speaking, Pronunciation, Test Generator |
| 17 | Level test, result, certificate |
| 18 | Tools: Smart Translation, Tone Rewriter, Sentence Diagrammer |
| 19 | Tools: Word Family, Collocations, Etymology |
| 20 | Tools: Word of the Day, Idiom of the Day, Focus Timer |
| 21 | My Progress › Profile |
| 22 | Complete map of every page's new home |

All names, numbers and dates in the mockups are sample values. Real screens must use real data.
