# VENOXA AI: FULL REDESIGN + GUIDED LEARNING PATH

You are a senior full-stack engineer and product designer. Redesign the Venoxa AI web app so that it looks and behaves **exactly** like the 22-page design showcase "Venoxa_AI_Complete_Showcase.pdf" (title: "A guided English journey, not a toolbox."), and convert the app from a free-for-all toolbox into a **one-way, step-by-step CEFR learning path** (A1 → A2 → B1 → B2 → C1) with sequential unlocking enforced on the server.

This document is the full specification. It describes every page of the PDF in order, then the design system, the data/API rules, the implementation plan and the acceptance checks. Follow it literally. Where the PDF and this text disagree, the PDF wins. Where something is not shown in the PDF, make the smallest sensible choice and list it in your final report under "Assumptions".

---

## 0. HOW TO WORK (read first)

1. **Source of truth for visuals:** `design/Venoxa_AI_Complete_Showcase.pdf` (22 pages). If it is not in the repo, ask the owner to add it. If you can view images, rasterize every page to PNG (`design/pages/page-01.png` … `page-22.png`, ~1280px wide) and keep them open while building. If you cannot view the PDF or images, rely entirely on the text spec below, which was written from the pages.
2. **Do not start coding immediately.** First inspect the repo (Section 1), then write a short plan (phases in Section 12), then implement phase by phase.
3. After each phase: run typecheck + build + the app, fix what you broke, and commit with a clear message. Never leave the app broken between phases.
4. **Nothing existing may be removed.** The PDF states: "Nothing is removed. The existing tools move into My Library, and the new Learning Path becomes the primary destination." All 26 current destinations must remain reachable (map in Section 4).
5. Mockup content (student "Amina", "Lesson 4 of 20", 180 XP, 36 words, etc.) is **illustrative**. In the product all content and progress come from the database and the logged-in user. Never hardcode the demo values, except as seed/fixture data for the first A1 lessons named in the PDF.
6. Keep the app **bilingual**: the UI has Arabic (RTL) and English (LTR) modes and a light/dark theme, as today. The PDF shows English + light/dark only; mirror it faithfully in RTL (Section 3.10).
7. Finish with a report: files changed, DB migrations added, how to run, the page-by-page checklist (Section 13) with pass/fail, and your list of assumptions.

---

## 1. CURRENT CODEBASE (verify by reading, do not assume)

- Monorepo (pnpm workspaces). Frontend: `artifacts/venoxa` (React + Vite + Tailwind; `src/App.jsx` is ~4,800 lines and holds most pages; navigation is **tab-state based**: `activeTab` / `setActiveTab`, not a router). A hash route `#/verify/<id>` exists for certificate verification and **must keep working**.
- Existing frontend files: `Header.jsx` (two-tier header: utility bar + main bar), `Footer.jsx`, `PlaceholderPage.jsx`, `ProfileDashboard.jsx`, `LevelTest.jsx`, `EnglishCertificate.jsx`, `Pronunciation.jsx`, `MinimalPairs.jsx`, `WordFamilyExplorer.jsx`, `CollocationFinder.jsx`, `EtymologyExplorer.jsx`, `WordOfTheDay.jsx`, `IdiomOfTheDay.jsx`, `TimerTool.jsx`, `ToneRewriter.jsx`, `SmartTranslation.jsx`, `SentenceDiagrammer.jsx`, `translations.js`, `motion.js`, `vocabData.js`, `aiHelpers.js`, `insforge.jsx`, `supabase-config.js`, `index.css` (CSS variables for design tokens).
- Backend: `artifacts/api-server` (Express 5, routes in `src/routes/`: auth, chat, config, TTS routes, …; esbuild build).
- Data/auth: Supabase/InsForge as already wired in the repo (see `insforge-schema.sql`, `supabase-schema.sql`, `SUPABASE_SETUP.md`). The PDF says the Path API "verifies the Supabase token". Reuse the existing auth middleware and client; do not introduce a second auth system.
- Already present and to be reused, not rewritten: adaptive level test (server-graded), grammar browser with AI explanations, vocabulary SRS + phrasal verbs + slang + idioms + Langeek categories, listening/reading/writing/speaking AI tools, pronunciation (IPA) reference, test generator, certificate (PDF), study-plan generator, profile/achievements, streak data, theme and language switching.
- Static pages already added in a previous task (Privacy, Terms, Cookies, FAQ, Help, About, Contact, Community, Premium, Report a problem) must stay and be restyled with the new tokens. The footer stays (it is not in the PDF; keep it, restyled).

Before coding, list in your plan: where each existing page lives today, which tab id it uses, and how data flows (localStorage vs database). Do not refactor unrelated code.

---

## 2. PRODUCT CONCEPT (PDF page 1, cover)

- Eyebrow: "DESIGN CONCEPT · LEARNING PATH REDESIGN". Headline: "A guided English journey, not a toolbox." Subtitle: "How Venoxa AI looks and behaves once students always know what to study next: a CEFR path from A1 to C1, sequential unlocking, and a calm, focused dashboard." Tag pills: Dashboard, Learning Path, Lessons, Placement, Mobile. Footer note: "Illustrative mockups. Lesson titles come from the proposed A1 curriculum; in the product, all content and progress come from the database." Right: "Prepared for Abdelghani".
- Visual motif of the cover (reuse it for the logged-out landing/auth hero and empty states): a vertical, slightly diagonal trail of circles: two green circles with white checkmarks, one larger white circle with a blue play triangle (current), two translucent blue circles with lock icons; each circle has a soft translucent halo ring. Background: diagonal blue gradient from `#0A3A84` (top-left) to `#2962B7` (bottom-right). Logo: white rounded square with a blue "V" + wordmark "Venoxa AI" in white bold. Tag pills: translucent white-blue fill (`≈#2E5DA3`), white bold 12px text.
- The cover itself is a slide, not an app screen. Do not build it as a page; use only its look for the landing/login hero.

---

## 3. DESIGN SYSTEM (applies to every screen)

### 3.1 Typeface
- **Inter** for all Latin text (the PDF embeds Inter Regular, Bold, ExtraBold, Black). Load via `@fontsource/inter` (weights 400, 500, 600, 700, 800, 900) or Google Fonts. Replace the current Noto Sans for Latin UI text. For Arabic keep the existing Arabic font stack/`The Year of The Camel` where it is used today.
- Headings are very heavy: page titles weight 800–900 with tight tracking (−0.02em). Body 400–500. Labels/buttons 700.
- Eyebrow labels: 11–12px, UPPERCASE, letter-spacing ≈ 0.12em, weight 800, primary blue (dark mode: `#78A0FF`).

