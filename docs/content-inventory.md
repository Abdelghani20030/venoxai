# Venoxa content inventory — Phase 0

**Date:** 2026-11-08  
**Status:** Phase 0 complete for review. Documentation only — no runtime code, schema, seed, or database changes were made.  
**Purpose:** Establish what content already exists, how it is ordered, and exactly how the new Learning Path curriculum will be assembled from it. This is the input to CHECKPOINT 1.

## Scope and evidence

| Area | Source inspected |
|---|---|
| Grammar | `artifacts/venoxa/src/App.jsx` → `GRAMMAR_CEFR_DETAILED` (~line 1605), `LEVEL_ORDER`, `planGrammarRules` (~line 5506) |
| Vocabulary | `artifacts/venoxa/public/data/langeek.csv`, `global.csv`, `phrasal.csv`, `idioms.csv`, `slang.csv`; loader in `artifacts/venoxa/src/vocabData.js` |
| Listening / reading | `ListeningReading` in `artifacts/venoxa/src/App.jsx` (~line 8944) |
| Writing | `Writing` in `artifacts/venoxa/src/App.jsx` (~line 9459), `SPEAKING_TOPICS` (~line 1681), `/api/chat` and `/api/chat/stream` |
| Exercises | Test Generator in `artifacts/venoxa/src/App.jsx` (~line 11816), `lib/path-server.ts`, `migrations/level-test.sql` |
| Live path state | Read-only query against the Supabase database configured in `.env` (credentials not printed) |
| Path entry flow | `artifacts/venoxa/src/LearningPath.jsx`, `artifacts/venoxa/src/pathApi.js` |

No source of lesson content was invented for this document. Counts and examples come from the files and database above. The curriculum preview in Section 8 is generated deterministically from the existing grammar rules and vocabulary CSVs.

## Key numbers

| Item | Count |
|---|---:|
| CEFR levels with grammar data | 5 (A1–C1; no C2) |
| Grammar categories | 48 |
| Grammar rules | 215 |
| `langeek.csv` words | 8,840 |
| `langeek.csv` level/category groups | 248 |
| `global.csv` clean CEFR rows | 5,268 |
| Listening sources | 8 |
| Reading sources | 7 |
| Writing topics | 30 |
| Test Generator question types | 22 |
| Active level-test items | 101 (A1–B1) |
| Path lessons currently in DB | 60 (20 invented A1 published; 40 A2–C1 outlines) |
| Path content rows / exercises / progress rows | 0 / 0 / 0 |
| Preview lessons / units / total nodes | 87 / 17 / 126 |

---

## 1. Grammar curriculum source

### 1.1 Shape and location

`GRAMMAR_CEFR_DETAILED` is a single array in `artifacts/venoxa/src/App.jsx`:

```js
{
  level: "A1",
  labelAr: "مبتدئ",
  labelEn: "Beginner",
  color: "#22c55e",
  categories: [
    { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["...", "..."] }
  ]
}
```

Each level has an English label, an Arabic label, a colour, and an ordered list of categories. Each category has an English name, an Arabic name, and an ordered list of rule strings. Rule strings are full teaching statements, sometimes with examples in parentheses. There is no separate example translation field and no per-rule ID.

### 1.2 Level and rule counts

| Level | English label | Arabic label | Categories | Rules |
|---|---|---|---:|---:|
| A1 | Beginner | مبتدئ | 11 | 46 |
| A2 | Elementary | أساسي | 12 | 52 |
| B1 | Pre-Intermediate | تحت المتوسط | 11 | 49 |
| B2 | Upper-Intermediate | فوق المتوسط | 10 | 57 |
| C1 | Advanced | متقدم | 4 | 11 |
| **Total** | | | **48** | **215** |

C2 has no grammar entry at all.

### 1.3 Category order and plan order

The category order in each level is **alphabetical by English category name**, not a pedagogical sequence. A1 therefore begins with `Adjectives & Adverbs`, then `Articles & Quantifiers`, `Conditionals`, `Future Tenses`, and so on. The last A1 category is `Questions`.

The existing study-plan generator (`planGrammarRules` in `App.jsx`) produces a flat rule list in this order:

1. All rules from the user's current level through the level immediately below the target, in category order.
2. Only the **first rule** of the target level as the milestone.
3. No de-duplication and no re-levelling.

Examples:

- Current A1, target B1 → all A1 rules + all A2 rules + the first B1 rule.
- Current A1, target C2 → all A1–C1 rules; C2 contributes no milestone because no C2 data exists.
- Current B2, target C1 → all B2 rules + the first C1 rule.

The redesign reuses this order exactly. It does not sort, dedupe, or move rules between levels. The anomalies in Section 9 are reported, not corrected.

### 1.4 Grammar category inventory

The following tables are generated directly from `GRAMMAR_CEFR_DETAILED`.

#### A1 — Beginner / مبتدئ (11 categories · 46 rules)

| # | Category | Arabic | Rules |
|---:|---|---|---:|
| 1 | Adjectives & Adverbs | الصفات والأحوال | 3 |
| 2 | Articles & Quantifiers | أدوات التعريف | 2 |
| 3 | Conditionals | الجمل الشرطية | 1 |
| 4 | Future Tenses | المستقبل | 3 |
| 5 | Gerund & Infinitive | المصدر وإن+فعل | 2 |
| 6 | Past Tenses | الماضي | 3 |
| 7 | Modal Verbs | الأفعال الناقصة | 7 |
| 8 | Prepositions | حروف الجر | 2 |
| 9 | Pronouns | الضمائر | 6 |
| 10 | Present Tenses | المضارع | 11 |
| 11 | Questions | الأسئلة | 6 |

#### A2 — Elementary / أساسي (12 categories · 52 rules)

| # | Category | Arabic | Rules |
|---:|---|---|---:|
| 1 | Adjectives & Adverbs | الصفات والأحوال | 6 |
| 2 | Articles & Quantifiers | أدوات التعريف | 2 |
| 3 | Conditionals | الجمل الشرطية | 4 |
| 4 | Conjunctions | أدوات الربط | 2 |
| 5 | Future Tenses | المستقبل | 5 |
| 6 | Gerund & Infinitive | المصدر وإن+فعل | 2 |
| 7 | Modal Verbs | الأفعال الناقصة | 8 |
| 8 | Past Tenses | الماضي | 6 |
| 9 | Prepositions | حروف الجر | 4 |
| 10 | Present Tenses | المضارع | 7 |
| 11 | Pronouns | الضمائر | 3 |
| 12 | Questions | الأسئلة | 3 |

#### B1 — Pre-Intermediate / تحت المتوسط (11 categories · 49 rules)

| # | Category | Arabic | Rules |
|---:|---|---|---:|
| 1 | Adjectives & Adverbs | الصفات والأحوال | 6 |
| 2 | Conditionals | الجمل الشرطية | 4 |
| 3 | Conjunctions | أدوات الربط | 1 |
| 4 | Future Tenses | المستقبل | 4 |
| 5 | Gerund & Infinitive | المصدر وإن+فعل | 4 |
| 6 | Modal Verbs | الأفعال الناقصة | 10 |
| 7 | Past Tenses | الماضي | 7 |
| 8 | Prepositions | حروف الجر | 2 |
| 9 | Present Tenses | المضارع | 7 |
| 10 | Pronouns | الضمائر | 2 |
| 11 | Questions | الأسئلة | 2 |

#### B2 — Upper-Intermediate / فوق المتوسط (10 categories · 57 rules)

| # | Category | Arabic | Rules |
|---:|---|---|---:|
| 1 | Adjectives & Adverbs | الصفات والأحوال | 4 |
| 2 | Conditionals | الجمل الشرطية | 3 |
| 3 | Future Tenses | المستقبل | 6 |
| 4 | Gerund & Infinitive | المصدر وإن+فعل | 5 |
| 5 | Modal Verbs | الأفعال الناقصة | 13 |
| 6 | Past Tenses | الماضي | 9 |
| 7 | Prepositions | حروف الجر | 2 |
| 8 | Present Tenses | المضارع | 9 |
| 9 | Pronouns | الضمائر | 3 |
| 10 | Questions | الأسئلة | 3 |