### 3.2 Colour tokens (sampled from the PDF; define as CSS variables in `:root` and `.dark`)
Light theme:
- `--bg` page background `#EDF1F8` (slide) → in-app canvas behind cards `#F7F9FC`; window/chrome white `#FFFFFF`
- `--surface` / card `#FFFFFF`; `--surface-2` (inputs, empty cells) `#F7F9FC` / `#EEF1F6`
- `--border` `#E6E6E6` / hairline `#E4E9F2`; strong border `#CBD3E0`
- `--text` `#0A1228` (headings, deepest) / `#0A0A0A` (body in cards); `--muted` `#4A566B`; `--dim` `#7C889D`
- `--primary` `#0E4AA4`; `--primary-tint` `#EBF0F7` (active nav pill, selected rows, info chips)
- Hero/banner gradient: `#0B3B86` → `#2861B5` (diagonal, left-dark to right-light)
- `--success` (completed, correct, progress) `#1F9D74`; success tint `#E8F5F0` / `#E3F3EE`; success text `#0F7A57`
- `--mint` `#C8EFE8` (vocabulary chips, words stats), mint text `#48725E`
- `--amber` tint `#FFECD6`, amber text/icons/revision ring `#D88C34`
- `--danger` tint `#FFF1EE` / `#FDE8E4`, danger text `#B4462B`; solid "End call" red `#E36B60`
- Locked state: fill `#EEF1F6`, border `#CBD3E0`, icon `#7C889D`
- Black "CONTINUE" marker `#0A0A0A` with white text; dark tooltip `#0A1228`
- Avatar: circular gradient teal → lavender (≈ `#8ED8E8` → `#A5A4F7`) with a dark letter.
- Part-of-speech colours (Sentence Diagrammer, Word Family): Noun `#3B82F6`, Verb `#10B981`, Adjective `#A855F7`, Adverb `#F97316`, Preposition `#EC4899`, Conjunction `#EF4444` (each on a ~15% tint of itself), Determiner purple-tint `#EFE9FD`.

Dark theme (PDF page 10; reuse the existing Venoxa dark palette):
- page `#060A14`, app bg `#0B1020`, header/surface `#121A2F`, card `#17223B`, border `#263452`
- primary `#4F7CFF` (buttons, active tab, current node, current-lesson border), eyebrow `#78A0FF`
- text `#F8FAFC`, muted `#B6C2D9`, dim `#7A8BA8`
- completed green `#2BC08F`; amber text `#FFD78A` on a translucent amber chip; mint/teal accents slightly desaturated; locked = darker card fill with muted border
- Every state (completed, current, locked, revision) must keep accessible contrast in dark mode (WCAG AA for text, 3:1 for icons/borders).

### 3.3 Shape, spacing, elevation
- Radii: cards 16–20px; hero/banner 20–22px; buttons 10–12px; nav pills 10–12px; chips/badges fully rounded (999px); level-tab tiles 10px; phone frames 36px.
- Browser-frame mockups show a window with three grey dots and an address bar; **do not build these in the app**. They only show the URL structure (Section 3.9).
- Card shadow: very soft, large blur, low opacity (e.g. `0 8px 24px rgba(15,30,70,.06)`); cards are mostly separated by 1px borders. Dark mode: no heavy shadows, border-based.
- Grid: desktop content area ≈ 1180–1240px max width, 22–24px page padding, 12–16px gaps. Dashboard/Path/Lesson are two columns: main (≈ 2/3) + right rail (≈ 1/3, ~340px).

### 3.4 Header (desktop, ~58px tall, single row)
- Left: logo tile (blue rounded square with white "V") + "Venoxa AI" (bold 17px).
- Centre/left-after-logo: four nav items with icon + label: **Dashboard** (house), **Learning Path** (map), **My Library** (open book), **My Progress** (bar chart). Active item = `--primary-tint` rounded pill with blue text; inactive = muted text.
- Right: streak chip (amber tint, flame icon, number, e.g. "4"), XP chip (grey-blue tint, lightning icon, "180 XP"), avatar circle (letter on gradient).
- This replaces the old two-tier header (utility bar with Dictionary / Mobile App / Contact Us / Premium). The PDF shows only the single bar. **Assumption to apply:** move theme toggle, EN/AR switch, Premium, Contact, Mobile App, sign-out and settings into the avatar dropdown menu; Dictionary is reachable via My Library → Vocabulary.
- Scroll behaviour: sticky; hairline border/blur after scroll. Keep a subtle entrance animation (use existing `motion.js` / framer-motion, honour `prefers-reduced-motion`).

### 3.5 Header on tablet/mobile
- Under 768px the top nav labels disappear. Mobile (PDF page 9): no top nav; a **bottom navigation bar with four tabs: Home, Path, Library, Progress** (icon above a small label; active tab blue with blue label; others grey). Header content on mobile home: greeting + chips.

### 3.6 Core components (build once, reuse)
- **Button primary**: solid `--primary`, white bold text, optional trailing arrow icon, height 44–48px, radius 10–12px. **Button on gradient**: white fill, blue text ("Continue learning →"). **Button success** (practice "Continue"): green fill. **Ghost/tonal**: `--primary-tint` fill with blue text. **Destructive**: red-tint fill with danger text ("Delete account"), solid red for "End call".
- **Chip/pill**: fully rounded, 12–13px bold. Variants: blue-tint (Grammar, A1), mint (Vocabulary, words), amber (Listening, streak, "Optional"), grey (Check, locked), green (Lesson N tags with a small map icon, e.g. "Lesson 13").
- **Card**: white, 1px border, radius 16–20px, padding 18–24px. Card header pattern: small eyebrow + bold title.
- **Progress bar**: 6–8px high, fully rounded, track `#E4E9F2` (light) / `#263452` (dark), fill primary blue; green fill inside practice. **Progress ring**: SVG circle, round caps, large centred number + tiny caption ("15%" / "A1 done").
- **Stat tile**: icon in a tinted rounded square (amber, mint, blue-grey) + big number (22px, 800) + caption.
- **Tooltip/callout** (used in mockups only to explain behaviour; do not ship the explanatory ones).
- **Breadcrumb**: "My Library › Vocabulary › Review" – small, muted, last item bold black.
- **Audio button**: small round button with speaker icon (tinted), used for "Listen & repeat", US/UK pills ("🔊 US", "🔊 UK").
- Icons: one consistent **line icon set** (Lucide matches the PDF): Home, Map, BookOpen, BarChart3, Flame, Zap, Lock, Check, Play, RotateCcw, Trophy, Headphones, Pencil, Volume2, Star, Calendar, Search, Sparkles, Mic, Clock, Award, Layers, ArrowRight, ChevronRight, ChevronLeft, X.

### 3.7 The five path states (PDF page 11; one visual language everywhere)
| State | Visual | Behaviour |
|---|---|---|
| Completed | Solid green circle (`#1F9D74`) with white check and a soft green halo ring | Always reopenable for revision |
| Current lesson | Larger solid blue circle (`--primary`) with white play triangle, two translucent blue halo rings, black "CONTINUE" pill with a down-pointer above it, blue subtitle | Exactly one at a time |
| Locked | Pale grey circle (`#EEF1F6`, border `#CBD3E0`) with lock icon, muted grey label | Prerequisites unmet; **blocked by the server, not only hidden** |
| Revision | Dashed amber circle with a circular-arrow icon, amber label "Optional" | Optional recap; never blocks progress |
| Assessment | Trophy icon on an amber tint | Unit/level check that validates understanding |

### 3.8 Motion
Subtle only: nodes pop in with a small stagger, current node has a gentle pulse on its halo, progress fills animate, completion screen shows light confetti (small coloured squares/circles around a white circle with an amber trophy). Respect `prefers-reduced-motion`.

### 3.9 URL structure (shown in the PDF address bars)
`/dashboard`, `/path`, `/path/a1/introducing-yourself` (lesson), `/library` (+ sub-routes), `/progress`, `/progress/plan`, `/progress/profile`. Implement real URL routing with `wouter` (already a dependency of `@workspace/venoxa`, `^3.3.5`; use it, do not add another router), keep a fallback for the old tab ids so existing deep links and the `#/verify/<id>` route continue to work. Honour the base path (`BASE_PATH`) used by Vite/Vercel and keep `vercel.json` rewrites working.

### 3.10 RTL, i18n, accessibility
- Arabic mode mirrors layout (`dir="rtl"`): nav order, arrows (→ becomes ←), progress fills, the zig-zag of the path, chevrons in breadcrumbs. English lesson content (example sentences, IPA, tables) stays LTR inside its own `dir="ltr"` blocks. All new UI strings go through the existing translation helper (`_resolveTranslation` / `translations.js`).
- Locked items use `aria-disabled` plus an accessible explanation ("Locked: finish Lesson 4 first"), never just colour. Current item has `aria-current="step"`. Visible focus rings (2px primary), keyboard navigation, 44px minimum touch targets, text alternatives for icons.

---

## 4. INFORMATION ARCHITECTURE (PDF page 2 and page 22)

**Today:** 26 destinations in four menus: Dashboard, Profile, Study Plan, Vocabulary (SRS), Phrasal Verbs, Slang, Idioms, Langeek (PDF), Level Test, Listening, Reading (AI), Speaking (Call), Writing (AI), Pronunciation, Test Generator, Grammar (AI), Smart Translation, Tone Rewriter, Sentence Diagrammer, Minimal Pairs, Word Family, Collocations, Etymology, Word of the Day, Idiom of the Day, Focus Timer. The student's pain: "Where do I start? What comes after this? Did I finish this week's plan?"

**After: four top-level destinations** (header on desktop, bottom bar on mobile):
1. **Dashboard** – "One clear next step: 'Continue learning', level progress, streak, reviews due." (Continue learning · Level progress · Achievements)
2. **Learning Path** – "Guided learning. Ordered CEFR lessons that unlock one after another." (A1 → C1 · Lessons · Placement test). Level Test lives here as the placement step.
3. **My Library** – "Independent exploration. Everything that exists today, kept intact." Four sub-tabs: **Vocabulary, Grammar, Skills, Tools**.
4. **My Progress** – "Stats, CEFR ladder, achievements, Study Plan and certificates." (Profile · Study Plan · Level test results · Certificate)

**Complete mapping (PDF page 22), every existing page keeps a home:**
- Dashboard (1): Dashboard
- Learning Path (1): Level Test (placement)
- My Library · Vocabulary (5): Vocabulary (SRS), Phrasal Verbs, Slang, Idioms, Langeek (PDF)
- My Library · Grammar (1): Grammar (AI)
- My Library · Skills (6): Listening, Reading (AI), Speaking (Call), Writing (AI), Pronunciation, Test Generator
- My Library · Tools (10): Smart Translation, Tone Rewriter, Sentence Diagrammer, Minimal Pairs, Word Family, Collocations, Etymology, Word of the Day, Idiom of the Day, Focus Timer
- My Progress (4): Profile, Study Plan, Level Test results, Certificate
- Two pages gain a second role: Level Test also feeds placement; Listening and Pronunciation can also appear as steps inside path lessons. "After: 4 top-level destinations. All 26 are still reachable, none removed."

---

## 5. PAGE-BY-PAGE SPEC (PDF pages 3–21)

### 5.1 DASHBOARD (PDF p.3: "Always one obvious next step")
Subtitle: "Level, progress, current lesson and next action are visible at a glance. Everything else is secondary."
Layout: header, then two columns.

**Left column**
1. **Hero card** (blue gradient `#0B3B86 → #2861B5`, radius ~22px, ~240px tall):
   - Eyebrow (light blue): "GOOD EVENING, AMINA" (greeting by time of day + first name).
   - Title (white, 28px, 800): the current lesson title, e.g. "Introducing yourself".
   - Meta line: "Lesson 4 of 20 · A1 Beginner" then a one-sentence description: "Subject pronouns with TO BE, name, age and country vocabulary, a short listening."
   - White button "Continue learning →" (blue text) and a small "≈ 12 min" estimate next to it.
   - Right side: progress ring ~120px, translucent track, white arc; centre "15%" large, "A1 done" tiny.
   - "Continue learning" **resolves the next unlocked lesson on the server** (never client-guessed).
2. **"Your journey · A1" card**: right-aligned text "3 of 20 lessons · next unlock: Lesson 5". Below it a horizontal stepper of circular nodes joined by connector lines: completed = green check nodes with green connectors; current = larger blue play node; remaining = grey lock nodes with grey connectors. (Show a window of the lessons, not necessarily all 20; keep it one row, scrollable/condensed.)
3. **Three stat tiles** in a row: "4 days – Current streak" (amber flame tile), "36 – Words learned" (mint book tile), "1h 20m – Study time" (blue-grey clock tile).

**Right column**
1. **"CEFR levels" card**: five rows. A1 (active): dark-blue rounded square "A1", name "Beginner", progress bar, "15%", row highlighted with `--primary-tint`. A2 Elementary, B1 Intermediate, B2 Upper Intermediate, C1 Advanced: grey squares, muted text, lock icon on the right.
2. **"Achievements" card**: three round badges with labels: "First lesson" (amber star), "3-day streak" (mint flame), "10 lessons" (grey award, locked/muted).
3. **Review card**: mint circular-arrow icon, "12 words due for review", caption "Spaced repetition, 3 min", pill button "Review" (opens the SRS review in My Library → Vocabulary).

Rules: exactly one primary action on the screen; no tool grids; keep it calm.

### 5.2 LEARNING PATH (PDF p.4: "The journey is the interface")
Subtitle: "Connected steps, a highlighted current lesson, locked future lessons and optional revision, drawn as a path instead of a table."

**Left (≈ 55%)**
- **Level tabs**: five equal tiles in a row: A1 (selected: solid blue, white text, "15%" under it), A2, B1, B2, C1 (grey tiles, label "Locked"). Tiles for unlocked levels are clickable; locked levels show locked state and a tooltip.
- **Unit header card** (outlined): eyebrow "UNIT 1", title "Getting started", right "3 of 4 done". A level has several units; each unit has ~4 lessons.
- **The path** (vertical, gently zig-zagging to the right as it descends): nodes ~60px (completed/locked) and ~76px (current), joined by a thick green connector for completed segments and a dotted blue-grey connector toward future nodes. Each node has a label to its right: bold title + grey subtitle "Lesson N · Type". Sample (seed) sequence: ✔ "Alphabet & sounds – Lesson 1 · Pronunciation"; ✔ "Subject pronouns – Lesson 2 · Grammar"; ✔ "The verb TO BE – Lesson 3 · Grammar"; ● current "Introducing yourself – Lesson 4 · Grammar + listening" (blue subtitle) with the black "CONTINUE" pill above the node; then (below, partly visible) a dashed-amber Revision node ("Recap · Optional") followed by locked nodes ("Articles", "Plurals", …). The path scrolls; auto-scroll so the current node is in view on load.