#### C1 — Advanced / متقدم (4 categories · 11 rules)

| # | Category | Arabic | Rules |
|---:|---|---|---:|
| 1 | Adjectives & Adverbs | الصفات والأحوال | 2 |
| 2 | Modal Verbs | الأفعال الناقصة | 2 |
| 3 | Conditionals | الجمل الشرطية | 3 |
| 4 | Vocabulary & Collocations | المفردات والتراكيب | 4 |

---

## 2. Vocabulary sources

### 2.1 `langeek.csv`

- Path: `artifacts/venoxa/public/data/langeek.csv`
- Header: `Category, Level, Word, Type, Meaning, Sentence`
- Rows: **8,840** data rows.
- Levels: A1–C1.
- `Meaning` is an English definition; `Sentence` is an English example. There is no Arabic gloss in this file.
- Each row belongs to exactly one level and one topic category.

| Level | Words | Categories |
|---|---:|---:|
| A1 | 608 | 32 |
| A2 | 1,581 | 50 |
| B1 | 1,850 | 58 |
| B2 | 2,224 | 62 |
| C1 | 2,577 | 46 |
| **Total** | **8,840** | **248** |

This is the primary source for lesson vocabulary because it has topic categories and example sentences. Its weakness is that it has no Arabic meanings.

### 2.2 `global.csv`

- Path: `artifacts/venoxa/public/data/global.csv`
- Header: `English, نوع الكلمة, تصنيف, معنى الكلمة, جملة, مرادفات` (English, word type, classification, meaning, sentence, synonyms).
- Total data rows: **5,278**.
- Clean CEFR rows: **5,268** — A1 900, A2 871, B1 810, B2 1,405, C1 1,282.
- The `تصنيف` column functions as the CEFR level column, not as a topic category.
- Arabic meanings and Arabic-adjacent synonyms are useful for the Arabic side of lessons, but the file has **no topic categories** and is not yet joined to `langeek.csv`.
- 10 rows are malformed or carry multi-level values such as `B2, C1`; see Section 9.

### 2.3 Other bundled vocabulary files

| File | Rows | Header | Use |
|---|---:|---|---|
| `phrasal.csv` | 206 | `Phrasal Verb, Meaning, Example Sentence` | Phrasal-verb examples; no level/category |
| `idioms.csv` | 740 | `Topic, Idiom, Meaning, Sentence` | Idioms with topics; no CEFR level |
| `slang.csv` | 161 | `Topic, Slang, Meaning, Example Sentence` | Slang with topics; no CEFR level |

`artifacts/venoxa/src/vocabData.js` fetches all five CSVs from `/data/`, parses them, and caches the result for the session. The path preview currently uses `langeek.csv` only for word selection.

### 2.4 Vocabulary counts and A1 category list

| Level | langeek words | langeek categories | global.csv clean rows |
|---|---:|---:|---:|
| A1 | 608 | 32 | 900 |
| A2 | 1,581 | 50 | 871 |
| B1 | 1,850 | 58 | 810 |
| B2 | 2,224 | 62 | 1,405 |
| C1 | 2,577 | 46 | 1,282 |
| **Total** | **8,840** | **248** | **5,268** |

A1 vocabulary categories, in CSV order:

| # | Category | Words |
|---:|---|---:|
| 1 | Hello and Goodbye | 16 |
| 2 | People | 14 |
| 3 | Numbers 0 to 100 | 29 |
| 4 | Family | 21 |
| 5 | Colors | 14 |
| 6 | Months and Seasons | 18 |
| 7 | Time and Date | 24 |
| 8 | Personal Information | 12 |
| 9 | The Body | 9 |
| 10 | The Head and Face | 11 |
| 11 | Opposite Adjectives | 34 |
| 12 | House and Apartment | 23 |
| 13 | Furniture and Home Appliances | 9 |
| 14 | Jobs | 14 |
| 15 | Clothes and Shoes | 20 |
| 16 | Animals | 15 |
| 17 | Basic Verbs | 30 |
| 18 | Household Items | 17 |
| 19 | Food and Ingredients | 23 |
| 20 | Food and Drinks | 22 |
| 21 | Describing People | 15 |
| 22 | The Weather and Nature | 25 |
| 23 | Useful Verbs | 28 |
| 24 | School | 18 |
| 25 | City | 15 |
| 26 | Free Time Activities | 17 |
| 27 | Countries and Nationalities | 15 |
| 28 | Simple Verbs | 25 |
| 29 | Transportation | 16 |
| 30 | Directions and Continents | 16 |
| 31 | Adverbs and Pronouns | 21 |
| 32 | Prepositions and Determiners | 22 |

Malformed / multi-level `global.csv` rows: **10** — one repeated header (`English` in the level column), `guide` → `m`, and eight `B2, C1` entries: `dynamic`, `extract`, `intellectual`, `principal`, `tackle`, `terminal`, `trace`, `trigger`.

### 2.5 Preview vocabulary selection rule

The preview does **not** dump a whole category into a lesson. It selects a 20-word slice:

1. Prefer a topical category with affinity to the grammar category and not yet used.
2. If that category was used, take a fresh 20-word slice from it before jumping to an unrelated topic.
3. Otherwise fall back to the level's category order, with a light keyword match between the grammar category/rules and the vocabulary category name.
4. Never reuse a slice. A category with fewer than 5 remaining words is skipped.
5. If no topical category fits, fall back to any category with a fresh slice.

A1 has several fallback assignments because its verb topics run out: `Present Tenses` uses `School`, `Hello and Goodbye`, `Simple Verbs`, `People`; `Questions` uses `Free Time Activities` and `Furniture and Home Appliances`. These are valid words but are not strongly topical. Section 9 flags them.

---

## 3. Listening and reading sources

### 3.1 Listening sources

All eight are external links in the existing `ListeningReading` screen. Nothing is downloaded, stored, or transcribed by Venoxa.

| Source | Band | Levels | URL |
|---|---|---|---|
| Spotlight English podcast | Beginner (A1–A2) | A1, A2 | https://spotlightenglish.com/ |
| The LevelUp English Podcast | Pre-Intermediate (B1) | B1 | https://www.levelupenglish.school/podcast/ |
| British Council | Pre-Intermediate (B1) | B1 | https://learnenglish.britishcouncil.org/general-english/audio-series/podcasts |
| Luke's English Podcast | Intermediate (B1–B2) | B1, B2 | https://teacherluke.co.uk/archive-of-episodes-1-149/ |
| All Ears English Podcast | Intermediate (B1–B2) | B1, B2 | https://www.allearsenglish.com/ |
| TED Talks | Upper-Intermediate (B2) | B2, C1 | https://youtube.com/@TED?si=8y1RTw0ImlDO7By9 |
| BBC Sounds | Upper-Intermediate (B2) | B2, C1 | https://www.bbc.co.uk/sounds/podcasts |
| This American Life | Advanced (C1–C2) | C1 | https://www.thisamericanlife.org/archive |

### 3.2 Reading sources

| Source | Band | Levels | URL |
|---|---|---|---|
| Project Gutenberg | Beginner–Intermediate | A1, A2, B1, B2 | https://www.gutenberg.org |
| ESL Fast | Beginner–Intermediate | A1, A2, B1, B2 | https://www.eslfast.com |
| Storynory | Beginner–Intermediate | A1, A2, B1, B2 | https://www.storynory.com |
| ManyThings.org | Beginner–Intermediate | A1, A2, B1, B2 | https://www.manythings.org |
| Medium | Advanced | B2, C1 | https://medium.com |
| BBC News | Advanced | B2, C1 | https://www.bbc.com/news |
| The New York Times | Advanced | B2, C1 | https://www.nytimes.com |

### 3.3 Sources available per level