**Right rail**
1. **Current lesson card** (2px blue border): eyebrow "CURRENT LESSON · 4 OF 20", title "Introducing yourself", description "Say who you are and where you're from, using subject pronouns and TO BE.", content chips: Grammar (blue tint, book icon), Vocabulary (mint, pencil), Listening (amber, headphones), Check (grey, check). Full-width primary button "Start lesson →".
2. **Level summary card**: "A1 · Beginner" left, "**3** / 20 lessons" right (3 bold), progress bar, legend with four dots: Done (green), Current (blue), Locked (grey), Revision (amber ring).
3. **"Revisit anytime" card**: list of completed lessons, each row: green check, title, right "Score 92%" (The verb TO BE 92%, Subject pronouns 100%, Alphabet & sounds 88%). Clicking reopens the lesson for revision (does not change status).

### 5.3 LESSON EXPERIENCE (PDF p.5: "One lesson, everything it needs")
Subtitle: "Each lesson bundles the right materials for its objective, reusing existing grammar, vocabulary and listening components."
- URL like `/path/a1/introducing-yourself`. Breadcrumb: "Learning Path › A1 · Unit 1 › Introducing yourself".
- **Two columns**: main lesson content + right sidebar "IN THIS LESSON".
- **Main card**: eyebrow "LESSON 4 · STEP 1 OF 5"; title "Subject pronouns + TO BE"; a small pill top-right naming the step type ("Grammar", book icon); one-line explanation with the key words in bold ("Use **I, you, he, she, it, we, they** with the correct form of **to be** to introduce yourself and other people.").
  - Left sub-panel: table "PRONOUN → TO BE" with a tinted header row; rows: I → am, You → are, He / She / It → is, We → are, They → are; the verb column is blue and bold, right-aligned.
  - Right sub-panel: eyebrow "LISTEN & REPEAT"; three rounded rows, each with a round speaker button and a sentence where the verb is blue-bold: "**I am** Amina. **I am** from Morocco." / "**She is** a student." / "**We are** friends." (tap = play audio with the existing TTS chain).
- **Vocabulary card**: title "Vocabulary for this lesson", right caption "from the existing Langeek set · 5 words", mint chips: name, age, nationality, country, job (tap = hear/see meaning).
- **Audio card**: large round amber-tint play button, title "Short conversation: “Nice to meet you”", thin progress bar, duration "0:42" (reuse existing listening/TTS).
- **Sidebar "IN THIS LESSON"**: five steps as rows with a round icon each: Grammar (book), Vocabulary (pencil), Listening (headphones), Practice (check), Check (trophy). The active step row has a tinted background and a solid blue icon circle with bold label; others are muted with grey icon circles; completed steps show a green check. Below: a small progress bar and the text "Pass the check (≥ 70%) to unlock Lesson 5". Steps are taken in order; Next/Back within a lesson.
- Lesson step types are composable: Grammar, Vocabulary, Listening, Reading, Speaking, Writing, Pronunciation, Practice, Check. Each lesson declares which it contains. These reuse the existing components, rendered inside the lesson shell.

### 5.4 PRACTICE + COMPLETION + UNLOCKING (PDF p.6: "Instant feedback, then the next lesson opens")
Subtitle: "Answers are graded on the server. Passing the check marks the lesson complete and unlocks the next one automatically."
- **Practice screen** (single column, centred card): top bar with an ✕ close button, a **green** progress bar, and "3 / 5" on the right. Card: eyebrow "PRACTICE · TO BE", big prompt "She ___ from Morocco.", options as full-width bordered buttons ("am", "is", "are"). The chosen correct option turns green (green border 2px, `#E8F5F0` fill, check icon). Feedback panel under the options, green tint: "**Correct!** “She” takes **is**: she is, he is, it is." Green "Continue →" button bottom-right. Wrong answer: red-tint option + danger-tint panel with a short explanation and the correct answer; allow "Try again" per the lesson rules.
- Behaviour: each answer is sent to the server and graded there; the client never receives the answer key (see 8.3).
- **Lesson complete screen**: top banner in the blue gradient with confetti shapes and a white circle holding an amber trophy; title "Lesson complete!"; sub "Introducing yourself · A1"; three tiles: "90% Score" (blue tint), "+40 XP" (amber tint), "5 New words" (mint tint); an "UNLOCKED" row (green eyebrow, blue circle with lock icon): "Lesson 5 · Articles: a / an / the"; full-width primary button "Next lesson →".
- Fail state (<70%): friendly result, show what to review, buttons "Review lesson" and "Try again"; next lesson stays locked.

### 5.5 PLACEMENT (PDF p.7: "Start where you belong")
Subtitle: "The existing adaptive level test sets the starting level. Earlier levels remain available for revision; nothing is marked complete without an assessment."
Three screens:
1. **Welcome**: eyebrow "WELCOME", title "Where would you like to start?", sub "You can change this later. No lessons are skipped without proof." Two selectable option cards: "**Start from A1**" with a badge "Recommended for beginners" ("Begin with the alphabet and sounds and follow the full path."; selected style = blue border + tint) and "**Take the placement test**" ("About 10 minutes. Adaptive questions find your starting level."). Primary button "Take placement test →".
2. **Adaptive question**: progress bar, "Q 9" right; eyebrow "READING · ADAPTIVE"; question with the key phrase underlined ("If I __had known__ about the delay, I ___ earlier."); four options (would leave / would have left (selected, blue border + tint) / will leave / left); footnote "Correct answers are never sent to your browser."
3. **Result**: eyebrow "YOUR RESULT"; large blue rounded square "B1"; "Intermediate"; text "You'll start at B1 · Lesson 1. A1 and A2 stay open for revision."; level list rows: A1 "Open for revision" (revision icon), A2 "Open for revision", B1 "Starting level" (highlighted blue, play icon), B2 "Locked", C1 "Locked". Primary button "Start B1 path →".
Rules: placement sets the **start level only**; lower levels become "open for revision" (not "completed"); only an assessment can validate understanding. The level test in My Progress shows the same result later (5.17).

### 5.6 MY LIBRARY + MY PROGRESS OVERVIEW (PDF p.8: "Every existing tool is still here")
- **My Library** (URL `/library`): sub-tabs row: Vocabulary (active), Grammar, Skills, Tools. An amber notice banner (sparkle icon): "**Independent exploration.** Browse anything freely. It won't change your Learning Path progress." A search field "Search words, topics, rules…". A grid of 3 columns of cards with a tinted icon tile + title + caption: mint book tiles for vocabulary sets ("Hello & Goodbye · A1 · 24 words", "Family · A1 · 38 words", "Food & Drink · A1 · 52 words") and blue-grey layer tiles for grammar ("Present Simple · A1 grammar", "Articles · A1 grammar", "Past Simple · A2 grammar"). Library is **never locked**.
- **My Progress** (URL `/progress`): card with a ring "A1 / 15%" and "Overall progress – 3 lessons completed · 36 words learned · current level A1"; card "This week" with a 7-bar chart (Mon–Sun; filled bars for days with study time, tiny pale bars for empty days); a row card "Study Plan – Your existing weekly plan, kept as an optional companion" with an arrow (opens `/progress/plan`).
- Both pages use the same header; the active nav item is highlighted.

### 5.7 MOBILE (PDF p.9: "Designed thumb-first")
Subtitle: "The same journey on a phone: bottom navigation with four destinations, a vertical path, and focused single-column lessons."
Three phone screens (status bar 9:41):
1. **Home**: "GOOD EVENING, AMINA"; chips (streak 4, 180 XP); compact blue hero: eyebrow "LESSON 4 OF 20 · A1", title "Introducing yourself", white "Continue →" button, small ring "15%"; "CEFR levels" card with five thin progress rows (A1 filled, others locked); "12 words due · 3 min review" card. Bottom bar: Home (active), Path, Library, Progress.
2. **Path**: horizontal level tabs (A1 selected, A2 B1 B2 C1); vertical path with short labels: ✔ Pronouns, ✔ TO BE, ● "Introductions · Lesson 4" with the black CONTINUE pill, dashed amber "Recap · Optional", locked "Articles", locked "Plurals" (fades out at the bottom). Bottom bar with "Path" active.
3. **Lesson**: top thin progress bar; eyebrow "STEP 1 OF 5 · GRAMMAR"; title "Subject pronouns + TO BE"; compact pronoun table; one listen row; mint vocabulary chips; pinned full-width "Continue →" at the bottom; bottom bar visible.
All screens are single-column, with large touch targets, safe-area padding, no hover-dependent UI.

### 5.8 DARK MODE (PDF p.10: "Same journey, after dark")
Subtitle: "Dark theme uses the existing Venoxa dark palette with accessible contrast for completed, current, locked and revision states."
Render the Learning Path in dark: app bg `#0B1020`, header `#121A2F`, cards `#17223B`, border `#263452`, level tab A1 solid `#4F7CFF`, locked tabs dark; completed nodes bright green `#2BC08F`; current node `#4F7CFF` with halo; "CONTINUE" pill white with dark text; current-lesson card has a `#4F7CFF` border and a primary-blue "Start lesson" button; level card "A1 · Beginner 3 / 20 lessons"; a card "12 words due – Review before you continue" with a teal-tint icon. Streak chip uses an amber-tinted dark fill; XP chip a blue-tinted dark fill. All pages must work in dark mode, not only this one.

### 5.9 STATES AND SERVER-SIDE RULES (PDF p.11)
Left card "VISUAL LANGUAGE · Five states, one glance" lists the five states (Section 3.7) with captions: Completed "Checkmark. Always reopenable for revision."; Current lesson "Highlighted with a 'Continue' marker. Exactly one at a time."; Locked "Lock icon. Prerequisites not met; blocked by the server, not just hidden."; Revision "Dashed amber. Optional recap material, never blocks progress."; Assessment "Trophy. Unit or level check that validates understanding."
Right card "HOW LOCKING REALLY WORKS · The server decides, the screen reflects it": Browser ("Opens a lesson from the path or by direct link") → Path API ("Verifies the Supabase token, then checks prerequisites") → Database ("path_lessons · user_path_progress (clients can read, only the API writes)"). Three outcome boxes: **UNLOCKED** (green): lesson content and exercises are returned, correct answers never are. **LOCKED → 403** (red): the request is refused and the student is sent to their current lesson; same result for direct URLs and API calls. **COMPLETED** (blue): server grades the attempt, records the score, unlocks the next lesson in one transaction. Footer note: "**Stays exactly as is:** existing grammar and vocabulary, listening and pronunciation, level test, tools, Study Plan data and all user accounts. The new tables are additive."

### 5.10 STUDY PLAN under My Progress (PDF p.12: "The plan generator, kept and restyled")
Subtitle: "The existing generator (levels, dates, minutes per skill, words and rules per day) lives under My Progress. The path-aware pacing hint is a proposal, not a given."
- URL `/progress/plan`. **Left card "Create your plan"** ("Same generator, restyled. Start level can come from placement."): fields CURRENT LEVEL (A1), TARGET LEVEL (B1), START DATE (4 Nov 2026), TARGET DATE (30 Jun 2027) as small labelled inputs in a 2×2 grid; "DAILY STUDY TIME" segmented buttons 1 h / **2 h** / 3 h / 4 h; "MINUTES PER SKILL (PER DAY)" six rows with blue bars and values: Listening 30, Reading 30, Speaking 20, Writing 20, Vocabulary 25, Grammar 15 min; "New words per day" with a pill "Auto · 10"; green success strip "Realistic-pace check passed for A1 → B1"; primary button "Generate study plan".
- **Right**: four stat cards: "34 weeks", "10 new words / day", "1 grammar rule / day", "2,380 words in total". Below, the **weekly grid** card: "Week 1 of 34" with prev/next arrows; columns Mon–Sun; rows Listening 30 min, Reading 30 min, Speaking 20 min, Writing 20 min, Vocabulary 25 min, Grammar 15 min; completed cells are green with a white check, today's pending cells have a blue outline, future cells pale grey. Caption: "Cells tick automatically when you finish matching activities (listening, reading, vocabulary review). Manual ticking stays available."
- **Optional pacing banner** (dashed blue border, tint): map icon, eyebrow "PROPOSAL · PATH-AWARE PACING", text "17 A1 lessons left. About 3 a week finishes A1 in mid-December." with an "Optional" pill. Implement behind a feature flag, default on, easy to remove.
- Existing Study Plan data and calendar progress must be preserved and migrated untouched.

### 5.11 VOCABULARY TOOLS (PDF p.13: "Five vocabulary tools in one place")
Subtitle: "Spaced-repetition review (Again / Hard / Good / Easy), phrasal verbs, slang, idioms and Langeek categories. Words that appear in a path lesson get a small 'In your path' tag."
Breadcrumbs "My Library › Vocabulary › …". A tab row of five: **Review · 12**, Phrasal, Slang, Idioms, Langeek (on the other screens: Vocabulary (SRS), Phrasal Verbs, Slang, Idioms, Langeek). Three screens:
1. **Review (SRS)**: flashcard: eyebrow "B1 · VERB", word "abandon" (big, 900 weight), pills "🔊 US" "🔊 UK", definition "to leave a person or place without intending to return", example "They had to **abandon** the car in the snow." (key word blue-bold). Four rating buttons below: Again (red tint, "1 min"), Hard (amber, "10 min"), Good (blue tint, "1 day"), Easy (mint, "4 days").
2. **Phrasal Verbs** list: cards with the verb bold, meaning, blue example sentence, and a mint tag "Lesson 18" etc. when it appears in a path lesson (give up – stop trying – "Don't give up now."; look after – take care of – "She looks after her brother."; turn on – start a device – "Turn on the light." (Lesson 12); find out – discover – "I found out the truth.").
3. **Langeek**: level chips A1 A2 B1 B2; category cards with progress bar: Hello and Goodbye 24 words, Family 38, Food and Drink 52, Numbers 30, Colors 18, Daily Routine 44; note "Review due badge appears on the tab, as today."
Keep the existing SRS algorithm, data and CSV sources (`public/data/*.csv`) untouched.