| Level | Listening sources | Reading sources |
|---|---:|---:|
| A1 | 1 (Spotlight) | 4 (Gutenberg, ESL Fast, Storynory, ManyThings) |
| A2 | 1 (Spotlight) | 4 (same four) |
| B1 | 4 (LevelUp, British Council, Luke's, All Ears) | 4 (Gutenberg, ESL Fast, Storynory, ManyThings) |
| B2 | 4 (Luke's, All Ears, TED, BBC Sounds) | 7 (all) |
| C1 | 3 (TED, BBC Sounds, This American Life) | 3 (Medium, BBC News, NYT) |

### 3.4 Current behaviour vs preview behaviour

- The current screen builds `currentLinks` as all listening links or all reading links; it does **not** filter by the selected level.
- The curriculum preview filters by the lesson's level and rotates sources round-robin, independently for listening and reading. A1 and A2 therefore alternate only Spotlight for listening while cycling four reading sources.
- External content cannot be bundled into the production app for copyright and offline reasons. The lesson player should keep the source as an outbound link and generate comprehension tasks around the lesson's grammar/vocabulary, not scrape the source.

---

## 4. Writing tools

### 4.1 Topic bank

`SPEAKING_TOPICS` in `App.jsx` contains **30** bilingual entries in the form `Arabic (English)`:

```js
"محادثة حرة (Free Talk)"
"السفر والمطارات (Travel & Airports)"
...
"التحديات والمصاعب (Challenges)"
```

The full list is at line ~1681. The preview parses each entry into `topicAr` (text before the parenthesis) and `topicEn` (text inside it).

### 4.2 Prompt generation

`Writing` generates a prompt when a topic is selected:

- Endpoint: `POST /api/chat/stream` (SSE), via `streamFromAPI`.
- Prompt: “Generate a clear and engaging writing prompt question about the topic … for an English language learner. Make it one direct question that encourages 2-3 paragraphs of writing. Return only the question text.”
- Output: one question; not stored in the database.
- Default token hint: 512 unless overridden.

### 4.3 Correction

`handleCorrect` calls `fetchFromGemini(prompt, AI_KEY, 2000)`, which posts to `POST /api/chat`.

The prompt requires a JSON object with exactly these fields:

```json
{
  "score": "X/10",
  "corrected_text": "fully corrected version",
  "grammar_errors": [{ "word": "...", "correction": "...", "explanation": "..." }],
  "style_tips": [{ "original": "...", "better": "...", "tip": "..." }],
  "overall": "2-3 sentences"
}
```

The backend caps `maxTokens` at **2048**. The result is parsed client-side and kept in writing history; it is not written to `path_lessons`, `path_lesson_content`, or any exercise table.

### 4.4 Preview writing cadence

Writing is optional. A lesson gets a writing topic when it is:

- every fourth path node in the level (the 0-based node counter includes revision and unit-check nodes), or
- the last lesson of a unit.

Topics rotate through the 30-entry bank. A1 receives 9 optional writing prompts across 18 lessons (lessons 1, 5, 6, 9, 13, 14, 17, 21, 22). No writing step blocks progress; it grants XP only.

---

## 5. Exercise and grading pipeline

### 5.1 What exists today

- The Test Generator offers **22** question types: fill-in-the-blank, context meaning, synonym, definition, antonym, idiom meaning, idiom completion, preposition, multiple choice, drag-and-drop, dropdown fill-in, multi-select, true/false/not given, re-order paragraphs, MC cloze, open cloze, word formation, key-word transformation, gapped text, matching headings, summary completion, and matching information.
- `buildPrompt()` (~line 11854) constructs an AI prompt from the chosen type, framework, level, topic, and count.
- The generator calls `POST /api/chat` and receives JSON; grading happens in the browser. Nothing is persisted to the Learning Path.
- The level-test item bank is the existing example of stored, server-graded questions:
  - Schema: `migrations/level-test.sql` (`lt_items`, `lt_passages`, `lt_audio`, `lt_sessions`, `lt_responses`, `lt_results`).
  - Seed: `migrations/level-test-seed.sql`; all items begin as `reviewed=false` / `status='draft'`.
  - Live count: **101 active items**, A1–B1 only.
- The path exercise table exists in `migrations/learning-path.sql`, but it has **no `status` column**. The GET-lesson endpoint selects all exercises for the lesson and deliberately omits `answer_key` and exercise explanations from the response:

```sql
select id, step, type, prompt_en, prompt_ar, options, position
  from path_lesson_exercises
 where lesson_id = $1
 order by position asc
```

- Server grading already exists in `lib/path-server.ts` (`gradeExercise`) for `multiple_choice`, `true_false`, `type_answer`, `fill_blank`, and `word_order`. Answer keys never leave the server.
- The content table's `step` check constraint currently allows only `grammar`, `vocab`, `listening`, `pronunciation`, `practice`, and `check`. There is no `reading`, `writing`, `learn`, or `words` value; those steps must be represented in the `activities` blueprint/config or added by an additive constraint migration.
- Live path exercises: **0**. Live path content: **0**. The lesson player therefore has no steps to render beyond its header.

### 5.2 Target pipeline for the redesign

The preview assumes the following, to be confirmed at CHECKPOINT 2:

1. Generate **8 questions per lesson**: 4 practice and 4 check.
2. Store them in `path_lesson_exercises` as `status='draft'`, with `answer_key` and explanations server-side only.
3. Export a review CSV and support an explicit `--approve-all` after review.
4. Filter the lesson endpoint to `status='approved'`; draft content is never served to learners.
5. Grade both Practice and Check on the server; Practice returns immediate feedback but never blocks progress. Answer keys never reach the browser in either step.
6. Only Check is required. If a lesson has no approved questions, Learn becomes the required step. Optional steps grant XP but never block progress.
7. A1 needs 18 × 8 = **144 lesson questions**, plus revision/unit-check/level-check pools. C1 currently has no active `lt_items`.

---

## 6. Database seed and live state

### 6.1 Live counts (read-only query, 2026-11-08)

| Table | Rows | Detail |
|---|---:|---|
| `path_lessons` | 60 | A1 20 published; A2 10, B1 10, B2 10, C1 10 unpublished outlines |
| `path_lesson_content` | 0 | No stored explanations/examples |
| `path_lesson_exercises` | 0 | No stored questions |
| `user_path_progress` | 0 | No learner has completed a path lesson |
| `user_path_state` | 1 | `placement_level='A1'`, `placement_source=null`, `current_lesson_id='dc72390c-84b5-44f1-b037-32f078b1bff1'` |
| `lt_items` | 101 active | A1–B1 level-test MCQs; not mapped to path lessons |

### 6.2 The published A1 rows are an external invented seed

The live A1 lessons are **not created by any SQL file in this repository**. They have generic titles such as “Introducing yourself”, “The alphabet & key sounds”, “Numbers & telling the time”, and slugs `a1-01-to-be` … `a1-20-assessment`. They do not follow the grammar categories or the preview curriculum.

| Position | Slug | Title EN |
|---:|---|---|
| 1 | `a1-01-to-be` | Introducing yourself |
| 2 | `a1-02-alphabet-sounds` | The alphabet & key sounds |
| 3 | `a1-03-numbers-time` | Numbers & telling the time |
| 4 | `a1-04-greetings` | Greetings & basic phrases |
| 5 | `a1-05-articles-nouns` | Articles & nouns (a, an, the) |
| 6 | `a1-06-colours-things` | Colours & everyday objects |
| 7 | `a1-07-family-people` | Family & people |
| 8 | `a1-08-present-simple` | Present Simple: habits & facts |
| 9 | `a1-09-questions` | Asking questions (do/does) |
| 10 | `a1-10-places-prepositions` | Places & prepositions |
| 11 | `a1-11-food-drink` | Food & drink vocabulary |
| 12 | `a1-12-can-cant` | can & can't: ability |
| 13 | `a1-13-likes-dislikes` | Likes & dislikes |
| 14 | `a1-14-there-is-are` | There is / There are |
| 15 | `a1-15-days-months` | Days, months & dates |
| 16 | `a1-16-past-simple-was` | Past Simple: was / were |
| 17 | `a1-17-weather-seasons` | Weather & seasons |
| 18 | `a1-18-clothes-shopping` | Clothes & shopping |
| 19 | `a1-19-revision` | A1 revision |
| 20 | `a1-20-assessment` | A1 final assessment |

Because `user_path_progress` has **0 rows**, these 20 lessons have no learner progress. They can be replaced by the builder, subject to the deletion policy below.

### 6.3 What the repository migration actually creates

`migrations/learning-path.sql`:

- Creates `path_lessons`, `path_lesson_content`, `path_lesson_exercises`, `user_path_progress`, and `user_path_state` with RLS policies.
- Seeds **A2–C1 outline rows only**, with `published=false`, slugs such as `a2-01-...`, and positions starting at 21.
- Uses `create table if not exists` and `on conflict (slug) do nothing`, so it is additive/idempotent.
- Does **not** create the A1 lessons. The line comment says A1 uses a separate seed that does not exist in the repository.
- Does not add a `status` column to `path_lesson_exercises`.
- The 40 A2–C1 outline rows it creates (10 per level, generic slugs such as `a2-01-...`) are **not the preview outline shape** (69 A2–C1 lessons plus revisions/checks). The builder must reconcile the old outline rows with the preview. They are unpublished and have zero progress, so they fall under the same zero-progress deletion policy; any row with progress must be preserved and reported.

### 6.4 Deletion policy for the builder

- Delete only known seed/outline rows (the invented A1 rows and the old 40 A2–C1 outlines) and only when they have **zero progress**.
- Never delete a lesson with any `user_path_progress` row, and never delete a lesson whose slug is not in a known seed/outline list.
- Insert the new curriculum idempotently by slug; update titles/positions in place when the slug already exists.
- `user_path_state.current_lesson_id` is `on delete set null`, so deleting the invented current lesson will clear the pointer. The builder must re-point it to the first new A1 lesson (or leave it null so the API picks the placement frontier) after the new rows exist.
- All SQL remains additive and is run manually by the owner in the Supabase SQL Editor. The repository will document the run order.

---

## 7. “Start from A1” current behaviour

### 7.1 Code path

`LearningPath` decides its phase from `GET /api/path`:

```js
if (res.ok && res.data) {
  const data = res.data;
  setMap(data);
  setPhase((data?.progress?.publishedLessons ?? 0) > 0 ? 'ready' : 'empty');
} else if (res.status === 401) {
  setPhase('auth');
} else if (res.data?.error === 'schema_missing' || res.status === 503) {
  setPhase('setup');
} else {
  setPhase('error');
}
```

The button is rendered only in the `empty` phase:

```js
const startFromA1 = async () => {
  setPlacing(true);
  const res = await setPlacement({ level: 'A1' });
  setPlacing(false);
  if (res.ok) setReloadKey((k) => k + 1);
};
```

`setPlacement` posts to `/api/path/placement` with `{ level: 'A1' }` and caches the returned map on success.

### 7.2 Why it can look like nothing happens

| State | What the learner sees | Cause |
|---|---|---|
| Signed out | Auth card, no button | `GET /api/path` returns 401; expected |
| Schema missing | Setup card, no button | API returns `schema_missing` / 503 |
| No published lessons | Empty card with “Start from A1” | `progress.publishedLessons === 0` |
| Placement request fails | Button stops spinning; no message | `res.ok` false; error/status ignored |
| Placement succeeds but A1 has no published lessons | Same empty card | Reload returns `publishedLessons` still 0 |
| Placement succeeds and A1 is published | Path should render A1 | Ready map; no explicit navigation to the first lesson |

The deterministic repro is a database that has run `migrations/learning-path.sql` but has no A1 seed: all 40 A2–C1 rows are unpublished, so `publishedLessons` is 0. Pressing “Start from A1” successfully writes placement but the reload is still empty. The UI gives no explanation and the button reappears, so it looks like a no-op.

The live database currently has 20 invented published A1 lessons, so a signed-in request against that database should reach `ready` rather than `empty`. That does not fix the fresh-install case, and it does not fix the ignored-error case.

### 7.3 Required fix (to implement after CHECKPOINT 1)

- Show a busy label and disable the button while the placement request is in flight.
- Surface failures explicitly: 401 → sign in; `schema_missing`/503 → setup instructions; network/500/rate-limit → inline error with retry.
- After a successful placement, inspect the returned map. If `publishedLessons` is 0 or A1 has no published lessons, show a dedicated “A1 content is not seeded yet” state with the exact next action; never silently return to the same empty card.
- If A1 is published, open the first available A1 lesson (current or unlocked) directly, or refresh the path anchored at A1. Do not merely reload and hope.
- Never navigate a locked lesson. The server remains the source of truth for unlocking.
- Keep the button’s destination deterministic and testable in dev preview/fixture mode.

---

## 8. Curriculum preview (generated from existing content)

This is the proposed content organization. It uses the existing grammar order, the existing vocabulary CSVs, the existing listening/reading sources, the existing writing topics, and the existing exercise pipeline. It does not invent new grammar rules or vocabulary.

### 8.1 Generation rules

1. **Rule grouping** — each category's rules are split into groups of at most 3, in source order. A category with 7 rules becomes 3 lessons (3 + 2 + 2) with `· Part I/II/III`; a category with 1–3 rules becomes one lesson. This is why A1 has 18 lessons from 11 categories.
2. **Unit grouping** — whole grammar categories are added until the unit has 3–6 lessons. A trailing unit with fewer than 3 lessons is merged into the previous unit when the result is ≤6 lessons. Categories are never split across units. One unit reaches 7 lessons as a consequence: **B2 Unit 2** (Gerund & Infinitive 2 + Modal Verbs 5). This is reported rather than hidden; keeping the category whole was preferred to a 2-lesson unit.
3. **Unit titles** — first category → last category in the unit, using the existing English and Arabic category names. A single-category unit uses that category name.
4. **Vocabulary** — one topic category and one fresh 20-word slice per lesson, using the affinity and fallback rules in Section 2.5. No slice is reused.
5. **Listening/reading** — sources whose level list includes the lesson level are rotated round-robin, independently for listening and reading.
6. **Writing** — optional; every fourth path node (the node counter includes revision/check nodes) or the last lesson of a unit; topics rotate through the 30-entry bank.
7. **Revision and checks** — every unit ends with an optional revision node and a required unit check. Every level ends with a level check.
8. **Slugs and positions** — deterministic slugs from level + category + part; global positions run 1–126 across all levels.

### 8.2 Level totals

#### Node totals

| Level | Lessons | Units | Revision nodes | Unit checks | Level checks | Total path nodes | Cumulative positions |
|---|---:|---:|---:|---:|---:|---:|---|
| A1 | 18 | 3 | 3 | 3 | 1 | 25 | 1–25 |
| A2 | 21 | 4 | 4 | 4 | 1 | 30 | 26–55 |
| B1 | 22 | 5 | 5 | 5 | 1 | 33 | 56–88 |
| B2 | 21 | 4 | 4 | 4 | 1 | 30 | 89–118 |
| C1 | 5 | 1 | 1 | 1 | 1 | 8 | 119–126 |
| **Total** | **87** | **17** | **17** | **17** | **5** | **126** | **1–126** |

#### Units

| Level | Unit | Lessons | Unit title EN | Unit title AR |
|---|---:|---:|---|---|
| A1 | 1 | 6 | Adjectives & Adverbs → Past Tenses | الصفات والأحوال → الماضي |
| A1 | 2 | 6 | Modal Verbs → Pronouns | الأفعال الناقصة → الضمائر |
| A1 | 3 | 6 | Present Tenses → Questions | المضارع → الأسئلة |
| A2 | 1 | 6 | Adjectives & Adverbs → Conjunctions | الصفات والأحوال → أدوات الربط |
| A2 | 2 | 6 | Future Tenses → Modal Verbs | المستقبل → الأفعال الناقصة |
| A2 | 3 | 4 | Past Tenses → Prepositions | الماضي → حروف الجر |
| A2 | 4 | 5 | Present Tenses → Questions | المضارع → الأسئلة |
| B1 | 1 | 5 | Adjectives & Adverbs → Conjunctions | الصفات والأحوال → أدوات الربط |
| B1 | 2 | 4 | Future Tenses → Gerund & Infinitive | المستقبل → المصدر وإن+فعل |
| B1 | 3 | 4 | Modal Verbs | الأفعال الناقصة |
| B1 | 4 | 4 | Past Tenses → Prepositions | الماضي → حروف الجر |
| B1 | 5 | 5 | Present Tenses → Questions | المضارع → الأسئلة |
| B2 | 1 | 5 | Adjectives & Adverbs → Future Tenses | الصفات والأحوال → المستقبل |
| B2 | 2 | 7 | Gerund & Infinitive → Modal Verbs | المصدر وإن+فعل → الأفعال الناقصة |
| B2 | 3 | 4 | Past Tenses → Prepositions | الماضي → حروف الجر |
| B2 | 4 | 5 | Present Tenses → Questions | المضارع → الأسئلة |
| C1 | 1 | 5 | Adjectives & Adverbs → Vocabulary & Collocations | الصفات والأحوال → المفردات والتراكيب |

### 8.3 What gets built now vs later

- **A1:** real EN + AR content with examples and 6–10 exercises per lesson. The 18 lesson nodes plus 3 revision nodes, 3 unit checks, and 1 level check are the Phase 2 build target. Total: **25 nodes**.
- **A2–C1:** outline rows only (`published=false`) until each level is built from the same process. Their lesson indexes below are the approved shape, not finished content. They replace the repository migration's older 40-outline shape (10 per level); the old rows are unpublished and zero-progress, so the builder reconciles them under the same policy.
- **A1 is not the invented 20-lesson seed.** The new A1 slugs and titles below are the ones the builder will create. The invented rows will be removed only under the zero-progress policy in Section 6.4.

### 8.4 A1 full build detail

#### A1 — full build detail (25 nodes)

| # | Slug | Unit | Title EN / AR | Grammar rules (in order) | Vocabulary | Listen | Read | Write |
|---|---|---|---|---|---|---|---|---|
| 1 | `a1-adjectives-and-adverbs` | U1 | **Adjectives & Adverbs** / الصفات والأحوال | Adjectives vs adverbs: word formation & word order; Comparative adjectives with -er and more; Superlative adjectives with -est and the most | Opposite Adjectives (1–20 of 34) | Spotlight English podcast | Project Gutenberg | optional · Free Talk |
| 2 | `a1-articles-and-quantifiers` | U1 | **Articles & Quantifiers** / أدوات التعريف | Articles: a, an, the, zero article; Superlative with the | Prepositions and Determiners (1–20 of 22) | Spotlight English podcast | ESL Fast | — |
| 3 | `a1-conditionals` | U1 | **Conditionals** / الجمل الشرطية | Zero conditional | Time and Date (1–20 of 24) | Spotlight English podcast | Storynory | — |
| 4 | `a1-future-tenses` | U1 | **Future Tenses** / المستقبل | Future with will for sudden decisions; Future with going to for plans; Will for requests | Months and Seasons (1–18 of 18) | Spotlight English podcast | ManyThings.org | — |
| 5 | `a1-gerund-and-infinitive` | U1 | **Gerund & Infinitive** / المصدر وإن+فعل | Verbs followed by infinitive or gerund: like, love, want, would like; Stative verbs: know, like, seem, love, have, want, see | Basic Verbs (1–20 of 30) | Spotlight English podcast | Project Gutenberg | optional · Food |
| 6 | `a1-past-tenses` | U1 | **Past Tenses** / الماضي | Past simple for actions in the past; Past simple of TO BE; Past simple: regular and irregular verbs | Simple Verbs (1–20 of 25) | Spotlight English podcast | ESL Fast | optional · Shopping |
| 7 | `a1-unit-1-revision` | U1 | **Unit 1 revision** / مراجعة الوحدة 1 | re-open 14 unit rules | re-open 6 vocab categories | — | — | — |
| 8 | `a1-unit-1-check` | U1 | **Unit 1 check** / اختبار الوحدة 1 | approved Check questions from U1 | — | — | — | — |
| 9 | `a1-modal-verbs-1` | U2 | **Modal Verbs · Part I** / الأفعال الناقصة · الجزء 1 | Can / can't for abilities; Could / couldn't for past abilities; Could for polite requests | Useful Verbs (1–20 of 28) | Spotlight English podcast | Project Gutenberg | optional · Family & Friends |
| 10 | `a1-modal-verbs-2` | U2 | **Modal Verbs · Part II** / الأفعال الناقصة · الجزء 2 | Must / mustn't for obligation & prohibition; Need / needn't for necessity | Basic Verbs (21–30 of 30) | Spotlight English podcast | ESL Fast | — |
| 11 | `a1-modal-verbs-3` | U2 | **Modal Verbs · Part III** / الأفعال الناقصة · الجزء 3 | Can for permission & possibility; Shall for suggestions | Useful Verbs (21–28 of 28) | Spotlight English podcast | Storynory | — |
| 12 | `a1-prepositions` | U2 | **Prepositions** / حروف الجر | Prepositions of place: at, in, on, in front of, under, behind, among, beside, near, next to, between, across, into, through, onto, out of; By, of, etc. | Directions and Continents (1–16 of 16) | Spotlight English podcast | ManyThings.org | — |
| 13 | `a1-pronouns-1` | U2 | **Pronouns · Part I** / الضمائر · الجزء 1 | Personal pronouns; Possessive pronouns; Possessive with 's | Adverbs and Pronouns (1–20 of 21) | Spotlight English podcast | Project Gutenberg | optional · Future Plans |
| 14 | `a1-pronouns-2` | U2 | **Pronouns · Part II** / الضمائر · الجزء 2 | Object pronouns; Demonstrative pronouns; Pronouns: something, anything | Personal Information (1–12 of 12) | Spotlight English podcast | ESL Fast | optional · Childhood |
| 15 | `a1-unit-2-revision` | U2 | **Unit 2 revision** / مراجعة الوحدة 2 | re-open 15 unit rules | re-open 6 vocab categories | — | — | — |
| 16 | `a1-unit-2-check` | U2 | **Unit 2 check** / اختبار الوحدة 2 | approved Check questions from U2 | — | — | — | — |
| 17 | `a1-present-tenses-1` | U3 | **Present Tenses · Part I** / المضارع · الجزء 1 | Have got: positive, negative, question; Have; To be | School (1–18 of 18) | Spotlight English podcast | Project Gutenberg | optional · Books |
| 18 | `a1-present-tenses-2` | U3 | **Present Tenses · Part II** / المضارع · الجزء 2 | There is / There are; Present simple for habits; Adverbs of frequency: always, never, often, seldom, usually | Simple Verbs (21–25 of 25) | Spotlight English podcast | ESL Fast | — |
| 19 | `a1-present-tenses-3` | U3 | **Present Tenses · Part III** / المضارع · الجزء 3 | Present progressive for actions now; Present perfect with since and for; Present perfect with ever and never | Hello and Goodbye (1–16 of 16) | Spotlight English podcast | Storynory | — |
| 20 | `a1-present-tenses-4` | U3 | **Present Tenses · Part IV** / المضارع · الجزء 4 | Present perfect with already and yet; Imperative | People (1–14 of 14) | Spotlight English podcast | ManyThings.org | — |
| 21 | `a1-questions-1` | U3 | **Questions · Part I** / الأسئلة · الجزء 1 | Interrogative pronouns: Where, When, Who, How, What, Which, Whose, What time; Questions with TO BE; Questions with HAVE GOT | Free Time Activities (1–17 of 17) | Spotlight English podcast | Project Gutenberg | optional · Science |
| 22 | `a1-questions-2` | U3 | **Questions · Part II** / الأسئلة · الجزء 2 | Questions with Present simple; Questions with Past simple; Question tags | Furniture and Home Appliances (1–9 of 9) | Spotlight English podcast | ESL Fast | optional · Goals |
| 23 | `a1-unit-3-revision` | U3 | **Unit 3 revision** / مراجعة الوحدة 3 | re-open 17 unit rules | re-open 6 vocab categories | — | — | — |
| 24 | `a1-unit-3-check` | U3 | **Unit 3 check** / اختبار الوحدة 3 | approved Check questions from U3 | — | — | — | — |
| 25 | `a1-level-check` | U3 | **A1 level check** / اختبار مستوى A1 | approved Check questions across A1 | — | — | — | — |

### 8.5 A2–C1 outline lesson indexes

The position numbers below skip revision and check nodes. Each unit also has a revision and unit check between lesson groups, and each level ends with a level check; the full node counts are in Section 8.2.

#### A2 — outline lesson index (21 lessons)

| # | Slug | Unit | Title EN / AR | Rules | Vocabulary | Listen | Read | Write |
|---|---|---|---|---:|---|---|---|---|
| 26 | `a2-adjectives-and-adverbs-1` | U1 | **Adjectives & Adverbs · Part I** / الصفات والأحوال · الجزء 1 | 3 | Appearance (1–20 of 28) | Spotlight English podcast | Project Gutenberg | optional · Free Talk |
| 27 | `a2-adjectives-and-adverbs-2` | U1 | **Adjectives & Adverbs · Part II** / الصفات والأحوال · الجزء 2 | 3 | Necessary Opposite Adjectives (1–20 of 32) | Spotlight English podcast | ESL Fast | — |
| 28 | `a2-articles-and-quantifiers` | U1 | **Articles & Quantifiers** / أدوات التعريف | 2 | Quantity (1–20 of 29) | Spotlight English podcast | Storynory | — |
| 29 | `a2-conditionals-1` | U1 | **Conditionals · Part I** / الجمل الشرطية · الجزء 1 | 2 | Time and Date (1–20 of 33) | Spotlight English podcast | ManyThings.org | — |
| 30 | `a2-conditionals-2` | U1 | **Conditionals · Part II** / الجمل الشرطية · الجزء 2 | 2 | Essential Verbs (1–20 of 30) | Spotlight English podcast | Project Gutenberg | optional · Food |
| 31 | `a2-conjunctions` | U1 | **Conjunctions** / أدوات الربط | 2 | Conjunctions and Prepositions (1–20 of 38) | Spotlight English podcast | ESL Fast | optional · Shopping |
| 34 | `a2-future-tenses-1` | U2 | **Future Tenses · Part I** / المستقبل · الجزء 1 | 3 | Travelling (1–20 of 34) | Spotlight English podcast | Project Gutenberg | optional · Family & Friends |
| 35 | `a2-future-tenses-2` | U2 | **Future Tenses · Part II** / المستقبل · الجزء 2 | 2 | Time and Date (21–33 of 33) | Spotlight English podcast | ESL Fast | — |
| 36 | `a2-gerund-and-infinitive` | U2 | **Gerund & Infinitive** / المصدر وإن+فعل | 2 | Common Verbs (1–20 of 32) | Spotlight English podcast | Storynory | — |
| 37 | `a2-modal-verbs-1` | U2 | **Modal Verbs · Part I** / الأفعال الناقصة · الجزء 1 | 3 | Modal and Other Verbs (1–20 of 37) | Spotlight English podcast | ManyThings.org | — |
| 38 | `a2-modal-verbs-2` | U2 | **Modal Verbs · Part II** / الأفعال الناقصة · الجزء 2 | 3 | Necessary Verbs (1–20 of 32) | Spotlight English podcast | Project Gutenberg | optional · Future Plans |
| 39 | `a2-modal-verbs-3` | U2 | **Modal Verbs · Part III** / الأفعال الناقصة · الجزء 3 | 2 | Modal and Other Verbs (21–37 of 37) | Spotlight English podcast | ESL Fast | optional · Childhood |
| 42 | `a2-past-tenses-1` | U3 | **Past Tenses · Part I** / الماضي · الجزء 1 | 3 | Essential Verbs (21–30 of 30) | Spotlight English podcast | Project Gutenberg | optional · Books |
| 43 | `a2-past-tenses-2` | U3 | **Past Tenses · Part II** / الماضي · الجزء 2 | 3 | Basic Phrasal Verbs (1–20 of 30) | Spotlight English podcast | ESL Fast | — |
| 44 | `a2-prepositions-1` | U3 | **Prepositions · Part I** / حروف الجر · الجزء 1 | 2 | Home (1–20 of 23) | Spotlight English podcast | Storynory | — |
| 45 | `a2-prepositions-2` | U3 | **Prepositions · Part II** / حروف الجر · الجزء 2 | 2 | Home Appliances and Devices (1–20 of 31) | Spotlight English podcast | ManyThings.org | optional · Art & Music |
| 48 | `a2-present-tenses-1` | U4 | **Present Tenses · Part I** / المضارع · الجزء 1 | 3 | Hobbies and Daily Activities (1–20 of 34) | Spotlight English podcast | Storynory | — |
| 49 | `a2-present-tenses-2` | U4 | **Present Tenses · Part II** / المضارع · الجزء 2 | 2 | Hobbies and Daily Activities (21–34 of 34) | Spotlight English podcast | ManyThings.org | — |
| 50 | `a2-present-tenses-3` | U4 | **Present Tenses · Part III** / المضارع · الجزء 3 | 2 | Clothes and Accessories (1–20 of 31) | Spotlight English podcast | Project Gutenberg | optional · Relationships |
| 51 | `a2-pronouns` | U4 | **Pronouns** / الضمائر | 3 | Pronouns and Determiners (1–20 of 23) | Spotlight English podcast | ESL Fast | — |
| 52 | `a2-questions` | U4 | **Questions** / الأسئلة | 3 | Communication (1–20 of 44) | Spotlight English podcast | Storynory | optional · Challenges |

#### B1 — outline lesson index (22 lessons)

| # | Slug | Unit | Title EN / AR | Rules | Vocabulary | Listen | Read | Write |
|---|---|---|---|---:|---|---|---|---|
| 56 | `b1-adjectives-and-adverbs-1` | U1 | **Adjectives & Adverbs · Part I** / الصفات والأحوال · الجزء 1 | 3 | Human Characteristics (1–20 of 30) | The LevelUp English Podcast | Project Gutenberg | optional · Free Talk |
| 57 | `b1-adjectives-and-adverbs-2` | U1 | **Adjectives & Adverbs · Part II** / الصفات والأحوال · الجزء 2 | 3 | Appearance (1–20 of 31) | British Council | ESL Fast | — |
| 58 | `b1-conditionals-1` | U1 | **Conditionals · Part I** / الجمل الشرطية · الجزء 1 | 2 | Time (1–20 of 40) | Luke's English Podcast | Storynory | — |
| 59 | `b1-conditionals-2` | U1 | **Conditionals · Part II** / الجمل الشرطية · الجزء 2 | 2 | Essential Verbs (1–20 of 35) | All Ears English Podcast | ManyThings.org | — |
| 60 | `b1-conjunctions` | U1 | **Conjunctions** / أدوات الربط | 1 | Adverbs and Prepositions (1–20 of 38) | The LevelUp English Podcast | Project Gutenberg | optional · Food |
| 63 | `b1-future-tenses-1` | U2 | **Future Tenses · Part I** / المستقبل · الجزء 1 | 2 | Travel and Vacation (1–20 of 33) | All Ears English Podcast | ManyThings.org | — |
| 64 | `b1-future-tenses-2` | U2 | **Future Tenses · Part II** / المستقبل · الجزء 2 | 2 | Time (21–40 of 40) | The LevelUp English Podcast | Project Gutenberg | optional · Family & Friends |
| 65 | `b1-gerund-and-infinitive-1` | U2 | **Gerund & Infinitive · Part I** / المصدر وإن+فعل · الجزء 1 | 2 | Common Verbs (1–20 of 34) | British Council | ESL Fast | — |
| 66 | `b1-gerund-and-infinitive-2` | U2 | **Gerund & Infinitive · Part II** / المصدر وإن+فعل · الجزء 2 | 2 | Necessary Verbs (1–20 of 37) | Luke's English Podcast | Storynory | optional · Movies |
| 69 | `b1-modal-verbs-1` | U3 | **Modal Verbs · Part I** / الأفعال الناقصة · الجزء 1 | 3 | Essential Verbs (21–35 of 35) | British Council | ESL Fast | — |
| 70 | `b1-modal-verbs-2` | U3 | **Modal Verbs · Part II** / الأفعال الناقصة · الجزء 2 | 3 | Common Verbs (21–34 of 34) | Luke's English Podcast | Storynory | — |
| 71 | `b1-modal-verbs-3` | U3 | **Modal Verbs · Part III** / الأفعال الناقصة · الجزء 3 | 2 | Necessary Verbs (21–37 of 37) | All Ears English Podcast | ManyThings.org | — |
| 72 | `b1-modal-verbs-4` | U3 | **Modal Verbs · Part IV** / الأفعال الناقصة · الجزء 4 | 2 | Family and Relationships (1–20 of 32) | The LevelUp English Podcast | Project Gutenberg | optional · Books |
| 75 | `b1-past-tenses-1` | U4 | **Past Tenses · Part I** / الماضي · الجزء 1 | 3 | The Animal Kingdom (1–20 of 36) | All Ears English Podcast | ManyThings.org | — |
| 76 | `b1-past-tenses-2` | U4 | **Past Tenses · Part II** / الماضي · الجزء 2 | 2 | Houses and Buildings (1–20 of 27) | The LevelUp English Podcast | Project Gutenberg | optional · Goals |
| 77 | `b1-past-tenses-3` | U4 | **Past Tenses · Part III** / الماضي · الجزء 3 | 2 | Business and Workplace (1–20 of 41) | British Council | ESL Fast | — |
| 78 | `b1-prepositions` | U4 | **Prepositions** / حروف الجر | 2 | Occupations (1–20 of 33) | Luke's English Podcast | Storynory | optional · Pets |
| 81 | `b1-present-tenses-1` | U5 | **Present Tenses · Part I** / المضارع · الجزء 1 | 3 | Music (1–20 of 28) | British Council | ESL Fast | — |
| 82 | `b1-present-tenses-2` | U5 | **Present Tenses · Part II** / المضارع · الجزء 2 | 2 | Meat and Dairy (1–20 of 29) | Luke's English Podcast | Storynory | — |
| 83 | `b1-present-tenses-3` | U5 | **Present Tenses · Part III** / المضارع · الجزء 3 | 2 | Fruits and Nuts (1–20 of 25) | All Ears English Podcast | ManyThings.org | — |
| 84 | `b1-pronouns` | U5 | **Pronouns** / الضمائر | 2 | Drinks (1–20 of 28) | The LevelUp English Podcast | Project Gutenberg | optional · Work & Interviews |
| 85 | `b1-questions` | U5 | **Questions** / الأسئلة | 2 | Education (1–20 of 32) | British Council | ESL Fast | optional · Hobbies |

#### B2 — outline lesson index (21 lessons)

| # | Slug | Unit | Title EN / AR | Rules | Vocabulary | Listen | Read | Write |
|---|---|---|---|---:|---|---|---|---|
| 89 | `b2-adjectives-and-adverbs-1` | U1 | **Adjectives & Adverbs · Part I** / الصفات والأحوال · الجزء 1 | 2 | Personality (1–20 of 38) | Luke's English Podcast | Project Gutenberg | optional · Free Talk |
| 90 | `b2-adjectives-and-adverbs-2` | U1 | **Adjectives & Adverbs · Part II** / الصفات والأحوال · الجزء 2 | 2 | General Adverbs (1–20 of 40) | All Ears English Podcast | ESL Fast | — |
| 91 | `b2-conditionals` | U1 | **Conditionals** / الجمل الشرطية | 3 | Time (1–20 of 30) | TED Talks | Storynory | — |
| 92 | `b2-future-tenses-1` | U1 | **Future Tenses · Part I** / المستقبل · الجزء 1 | 3 | Time (21–30 of 30) | BBC Sounds | ManyThings.org | — |
| 93 | `b2-future-tenses-2` | U1 | **Future Tenses · Part II** / المستقبل · الجزء 2 | 3 | Technology (1–20 of 36) | Luke's English Podcast | Medium | optional · Food |
| 96 | `b2-gerund-and-infinitive-1` | U2 | **Gerund & Infinitive · Part I** / المصدر وإن+فعل · الجزء 1 | 3 | Common Verbs (1–20 of 37) | BBC Sounds | Project Gutenberg | — |
| 97 | `b2-gerund-and-infinitive-2` | U2 | **Gerund & Infinitive · Part II** / المصدر وإن+فعل · الجزء 2 | 2 | Common Verbs (21–37 of 37) | Luke's English Podcast | ESL Fast | optional · Family & Friends |
| 98 | `b2-modal-verbs-1` | U2 | **Modal Verbs · Part I** / الأفعال الناقصة · الجزء 1 | 3 | Grammar (1–20 of 36) | All Ears English Podcast | Storynory | — |
| 99 | `b2-modal-verbs-2` | U2 | **Modal Verbs · Part II** / الأفعال الناقصة · الجزء 2 | 3 | Certainty and Doubt (1–20 of 39) | TED Talks | ManyThings.org | — |
| 100 | `b2-modal-verbs-3` | U2 | **Modal Verbs · Part III** / الأفعال الناقصة · الجزء 3 | 3 | Grammar (21–36 of 36) | BBC Sounds | Medium | — |
| 101 | `b2-modal-verbs-4` | U2 | **Modal Verbs · Part IV** / الأفعال الناقصة · الجزء 4 | 2 | Certainty and Doubt (21–39 of 39) | Luke's English Podcast | BBC News | optional · Future Plans |
| 102 | `b2-modal-verbs-5` | U2 | **Modal Verbs · Part V** / الأفعال الناقصة · الجزء 5 | 2 | Phrasal Verbs (1–20 of 43) | All Ears English Podcast | The New York Times | optional · Childhood |
| 105 | `b2-past-tenses-1` | U3 | **Past Tenses · Part I** / الماضي · الجزء 1 | 3 | People and Society (1–20 of 36) | Luke's English Podcast | Storynory | optional · Books |
| 106 | `b2-past-tenses-2` | U3 | **Past Tenses · Part II** / الماضي · الجزء 2 | 3 | Crime and Violence (1–20 of 86) | All Ears English Podcast | ManyThings.org | — |
| 107 | `b2-past-tenses-3` | U3 | **Past Tenses · Part III** / الماضي · الجزء 3 | 3 | Change (1–20 of 38) | TED Talks | Medium | — |
| 108 | `b2-prepositions` | U3 | **Prepositions** / حروف الجر | 2 | Working Out (1–20 of 35) | BBC Sounds | BBC News | optional · Art & Music |
| 111 | `b2-present-tenses-1` | U4 | **Present Tenses · Part I** / المضارع · الجزء 1 | 3 | Animals (1–20 of 28) | TED Talks | ESL Fast | — |
| 112 | `b2-present-tenses-2` | U4 | **Present Tenses · Part II** / المضارع · الجزء 2 | 3 | Clothes and Fashion (1–20 of 36) | BBC Sounds | Storynory | — |
| 113 | `b2-present-tenses-3` | U4 | **Present Tenses · Part III** / المضارع · الجزء 3 | 3 | Family and Relationships (1–20 of 32) | Luke's English Podcast | ManyThings.org | optional · Relationships |
| 114 | `b2-pronouns` | U4 | **Pronouns** / الضمائر | 3 | Art (1–20 of 31) | All Ears English Podcast | Medium | — |
| 115 | `b2-questions` | U4 | **Questions** / الأسئلة | 3 | Communication (1–20 of 34) | TED Talks | BBC News | optional · Challenges |

#### C1 — outline lesson index (5 lessons)

| # | Slug | Unit | Title EN / AR | Rules | Vocabulary | Listen | Read | Write |
|---|---|---|---|---:|---|---|---|---|
| 119 | `c1-adjectives-and-adverbs` | U1 | **Adjectives & Adverbs** / الصفات والأحوال | 2 | Adjectives (1–20 of 86) | TED Talks | Medium | optional · Free Talk |
| 120 | `c1-modal-verbs` | U1 | **Modal Verbs** / الأفعال الناقصة | 2 | Essential Verbs (1–20 of 76) | BBC Sounds | BBC News | — |
| 121 | `c1-conditionals` | U1 | **Conditionals** / الجمل الشرطية | 3 | Time (1–20 of 43) | This American Life | The New York Times | — |
| 122 | `c1-vocabulary-and-collocations-1` | U1 | **Vocabulary & Collocations · Part I** / المفردات والتراكيب · الجزء 1 | 2 | Language Components (1–20 of 30) | TED Talks | Medium | — |
| 123 | `c1-vocabulary-and-collocations-2` | U1 | **Vocabulary & Collocations · Part II** / المفردات والتراكيب · الجزء 2 | 2 | Dialogue and Discourse (1–20 of 76) | BBC Sounds | BBC News | optional · Food |

---

## 9. Anomalies, gaps, and risks

These are reported for a decision. They do not change the grammar order in this phase.

### 9.1 Grammar anomalies

- **Alphabetical, not pedagogical order.** Every level starts with `Adjectives & Adverbs`. A1 places `Conditionals` before `Future Tenses`, `Past Tenses`, `Present Tenses`, and `Questions`.
- **A1 contains advanced material.** A1 includes present perfect (`since/for`, `ever/never`, `already/yet`) and future forms. These are often A2/B1 topics.
- **A2 repeats A1 rules.** Articles, comparatives/superlatives, conditionals, and basic modals appear in both levels with different wording. The plan does not dedupe.
- **B2 gerund/infinitive examples look swapped.** The B2 source lists “Verbs + gerund: decide, hate, suggest, remember, prefer, try” and “Verbs + infinitive: hope, advise, manage, mind”. `decide/hope/plan` normally take the infinitive; `mind/suggest/enjoy` normally take the gerund. This needs content review before B2 is built, not a silent rewrite.
- **C1 is thin.** Only 11 rules in 4 categories. `Vocabulary & Collocations` is lexical, not grammar, but is included because it is in the grammar source.
- **No C2 data.** A C2 target produces no C2 milestone rule.
- **Target-level truncation.** Only the first rule of the target level is included in a study plan. That is existing behaviour and is preserved.

### 9.2 Vocabulary gaps

- A1 has small categories: `Furniture and Home Appliances` 9 words, `The Body` 9, `The Head and Face` 11, `Personal Information` 12. A 20-word slice can be shorter than 20; the preview shows slices such as `1–9 of 9`.
- A1 grammar topics without a matching topic category fall back to unrelated categories: `Present Tenses` uses `School` / `Hello and Goodbye` / `Simple Verbs` / `People`; `Questions` uses `Free Time Activities` / `Furniture and Home Appliances`.
- `langeek.csv` has English definitions only. Arabic glosses must come from `global.csv` (where a word matches) or be curated. There is no automatic join yet.
- `global.csv` has 10 malformed or multi-level rows: one repeated header, `guide → m`, and eight `B2, C1` entries (`dynamic`, `extract`, `intellectual`, `principal`, `tackle`, `terminal`, `trace`, `trigger`). They are excluded from the clean count.
- No C2 vocabulary in either CSV.

### 9.3 Listening/reading gaps

- Both screens are link lists, not stored passages or audio. No transcript, audio file, word count, or comprehension question exists in the repository for these sources.
- A1 and A2 have only one listening source (Spotlight), so the round-robin repeats it for every lesson.
- The current UI shows all sources regardless of selected level. The preview filters by level.
- External content must remain outbound links; do not scrape or bundle copyrighted material.

### 9.4 Exercise gaps

- There are no stored questions per grammar rule or per path lesson. The 101 active `lt_items` are level-test MCQs, not lesson exercises, and only cover A1–B1.
- The Test Generator is AI-generated and client-graded; its output is not reviewed, stored, or reusable across learners.
- `path_lesson_exercises` has no `status` column, and the lesson endpoint returns every exercise for the lesson. A future migration must add `status` and filter to `approved`.
- `path_lesson_content.step` does not allow `reading`, `writing`, `learn`, or `words`. The lesson-player steps must be stored in the `activities` blueprint/config or enabled by an additive constraint migration.
- A1 needs 144 lesson questions plus check/revision pools; C1 has no active item bank at all.

### 9.5 Database and seed risks

- The live A1 seed is invented, external to the repository, and does not match the preview. It has 0 content, 0 exercises, and 0 progress rows.
- `migrations/learning-path.sql` only creates A2–C1 outlines. A fresh database therefore has **zero published lessons** after running the repository migration.
- Applying the migration to the current live database will not remove the invented A1 rows; the builder must handle them idempotently.
- The owner runs SQL manually in Supabase. There is no automatic migration step in the app.

### 9.6 Entry-flow risk

- “Start from A1” has no error surface and no destination logic. A successful placement that leaves the path empty looks identical to a failed placement.
- The fix must handle signed-out, schema-missing, request-failed, content-not-seeded, and ready states distinctly.

---

## 10. CHECKPOINT 1 — approval requested

No redesign code, SQL, seed, or database change has been made in Phase 0. The following decisions are needed before Phase 2:

1. **Grammar order:** Preserve the existing grammar order exactly, including the alphabetical category order and the anomalies listed in Section 9.1. Do not re-sequence or dedupe.
2. **Grouping:** Approve the preview’s rule grouping (up to 3 rules per lesson), category-preserving units (3–6 lessons, with B2 Unit 2 at 7 because the category is kept whole), revision + unit check per unit, and level check per level.
3. **A1 scope:** Build A1 as the only real-content level now: 18 lessons, 3 revisions, 3 unit checks, 1 level check (25 nodes), with EN + AR content, examples, and 6–10 exercises per lesson. Keep A2–C1 as unpublished outlines.
4. **Vocabulary:** Approve the affinity + fresh-slice + fallback mapping in Section 2.5, including the A1 fallback categories. Approve joining `global.csv` Arabic glosses where possible.
5. **Sources:** Approve level-filtered round-robin rotation for listening/reading, with external links only (no scraping or bundled copyrighted content).
6. **Writing:** Approve optional writing every fourth path node or unit-end lesson, using the 30 bilingual topics; never blocking progress.
7. **Exercises:** Approve 8 generated questions per lesson (4 practice + 4 check), draft status, review CSV, explicit approval, server grading, and answer keys never sent to the browser. Only Check is required; if no approved Check exists, Learn is required.
8. **Database:** Approve an additive/idempotent builder and SQL run order; delete only the invented seeded A1 lessons with zero progress; never touch user progress or unrelated rows. The owner runs SQL manually in Supabase.
9. **Start from A1:** Approve the visible loading/error/content-not-seeded states and deterministic navigation to the first available A1 lesson, as described in Section 7.3.

**Open approvals outside this checkpoint:** the Dashboard and Learning Path visual acceptance set is still awaiting approval. This checkpoint covers content and curriculum only; it does not re-open those screens.

**Next step after approval:** fix “Start from A1” first, then build the shared `src/ui/vx/` kit, extract grammar data to a shared module, add the additive migrations and A1 builder, generate the A1 exercise set, and build the lesson player. No implementation starts until this checkpoint is approved.