### 5.12 GRAMMAR (PDF p.14: "Free grammar reference, linked to the path")
Subtitle: "The existing grammar browser (levels, categories, rules, AI explanations) stays in My Library. Rules that are taught in a path lesson link back to it."
Three-pane flow: (1) level chips A1–C1 + category list (Present Tenses (active), Past Tenses, Questions, Modal Verbs, Articles, Prepositions); (2) rule list for "PRESENT TENSES · A1" with rows and optional mint "Lesson N" tags: Present Simple: affirmative and negative (Lesson 13), Present Simple: questions with do / does (Lesson 14), Verb TO BE in the present (Lesson 3), Adverbs of frequency, Have / Has (Lesson 16); (3) rule detail: eyebrow "AI EXPLANATION", title, short explanation with the key bit bold ("Add **-s** for he / she / it."), example lines with blue-bold verbs, buttons "✦ More examples" and "✎ Practise", and a mint callout "Taught step-by-step in Learning Path · Lesson 13. Library stays open for free browsing." (a link that opens that path lesson if unlocked, otherwise shows its locked state).

### 5.13 SKILLS: LISTENING, READING, WRITING (PDF p.15: "unchanged")
- **Listening**: TOPIC field ("At the airport") + LEVEL field (A1); length chips Short / **Medium** / Long; audio card "AI-written story · audio" with a big blue round play button, progress bar and "1:10", transcript with highlighted phrases (amber highlight); buttons "History" and "Favorites".
- **Reading (AI)**: TOPIC + LEVEL fields; card with eyebrow "READING · A1", title "My school day", text excerpt, buttons "🔊 Listen" and a mint "Tap a word for meaning"; below a comprehension question "What time does school start?" with options (selected correct option green: "At eight", "At ten").
- **Writing (AI)**: type chips Email / Story / Opinion / Free; text area with errors underlined in red; "AI feedback" card with "Score 62" pill and correction rows (red-tint "!" icon, struck-through original → green correction, short rule: "am go → went – Past time: use Past Simple.", "buyed → bought – “buy” is irregular."); "History" button.
All keep their current features (topic, level, length, history, favorites, feedback). Inside a path lesson the same components appear as one step.

### 5.14 SKILLS: SPEAKING, PRONUNCIATION, TEST GENERATOR (PDF p.16)
- **Speaking (Call)**: persona chips Teacher (active), Friend, Native speaker, Debate, Interviewer, Storyteller; a large circular mic button with a teal→lavender gradient and a soft ring; "Talking with your Teacher", timer "02:14", blue waveform bars; transcript card ("You: I go to market yesterday." / TEACHER: "Nice try! We say “I **went** to the market yesterday.”"); red "End call" button. Keep the existing full-screen call mode behaviour (continuous recognition, Edge TTS chain) and keep the footer hidden on the call screen.
- **Pronunciation (IPA)**: tabs Vowels / Consonants / Diphthongs; grid of IPA tiles (/iː/ selected in solid blue, /ɪ/, /e/, /æ/, /ʌ/, /ɑː/); detail card: big blue "/iː/", pills "🔊 US" "🔊 UK", description "Long “ee” sound. Spread your lips, tongue high and forward.", word/IPA rows (see /siː/, team /tiːm/, key /kiː/); amber strip "🔊 Minimal Pairs: ship · sheep".
- **Test Generator**: fields LEVEL (A1), QUESTIONS (10), TOPIC (Daily life), TIMER (Off); question-type chips (16+ types, multi-select, selected = blue tint): Fill in the Blank, Synonym, Multiple Choice, Preposition, Drag and Drop, True / False / Not Given, Idiom Meaning, MC Cloze, …; preview card "Q 3 OF 10 · FILL IN THE BLANK – She ___ to school by bus." with options go / goes / going; primary "Generate test".

### 5.15 LEVEL TEST, RESULT, CERTIFICATE (PDF p.17)
- **Level Test (placement)**: breadcrumb "Learning Path › Placement › Level Test"; chip "Adaptive · server graded" + "Question 14 / 30"; progress bar; eyebrow "GRAMMAR · B1"; question "If it rains tomorrow, we ___ at home."; options stay / **will stay** (selected) / would stay / stayed; footnote "Placement result opens your starting point on the Learning Path."
- **Result** (under My Progress › Level Test): eyebrow "YOUR LATEST RESULT"; big blue square "A2"; "Elementary"; rows Taken (4 Nov 2026), Questions (30), Starting lesson (A2 · Lesson 1); primary "Start A2 path"; tonal buttons "History", "Retake".
- **Certificate** (My Progress › Certificate): framed certificate (double blue border): logo + "Venoxa AI", eyebrow "ENGLISH PROFICIENCY", "Certificate", "This certifies that", name (underlined), "has reached CEFR level", big blue "A2", date; primary "Download PDF". Keep the existing PDF generation and the `#/verify/<id>` verification route.

### 5.16 TOOLS (PDF p.18–20; all under My Library › Tools)
- **Smart Translation**: language chips "Arabic ⇄ English"; input (RTL for Arabic) "أريد أن أتعلم اللغة الإنجليزية"; result card (blue outline) "I want to learn English" with "🔊 Listen" and "☆ Save"; "PRINCIPAL TRANSLATIONS" rows (learn — verb · to gain knowledge; study — verb · to examine); links "Show examples · History · Favorites".
- **Tone Rewriter**: chips Formal, **Casual**, Business, Academic, Friendly with helper "Casual · conversational, relaxed"; "YOUR TEXT" card ("I would like to request an extension on the deadline."); "REWRITTEN" card (blue outline) "Hey, could I get a bit more time on this? Thanks!" with "Copy" and "☆ Favorite".
- **Sentence Diagrammer**: "SENTENCE" card with colour-coded word chips and tiny POS labels (She PRON, is AUX, reading V, a DET, very ADV, old ADJ, book N, in PREP, the DET, garden N); "STRUCTURE" card rows Subject = She, Verb phrase = is reading, Object = a very old book, Place = in the garden; legend chips Noun, Verb, Adjective, Adverb, Preposition, Conjunction (colours in 3.2).
- **Word Family**: input "create" + "Explore"; cards VERB (create, creates, created, creating), NOUN (creation, creator, creativity), ADJECTIVE (creative, creational), ADVERB (creatively) with POS-coloured chips; pills "🔊 US" "🔊 UK".
- **Collocations**: input "decision" + "Find"; cards "VERB + DECISION" (make a, take a, reach a) with example "We need to make a decision today."; "ADJECTIVE + DECISION" (final, difficult, wise) with "It was a difficult decision."; Arabic gloss line "يتخذ قرارًا · قرار صعب".
- **Etymology**: input "television" + "Trace"; "ORIGIN – Greek + Latin – Coined in the early 1900s"; two rows: "tele-" Greek "far, at a distance" (blue-grey row), "vision" Latin "act of seeing" (mint row); caption "Root, literal meaning and word parts, with an AI-written story of the word."
- **Word of the Day**: eyebrow "WEDNESDAY · 4 NOVEMBER", word "resilient" (huge), "/rɪˈzɪliənt/ · adjective · B2", "🔊 US/UK", definition card + blue example "Children are often more resilient than we think.", mint button "Add to review" (feeds the SRS queue).
- **Idiom of the Day**: amber eyebrow "IDIOM OF THE DAY", "Break the ice", US/UK pills, card MEANING ("to make people feel more relaxed at the start of a meeting") and EXAMPLE ("He told a joke to break the ice."), mint "Add to review".
- **Focus Timer**: presets Focus 25 (active), Short 5, Long 15, Read 45; large ring countdown "18:42 – Focus"; buttons "Pause" (primary) and "Reset" (tonal); caption "The countdown also shows in the browser tab: 18:42 · Venoxa". Timer state persists while navigating (as today). **Minimal Pairs** keeps its current features and gets the same card styling.

### 5.17 PROFILE (PDF p.21: "Profile, goals and achievements")
Subtitle: "Everything the current profile page offers (achievements, usage time, daily goal, streak, level, per-skill progress, editing) in one calmer layout."
URL `/progress/profile`. Left column: **profile header card** (large gradient avatar, name "Amina", chips "My level · A1" (blue), "4-day streak" (amber), "Basic Plan" (grey), button "Edit profile"); **"Overall progress by skill"** card with five horizontal bars: Vocabulary 42%, Grammar 18%, Reading 30%, Listening 26%, Speaking 12%; **"Edit profile"** card: USERNAME, BIRTH DATE, GENDER, LANGUAGES YOU STUDY fields (2×2), buttons "Upload photo" (grey) and "Delete account" (red tint). Right column: **Daily goal** card (green ring "36 / 50 min", "14 more minutes to reach today's goal."), **Usage time** (7 bars M–S), **Achievements** (2 badges earned; First lesson (amber star), 3-day streak (mint flame), 50 words (locked), Level up (locked)). Preserve all existing profile fields, avatar upload, account deletion and achievements logic.

---

## 6. LEARNING-PATH RULES (the core behaviour the owner asked for)

1. **One way forward.** A student has exactly one current lesson. Lesson N+1 unlocks only when lesson N is completed (check passed ≥ 70%). A level unlocks only after its final level check is passed (or via placement).
2. **No skipping through the path.** Locked lessons and locked levels cannot be opened from the UI or by URL/API. The server returns 403 and the UI redirects to the current lesson with a friendly message.
3. **Placement** can set the start level; levels below the start become "open for revision", **not completed**. A student starting from A1 (default for new users) sees everything above Lesson 1 locked.
4. **Revision** content (recaps, previous lessons) is always open and never blocks progress. Revisiting a completed lesson does not change its status or score unless a better score is explicitly recorded.
5. **Library is free.** My Library stays fully open at every level for exploration; it must never alter path progress. Items that belong to a path lesson show a small "Lesson N" / "In your path" tag.
6. **One obvious next action** everywhere: Dashboard "Continue learning", Path "Start lesson / CONTINUE", mobile Home "Continue".
7. **Spaced-repetition reviews** are suggested ("12 words due · Review before you continue") but never block the path.
8. **Study Plan** cells tick automatically when matching activities are completed; manual ticking remains. Optional path-aware pacing hint (5.10).
9. XP, streak and achievements are computed server-side from real activity (e.g. +40 XP on a passed lesson in the demo; define the formula once and document it).

---

## 7. CONTENT / CURRICULUM

- Levels: **A1, A2, B1, B2, C1** (five levels; no C2 in the PDF). A1 is shown as 20 lessons ("Lesson 4 of 20"), grouped into units of ~4 lessons ("UNIT 1 · Getting started"). Use the same structure for the other levels, with counts configurable per level.
- Seed the A1 lessons named in the PDF in this order and keep the exact titles: 1 "Alphabet & sounds" (Pronunciation), 2 "Subject pronouns" (Grammar), 3 "The verb TO BE" (Grammar), 4 "Introducing yourself" (Grammar + listening; steps: Grammar → Vocabulary → Listening → Practice → Check), then an optional Recap (revision), 5 "Articles: a / an / the", then "Plurals" and so on. Other lesson titles seen in the PDF as library links: Lesson 12 (phrasal "turn on"), 13 Present Simple affirmative/negative, 14 Present Simple questions with do/does, 16 Have/Has, 18 (phrasal "give up").
- For lessons not named in the PDF, **build them from the existing grammar rules, vocabulary sets (Langeek categories like Hello & Goodbye, Family, Food & Drink, Numbers, Colors, Daily Routine) and listening content already in the app**. Mark generated outlines as `draft` in the database so the owner can review them. Do not fabricate large amounts of new lesson text; prefer reusing existing data. Put authoring in data files (JSON/SQL seed), not in React code, so lessons can be edited without code changes.
- Vocabulary attached to a lesson comes from existing sets; Grammar content from existing rules/AI explanations; Listening uses the existing TTS chain.

---

## 8. DATA MODEL AND API (additive only; do not alter existing tables)

### 8.1 Tables (names from the PDF; adjust to the existing conventions)
- `path_levels` (code A1–C1, title e.g. "Beginner", order)
- `path_units` (level, order, title e.g. "Getting started")
- `path_lessons` (id, slug, level, unit, order_index, title, subtitle/type, objective text, est_minutes, kind: lesson | revision | assessment, steps JSON (ordered step definitions and content refs), pass_score default 70, prerequisite (previous lesson id or rule), status: draft | published)
- `path_exercises` (lesson id, step, type, prompt, options, **answer key + explanation: server-only, never selected by public client queries**)
- `user_path_progress` (user id, lesson id, status: locked | current | completed, best_score, attempts, xp_awarded, completed_at)
- Optional: `user_path_state` (user id, current_lesson_id, start_level, placement_result) and XP/streak/achievement tables if they do not already exist.
- **Row Level Security**: clients may read their own progress and published lesson metadata; **only the API (service role) writes progress**; the answer keys are not readable by clients. Add indexes on (user_id, lesson_id) and (level, order_index).

### 8.2 Endpoints (Express, reuse existing auth middleware that verifies the Supabase token)
- `GET /api/path` → levels, units, lessons with **computed state** per lesson for this user (completed / current / locked / revision / assessment), level percentages, counts.
- `GET /api/path/current` → the next unlocked lesson (used by every "Continue learning" button).
- `GET /api/path/lessons/:slug` → lesson content if unlocked, otherwise **403** with the current lesson in the body. Exercises are returned **without answers**.
- `POST /api/path/lessons/:slug/attempt` → submit answers; the server grades, stores the score, returns per-question feedback (correct/incorrect + explanation) and, when the check is passed (≥ pass_score), marks the lesson completed, awards XP and **unlocks the next lesson in a single transaction** (idempotent: repeating the request never double-awards).
- `POST /api/path/placement` (or reuse the level-test endpoint) → set start level; mark lower levels "open for revision"; unlock the first lesson of the start level.
- `GET /api/path/summary` → dashboard data (current lesson, ring %, streak, XP, words learned, study time, reviews due, achievements).
- All progress changes are validated server-side; the client UI only reflects the server's response (optimistic UI is allowed only for animations, never for unlocking).

### 8.3 Security rules
Correct answers are never sent to the browser. Locked content is never returned. Direct URLs and API calls to locked lessons return 403. Rate-limit attempt submissions. Existing user accounts and data are migrated without loss: existing users start at A1 Lesson 1 unless a stored level-test result exists (then apply the placement rules); never mark lessons completed without an assessment.

---

## 9. ROUTING AND STATE

- Introduce URL routes (3.9) with a thin mapping from the old `activeTab` ids to the new routes so every old tool still opens (e.g. `vocab` → `/library/vocabulary`, `grammar` → `/library/grammar`, `speaking` → `/library/skills/speaking`, `level-test` → `/path/placement`, `study-plan` → `/progress/plan`, `profile` → `/progress/profile`).
- Keep the speaking/call screen hiding the footer and the persistent Focus Timer running across navigation.
- Data fetching with a small cache; show skeletons/loading states in the same card shapes; empty states reuse the cover motif; error states offer retry.
- Remove the old `PlaceholderPage` usage only for pages that now have real content.

---

## 10. RESPONSIVE BEHAVIOUR

- ≥1024px: header nav + two-column layouts. 768–1023px: single column with right-rail cards stacked below; header nav as icons+labels where space allows. <768px: bottom nav (Home, Path, Library, Progress), single-column cards, the path becomes the vertical list in PDF p.9, lessons are full-width with a pinned "Continue" button.
- The Learning Path level tabs scroll horizontally on small screens. Tables never overflow (wrap in a scroll container).
- Test at 1440, 1280, 1024, 768, 390 and 360px wide.

---

## 11. DO NOT

- Do not remove or rewrite existing tools, AI routes, TTS chains, SRS algorithm, level-test engine, certificate generator or study-plan generator; only re-skin and re-home them.
- Do not hardcode the demo numbers/names. Do not expose answer keys to the client. Do not unlock anything client-side. Do not store progress only in localStorage.
- Do not change environment variable names (e.g. `OPENROUTER_API_KEYY` is intentional). Do not touch the API's AI provider logic.
- Do not add a second auth system, a heavy UI framework, or large new dependencies without need (acceptable: the Inter font package). The router (`wouter`) and `framer-motion` are already installed.

---

## 12. IMPLEMENTATION PLAN (execute in this order; commit after each)

**Phase 0: Recon.** Read the repo; list tab ids → new routes; list data flows; write the plan. Confirm the PDF pages are available.
**Phase 1: Design system + shell.** Tokens (light/dark), Inter, base components (Button, Chip, Card, Progress, Ring, StatTile, Breadcrumb, Tooltip), single-row Header, mobile bottom nav, routing with legacy tab fallbacks, avatar menu (theme, language, premium, contact, settings, sign out). Restyle Footer and static pages with tokens.
**Phase 2: Data + API.** Migrations for the additive tables with RLS, seed A1 lessons, endpoints in 8.2, auth + 403 handling, unit tests for unlock rules (sequential unlocking, ≥70% pass, idempotency, placement rules, direct-URL 403).
**Phase 3: Dashboard** (5.1) wired to `/api/path/summary` and `/api/path/current`.
**Phase 4: Learning Path screen** (5.2) with level tabs, units, path nodes, right rail, desktop + mobile (5.7), dark mode.
**Phase 5: Lesson player** (5.3, 5.4): step navigation, reuse of Grammar / Vocabulary / Listening components, practice screen, server-graded attempts, completion screen, failure state.
**Phase 6: Placement** (5.5) using the existing adaptive level test; result → start level; "open for revision" states.
**Phase 7: My Library** (5.6, 5.11–5.16): sub-tabs Vocabulary / Grammar / Skills / Tools, search, move every existing tool in with breadcrumbs, add "Lesson N / In your path" tags where a word or rule is taught in a path lesson.
**Phase 8: My Progress** (5.6, 5.10, 5.15, 5.17): overview, Study Plan (auto-tick from path/activity), level-test results, certificate, profile.
**Phase 9: Polish and QA.** Dark mode on every page, RTL pass, accessibility pass, empty/loading/error states, motion, performance (lazy-load heavy pages; `App.jsx` is large, so split routes), visual comparison against the PDF.

---

## 13. ACCEPTANCE CHECKLIST (verify and report pass/fail for each)

Behaviour
- [ ] New user: only A1 Lesson 1 is current; everything else shows locked; Library fully open.
- [ ] Opening a locked lesson by URL or API returns 403 and redirects to the current lesson.
- [ ] Passing the check (≥ 70%) completes the lesson and unlocks the next in one transaction; failing keeps it locked and offers retry; repeating the request does not double-award XP.
- [ ] "Continue learning" on Dashboard / Path / mobile always lands on the same server-resolved lesson.
- [ ] Placement to B1 marks A1 and A2 "open for revision" (not completed) and starts B1 · Lesson 1.
- [ ] Correct answers never appear in network responses before submission.
- [ ] All 26 original destinations are reachable (Section 4 map); the old Study Plan data, SRS data, certificates and `#/verify/<id>` still work.
- [ ] Study Plan cells auto-tick on matching activity; manual ticking still works.

Visual (compare against PDF pages at 1280px and 390px, light and dark)
- [ ] p.3 Dashboard, p.4 Learning Path, p.5 Lesson, p.6 Practice + Completion, p.7 Placement (3 screens), p.8 Library + Progress, p.9 Mobile (3 screens), p.10 Dark path, p.11 five states, p.12 Study Plan, p.13 Vocabulary (3), p.14 Grammar (3), p.15 Listening/Reading/Writing, p.16 Speaking/Pronunciation/Test Generator, p.17 Level test/Result/Certificate, p.18–20 nine tools, p.21 Profile, p.22 map.
- [ ] Inter font, token colours, radii, chip styles, icon set, state visuals (3.7) match.
- [ ] RTL (Arabic) mirrors correctly; English lesson content stays LTR.
- [ ] Keyboard and screen-reader basics work; contrast passes AA in both themes; reduced-motion respected.
- [ ] Typecheck and build pass; no console errors; no regressions in the AI chat / TTS / speaking call flow.

Final report must include: file list, migrations and how to apply them, endpoints added, commands to run, screenshots (or notes) per PDF page, assumptions (header utility items moved to the avatar menu, XP formula, curriculum drafts, anything not shown in the PDF), and known gaps.
