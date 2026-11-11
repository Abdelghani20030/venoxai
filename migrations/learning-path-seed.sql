-- ═══════════════════════════════════════════════════════════════════════════
--  Venoxa Learning Path — curriculum seed (spec §7)
--
--  Apply with:  node scripts/apply-sql.mjs migrations/learning-path-seed.sql
--  Idempotent: re-running upserts levels/units/lessons and re-inserts
--  exercises (deleting the seeded ones first).
--
--  A1 numbering follows the showcase exactly:
--    1 Alphabet & sounds · 2 Subject pronouns · 3 The verb TO BE ·
--    4 Introducing yourself (+ optional recap) · 5 Articles: a / an / the ·
--    6 Plurals · … · 12 phrasal "turn on" · 13 Present Simple affirmative &
--    negative · 14 Present Simple questions with do/does · 16 Have / Has ·
--    18 phrasal "give up" · 20 lessons in total.
--
--  Lessons named in the showcase are PUBLISHED with real content and graded
--  exercises. Lessons generated from existing vocabulary sets (Langeek
--  categories) are seeded as status='draft' outlines for owner review, per
--  §7 — flip status to 'published' after reviewing. path_exercises.answer
--  and .explanation are server-only (RLS-blocked, stripped by the API).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Levels ─────────────────────────────────────────────────────────────────
insert into public.path_levels (code, title, tagline, order_index) values
  ('A1', 'Beginner',           'From zero to simple conversations',            1),
  ('A2', 'Elementary',         'Everyday situations with confidence',          2),
  ('B1', 'Intermediate',       'Express opinions and handle travel',           3),
  ('B2', 'Upper intermediate', 'Fluent, detailed conversations',               4),
  ('C1', 'Advanced',           'Precision, nuance and professional fluency',   5)
on conflict (code) do update
  set title = excluded.title, tagline = excluded.tagline, order_index = excluded.order_index;

-- ── Units ──────────────────────────────────────────────────────────────────
insert into public.path_units (level_code, order_index, title) values
  ('A1', 1, 'Getting started'),
  ('A1', 2, 'First words'),
  ('A1', 3, 'Everyday life'),
  ('A1', 4, 'Simple grammar'),
  ('A1', 5, 'Daily conversations'),
  ('A2', 1, 'Everyday routines'),
  ('B1', 1, 'Stories and opinions'),
  ('B2', 1, 'Complex ideas'),
  ('C1', 1, 'Precision and nuance')
on conflict (level_code, order_index) do update set title = excluded.title;

-- ── Lessons ────────────────────────────────────────────────────────────────
insert into public.path_lessons
  (slug, level_code, unit_id, order_index, lesson_no, title, subtitle, objective,
   est_minutes, kind, steps, pass_score, xp_reward, status)
values
-- UNIT 1 · Getting started ──────────────────────────────────────────────────
('a1-alphabet-and-sounds', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 1, 1, 'Alphabet & sounds', 'Pronunciation · A1',
 'Say and recognise the 26 English letters and the five vowel sounds.',
 8, 'lesson', $j$[
  {"type":"grammar","title":"The English alphabet","body":"English has 26 letters. Five are vowels: a, e, i, o, u. The other 21 are consonants. A letter has a name (how we say it) and a sound (what it looks like in words).","examples":["b — /biː/","f — /ef/","k — /keɪ/"]},
  {"type":"vocab","title":"Key words","items":[{"term":"vowel","ar":"حرف علة"},{"term":"consonant","ar":"حرف ساكن"},{"term":"capital letter","ar":"حرف كبير"},{"term":"lowercase","ar":"حرف صغير"}]},
  {"type":"listening","title":"Listen & repeat: the vowels","lines":["a","e","i","o","u"]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-subject-pronouns', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 2, 2, 'Subject pronouns', 'Grammar · A1',
 'Use I, you, he, she, it, we and they correctly as subjects.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"Subject pronouns","body":"Subject pronouns replace the name of the person or thing doing the action: I, you, he, she, it, we, they.","examples":["I am a student.","He is my brother.","We are friends."]},
  {"type":"vocab","title":"Key words","items":[{"term":"I","ar":"أنا"},{"term":"you","ar":"أنت / أنتِ"},{"term":"he","ar":"هو"},{"term":"she","ar":"هي"},{"term":"it","ar":"لغير العاقل"},{"term":"we","ar":"نحن"},{"term":"they","ar":"هم"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I am a student.","She is my sister.","They are teachers."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-the-verb-to-be', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 3, 3, 'The verb TO BE', 'Grammar · A1',
 'Use am, is and are with the right subject pronoun.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"am · is · are","body":"TO BE has three present forms: am (with I), is (with he / she / it), and are (with you / we / they).","examples":["I am ready.","She is a teacher.","We are happy."]},
  {"type":"vocab","title":"Key words","items":[{"term":"am","ar":"أكون (مع I)"},{"term":"is","ar":"يكون (مع he/she/it)"},{"term":"are","ar":"يكونون (مع you/we/they)"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I am ready.","He is at home.","They are happy."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-introducing-yourself', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 4, 4, 'Introducing yourself', 'Grammar · Listening · A1',
 'Introduce yourself: your name, your city and what you do.',
 12, 'lesson', $j$[
  {"type":"grammar","title":"Three sentences to introduce yourself","body":"Say your name, where you are from, and what you do. Keep the TO BE verb in every sentence.","examples":["My name is Ali.","I am from Riyadh.","I am a student."]},
  {"type":"vocab","title":"Key words","items":[{"term":"name","ar":"الاسم"},{"term":"from","ar":"من"},{"term":"student","ar":"طالب"},{"term":"teacher","ar":"مُعلم"},{"term":"Nice to meet you","ar":"تشرفت بمعرفتك"}]},
  {"type":"listening","title":"Listen & repeat","lines":["Hi! My name is Ali.","I am from Riyadh.","Nice to meet you!"]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-recap-getting-started', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 5, null, 'Recap · Getting started', 'Revision · A1',
 'A quick mixed review of Unit 1. Optional — it never blocks your path.',
 8, 'revision', $j$[
  {"type":"vocab","title":"Mixed key words","items":[{"term":"I","ar":"أنا"},{"term":"he","ar":"هو"},{"term":"she","ar":"هي"},{"term":"we","ar":"نحن"},{"term":"they","ar":"هم"},{"term":"am","ar":"أكون"},{"term":"is","ar":"يكون"},{"term":"are","ar":"يكونون"},{"term":"name","ar":"الاسم"},{"term":"from","ar":"من"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I am from Riyadh.","She is my sister.","They are my friends.","My name is Sara."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 0, 'published'),

('a1-unit-1-check', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=1),
 6, null, 'Unit 1 check', 'Assessment · A1',
 'Prove what you learned in Unit 1 to unlock Unit 2.',
 12, 'assessment', $j$[
  {"type":"check","title":"Unit 1 check"}
 ]$j$, 70, 60, 'published'),

-- UNIT 2 · First words ──────────────────────────────────────────────────────
('a1-articles-a-an-the', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 7, 5, 'Articles: a / an / the', 'Grammar · A1',
 'Choose between a, an and the correctly.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"a · an · the","body":"Use a before a consonant sound (a book), an before a vowel sound (an apple), and the when both people know the thing.","examples":["a car","an egg","the sun"]},
  {"type":"vocab","title":"Key words","items":[{"term":"article","ar":"أداة تعريف / تنكير"},{"term":"a / an","ar":"أداة تنكير"},{"term":"the","ar":"أداة تعريف"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I have a car.","She eats an apple.","The sun is bright."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-plurals', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 8, 6, 'Plurals', 'Grammar · A1',
 'Make regular and common irregular plurals.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"Making plurals","body":"Most nouns add -s (books). Nouns ending in s, sh, ch, x add -es (boxes). Some are irregular: man → men, child → children.","examples":["one book → two books","one box → two boxes","one man → two men"]},
  {"type":"vocab","title":"Key words","items":[{"term":"book → books","ar":"كتاب → كتب"},{"term":"box → boxes","ar":"صندوق → صناديق"},{"term":"man → men","ar":"رجل → رجال"},{"term":"child → children","ar":"طفل → أطفال"}]},
  {"type":"listening","title":"Listen & repeat","lines":["Two books.","Three boxes.","Four children."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-hello-and-goodbye', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 9, 7, 'Hello & Goodbye', 'Vocabulary · A1',
 'Greet people and say goodbye — from the Langeek “Hello & Goodbye” set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing Langeek set “Hello & Goodbye” (hello, hi, goodbye, bye, see you, good morning…). Listening via the TTS chain; practice and check exercises are authored at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-numbers', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 10, 8, 'Numbers', 'Vocabulary · A1',
 'Count from 0 to 20 — from the existing numbers set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing numbers set (zero…twenty). Listening via the TTS chain; practice and check exercises are authored at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-recap-first-words', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 11, null, 'Recap · First words', 'Revision · A1',
 'Optional mixed review of Unit 2.',
 8, 'revision', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Mixed review of articles, plurals and the Unit 2 vocabulary sets. Generated at review time."}
 ]$j$, 70, 0, 'draft'),

('a1-unit-2-check', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=2),
 12, null, 'Unit 2 check', 'Assessment · A1',
 'Prove what you learned in Unit 2 to unlock Unit 3.',
 12, 'assessment', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Graded exercises over articles, plurals and Unit 2 vocabulary. Authored at review time."}
 ]$j$, 70, 60, 'draft'),

-- UNIT 3 · Everyday life ────────────────────────────────────────────────────
('a1-colors', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 13, 9, 'Colors', 'Vocabulary · A1',
 'Name common colors — from the existing colors set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing colors set (red, blue, green…). Listening via the TTS chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-family', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 14, 10, 'Family', 'Vocabulary · A1',
 'Talk about your family — from the existing family set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing family set (father, mother, brother, sister…). Listening via the TTS chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-food-and-drink', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 15, 11, 'Food & Drink', 'Vocabulary · A1',
 'Order and talk about food — from the existing food set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing food & drink set (water, bread, rice…). Listening via the TTS chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-phrasal-turn-on', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 16, 12, 'Phrasal verbs: turn on', 'Vocabulary · A1',
 'Use “turn on” and “turn off” for lights and devices.',
 8, 'lesson', $j$[
  {"type":"grammar","title":"turn on / turn off","body":"Phrasal verbs combine a verb with a small word. Turn on = start a device. Turn off = stop it.","examples":["Turn on the light, please.","Turn off the TV.","I turn on my laptop every morning."]},
  {"type":"vocab","title":"Key words","items":[{"term":"turn on","ar":"يُشغّل"},{"term":"turn off","ar":"يُطفئ"},{"term":"light","ar":"ضوء / مصباح"},{"term":"TV","ar":"تلفاز"}]},
  {"type":"listening","title":"Listen & repeat","lines":["Turn on the light, please.","Turn off the TV.","Can you turn on the fan?"]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-recap-everyday-life', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 17, null, 'Recap · Everyday life', 'Revision · A1',
 'Optional mixed review of Unit 3.',
 8, 'revision', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Mixed review of colors, family, food & drink and “turn on”. Generated at review time."}
 ]$j$, 70, 0, 'draft'),

('a1-unit-3-check', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=3),
 18, null, 'Unit 3 check', 'Assessment · A1',
 'Prove what you learned in Unit 3 to unlock Unit 4.',
 12, 'assessment', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Graded exercises over Unit 3 vocabulary. Authored at review time."}
 ]$j$, 70, 60, 'draft'),

-- UNIT 4 · Simple grammar ───────────────────────────────────────────────────
('a1-present-simple-affirmative-negative', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 19, 13, 'Present Simple: affirmative & negative', 'Grammar · A1',
 'Talk about habits: what people do and don’t do.',
 12, 'lesson', $j$[
  {"type":"grammar","title":"Habits and facts","body":"Use the present simple for habits and facts. With he / she / it add -s (works). Negative: don’t / doesn’t + verb.","examples":["I work in Riyadh.","She works in Jeddah.","They don’t live here."]},
  {"type":"vocab","title":"Key words","items":[{"term":"work","ar":"يعمل"},{"term":"live","ar":"يسكن"},{"term":"study","ar":"يدرس"},{"term":"don’t / doesn’t","ar":"لا (للنفي)"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I work in Riyadh.","She works in Jeddah.","They don’t live here."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-present-simple-questions', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 20, 14, 'Present Simple questions: do / does', 'Grammar · A1',
 'Ask questions about habits with do and does.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"Do / Does questions","body":"Use do with I / you / we / they and does with he / she / it. Word order: Do/Does + subject + verb?","examples":["Do you like coffee?","Does she work here?","Where do they live?"]},
  {"type":"vocab","title":"Key words","items":[{"term":"do","ar":"هل (سؤال)"},{"term":"does","ar":"هل (مع he/she/it)"},{"term":"like","ar":"يُحب"}]},
  {"type":"listening","title":"Listen & repeat","lines":["Do you like coffee?","Does she work here?","Where do they live?"]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-prepositions-of-place', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 21, 15, 'Prepositions of place', 'Grammar · A1',
 'Say where things are: in, on, under, next to.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Prepositions of place (in, on, under, next to, behind) with the existing grammar explanations; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-have-has', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 22, 16, 'Have / Has', 'Grammar · A1',
 'Say what people have with have and has.',
 10, 'lesson', $j$[
  {"type":"grammar","title":"have · has","body":"Use have with I / you / we / they and has with he / she / it.","examples":["I have a car.","She has two brothers.","We have time."]},
  {"type":"vocab","title":"Key words","items":[{"term":"have","ar":"يملك (مع I/you/we/they)"},{"term":"has","ar":"يملك (مع he/she/it)"},{"term":"car","ar":"سيارة"}]},
  {"type":"listening","title":"Listen & repeat","lines":["I have a car.","She has two brothers.","We have time."]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-recap-grammar-basics', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 23, null, 'Recap · Grammar basics', 'Revision · A1',
 'Optional mixed review of Unit 4 grammar.',
 8, 'revision', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Mixed review of present simple, questions and have/has. Generated at review time."}
 ]$j$, 70, 0, 'draft'),

('a1-unit-4-check', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=4),
 24, null, 'Unit 4 check', 'Assessment · A1',
 'Prove what you learned in Unit 4 to unlock Unit 5.',
 12, 'assessment', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Graded exercises over Unit 4 grammar. Authored at review time."}
 ]$j$, 70, 60, 'draft'),

-- UNIT 5 · Daily conversations ──────────────────────────────────────────────
('a1-daily-routine', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=5),
 25, 17, 'Daily Routine', 'Vocabulary · A1',
 'Describe your day — from the existing daily-routine set.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing daily-routine set (wake up, eat, go to work…). Listening via the TTS chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-phrasal-give-up', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=5),
 26, 18, 'Phrasal verbs: give up', 'Vocabulary · A1',
 'Use “give up” and “keep going” when things are hard.',
 8, 'lesson', $j$[
  {"type":"grammar","title":"give up / keep going","body":"Give up = stop trying. Keep going = continue. Both are common in daily talk.","examples":["Don’t give up!","He gave up smoking.","Keep going — you are close!"]},
  {"type":"vocab","title":"Key words","items":[{"term":"give up","ar":"يستسلم / يتوقف عن المحاولة"},{"term":"keep going","ar":"يُكمل / يستمر"},{"term":"try","ar":"يُحاول"}]},
  {"type":"listening","title":"Listen & repeat","lines":["Don’t give up!","He gave up smoking.","Keep going — you are close!"]},
  {"type":"practice","title":"Practice"},
  {"type":"check","title":"Check"}
 ]$j$, 70, 40, 'published'),

('a1-telling-the-time', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=5),
 27, 19, 'Telling the time', 'Vocabulary · A1',
 'Ask and tell the time.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Telling the time (o’clock, half past, quarter to…) with the TTS listening chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-weather-and-seasons', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=5),
 28, 20, 'Weather & seasons', 'Vocabulary · A1',
 'Talk about the weather and the four seasons.',
 8, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Vocabulary from the existing weather set (hot, cold, rain, summer…). Listening via the TTS chain; exercises at review time."}
 ]$j$, 70, 40, 'draft'),

('a1-level-check', 'A1',
 (select id from public.path_units where level_code='A1' and order_index=5),
 29, null, 'Level 1 check', 'Assessment · A1',
 'Pass the Level 1 check to unlock A2.',
 15, 'assessment', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Final A1 assessment: mixed grammar and vocabulary from all five units. Authored at review time."}
 ]$j$, 70, 60, 'draft'),

-- A2–C1 · outline skeletons (configurable counts, spec §7) ──────────────────
('a2-past-simple-was-were', 'A2',
 (select id from public.path_units where level_code='A2' and order_index=1),
 1, 1, 'Past Simple: was / were', 'Grammar · A2',
 'Talk about the past with was and were.',
 10, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"was/were statements, negatives and questions with the existing grammar explanations."}
 ]$j$, 70, 40, 'draft'),
('a2-past-simple-regular', 'A2',
 (select id from public.path_units where level_code='A2' and order_index=1),
 2, 2, 'Past Simple: regular verbs', 'Grammar · A2',
 'Tell simple stories with -ed verbs.',
 10, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Regular -ed past forms with time expressions (yesterday, last week)."}
 ]$j$, 70, 40, 'draft'),
('a2-countable-uncountable', 'A2',
 (select id from public.path_units where level_code='A2' and order_index=1),
 3, 3, 'Countable & uncountable nouns', 'Grammar · A2',
 'Use much, many and some correctly.',
 10, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Countable vs uncountable nouns with much/many/some/a lot of."}
 ]$j$, 70, 40, 'draft'),
('a2-making-requests', 'A2',
 (select id from public.path_units where level_code='A2' and order_index=1),
 4, 4, 'Making requests', 'Functional English · A2',
 'Ask politely for things and favours.',
 10, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Could you…? / Would you mind…? with the TTS listening chain."}
 ]$j$, 70, 40, 'draft'),

('b1-present-perfect-intro', 'B1',
 (select id from public.path_units where level_code='B1' and order_index=1),
 1, 1, 'Present Perfect: introduction', 'Grammar · B1',
 'Connect the past to now with have/has + participle.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Present perfect forms and uses (experience, recent events)."}
 ]$j$, 70, 40, 'draft'),
('b1-comparatives-superlatives', 'B1',
 (select id from public.path_units where level_code='B1' and order_index=1),
 2, 2, 'Comparatives & superlatives', 'Grammar · B1',
 'Compare people, places and things.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"-er/-est, more/most and irregular forms."}
 ]$j$, 70, 40, 'draft'),
('b1-future-plans', 'B1',
 (select id from public.path_units where level_code='B1' and order_index=1),
 3, 3, 'Future plans: going to & will', 'Grammar · B1',
 'Talk about plans and predictions.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"be going to for plans, will for decisions and predictions."}
 ]$j$, 70, 40, 'draft'),
('b1-describing-experiences', 'B1',
 (select id from public.path_units where level_code='B1' and order_index=1),
 4, 4, 'Describing experiences', 'Functional English · B1',
 'Narrate travel and life experiences.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Present perfect + past simple storytelling with listening practice."}
 ]$j$, 70, 40, 'draft'),

('b2-passive-voice', 'B2',
 (select id from public.path_units where level_code='B2' and order_index=1),
 1, 1, 'The passive voice', 'Grammar · B2',
 'Shift focus from the doer to the action.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Passive forms across tenses with authentic examples."}
 ]$j$, 70, 40, 'draft'),
('b2-reported-speech', 'B2',
 (select id from public.path_units where level_code='B2' and order_index=1),
 2, 2, 'Reported speech', 'Grammar · B2',
 'Report what other people said.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Statement, question and command reporting with backshift."}
 ]$j$, 70, 40, 'draft'),
('b2-relative-clauses', 'B2',
 (select id from public.path_units where level_code='B2' and order_index=1),
 3, 3, 'Relative clauses', 'Grammar · B2',
 'Join ideas smoothly with who, which, that.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Defining and non-defining relative clauses."}
 ]$j$, 70, 40, 'draft'),
('b2-phrasal-verbs-depth', 'B2',
 (select id from public.path_units where level_code='B2' and order_index=1),
 4, 4, 'Phrasal verbs in depth', 'Vocabulary · B2',
 'Master high-frequency phrasal verbs.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Separable vs inseparable phrasal verbs from the existing phrasal sets."}
 ]$j$, 70, 40, 'draft'),

('c1-advanced-conditionals', 'C1',
 (select id from public.path_units where level_code='C1' and order_index=1),
 1, 1, 'Advanced conditionals', 'Grammar · C1',
 'Express hypothetical and regretful ideas precisely.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Mixed conditionals and wish/if only structures."}
 ]$j$, 70, 40, 'draft'),
('c1-inversion-emphasis', 'C1',
 (select id from public.path_units where level_code='C1' and order_index=1),
 2, 2, 'Inversion & emphasis', 'Grammar · C1',
 'Emphasise like a native writer.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Negative inversion, cleft sentences and fronting."}
 ]$j$, 70, 40, 'draft'),
('c1-discourse-markers', 'C1',
 (select id from public.path_units where level_code='C1' and order_index=1),
 3, 3, 'Discourse markers', 'Functional English · C1',
 'Structure arguments and conversations.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"However, moreover, on the other hand and friends."}
 ]$j$, 70, 40, 'draft'),
('c1-register-and-tone', 'C1',
 (select id from public.path_units where level_code='C1' and order_index=1),
 4, 4, 'Register and tone', 'Functional English · C1',
 'Choose the right style for the right audience.',
 12, 'lesson', $j$[
  {"type":"outline","title":"Draft outline","draft":true,"body":"Formal vs informal register with the tone-rewriter content as source."}
 ]$j$, 70, 40, 'draft')
on conflict (slug) do update set
  level_code = excluded.level_code,
  unit_id    = excluded.unit_id,
  order_index = excluded.order_index,
  lesson_no  = excluded.lesson_no,
  title      = excluded.title,
  subtitle   = excluded.subtitle,
  objective  = excluded.objective,
  est_minutes = excluded.est_minutes,
  kind       = excluded.kind,
  steps      = excluded.steps,
  pass_score = excluded.pass_score,
  xp_reward  = excluded.xp_reward,
  status     = excluded.status;

-- ── Exercises (seeded lessons only; answers are SERVER-ONLY) ───────────────
delete from public.path_exercises
where lesson_id in (select id from public.path_lessons where slug like 'a1-%');

-- a1-alphabet-and-sounds (steps: 3=practice, 4=check)
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-alphabet-and-sounds'), 3, 1, 'listen_mcq',
 'Listen and choose the letter you hear.', '["b","d","p","v"]', '0',
 'The speaker reads the letter b — /biː/.', 'b'),
((select id from public.path_lessons where slug='a1-alphabet-and-sounds'), 3, 2, 'type_in',
 'Write the first letter of the word “elephant”.', null, '["e","E"]',
 'Elephant starts with the vowel e.', null),
((select id from public.path_lessons where slug='a1-alphabet-and-sounds'), 4, 3, 'mcq',
 'Which of these is a vowel letter?', '["k","e","t","r"]', '1',
 'e is one of the five vowels: a, e, i, o, u.', null),
((select id from public.path_lessons where slug='a1-alphabet-and-sounds'), 4, 4, 'listen_mcq',
 'Listen and choose the letter.', '["m","n","k","g"]', '0',
 'The speaker reads the letter m — /em/.', 'm'),
((select id from public.path_lessons where slug='a1-alphabet-and-sounds'), 4, 5, 'type_in',
 'Write the missing vowel: c_t means “قطة” (the animal).', null, '["a","A"]',
 'cat — c-a-t.', null);

-- a1-subject-pronouns
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-subject-pronouns'), 3, 1, 'mcq',
 '___ is my father.', '["He","It","We","They"]', '0',
 'One male person = he.', null),
((select id from public.path_lessons where slug='a1-subject-pronouns'), 3, 2, 'type_in',
 'My mother is a doctor. ___ works at the hospital.', null, '["she","She"]',
 'My mother = she.', null),
((select id from public.path_lessons where slug='a1-subject-pronouns'), 4, 3, 'mcq',
 'Ali and Sara are friends. ___ are in my class.', '["She","He","They","It"]', '2',
 'Two people = they.', null),
((select id from public.path_lessons where slug='a1-subject-pronouns'), 4, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["It is a big car.","He is a big car.","Is it a big car?"]', '0',
 'The speaker says “It is a big car.”', 'It is a big car.'),
((select id from public.path_lessons where slug='a1-subject-pronouns'), 4, 5, 'type_in',
 'Sara and I = ___ (write the pronoun).', null, '["we","We"]',
 'Sara and I together = we.', null);

-- a1-the-verb-to-be
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-the-verb-to-be'), 3, 1, 'mcq',
 'She ___ a teacher.', '["am","is","are","be"]', '1',
 'he / she / it → is.', null),
((select id from public.path_lessons where slug='a1-the-verb-to-be'), 3, 2, 'type_in',
 'I ___ from Riyadh.', null, '["am"]',
 'I → am.', null),
((select id from public.path_lessons where slug='a1-the-verb-to-be'), 4, 3, 'mcq',
 'They ___ students.', '["am","is","are","be"]', '2',
 'they → are.', null),
((select id from public.path_lessons where slug='a1-the-verb-to-be'), 4, 4, 'type_in',
 'It ___ a small cat.', null, '["is"]',
 'it → is.', null),
((select id from public.path_lessons where slug='a1-the-verb-to-be'), 4, 5, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["We are late.","We are light.","We are right."]','0',
 'The speaker says “We are late.”', 'We are late.');

-- a1-introducing-yourself
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-introducing-yourself'), 3, 1, 'mcq',
 'My ___ is Sara.', '["name","old","from","do"]', '0',
 'Name = الاسم. “My name is…” is the standard introduction.', null),
((select id from public.path_lessons where slug='a1-introducing-yourself'), 3, 2, 'type_in',
 'I am ___ Saudi Arabia.', null, '["from"]',
 'I am from + place.', null),
((select id from public.path_lessons where slug='a1-introducing-yourself'), 4, 3, 'mcq',
 '___ name is Omar.', '["My","I","Me","We"]', '0',
 'Possessive: My name is…', null),
((select id from public.path_lessons where slug='a1-introducing-yourself'), 4, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["My name is Ali and I am a student.","My name is Omar and I am a teacher.","My name is Ali and I am a doctor."]','0',
 'The speaker says “My name is Ali and I am a student.”', 'My name is Ali and I am a student.'),
((select id from public.path_lessons where slug='a1-introducing-yourself'), 4, 5, 'type_in',
 'Nice to ___ you.', null, '["meet"]',
 'Nice to meet you — تشرفت بمعرفتك.', null);

-- a1-recap-getting-started (steps: 2=practice, 3=check)
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-recap-getting-started'), 2, 1, 'mcq',
 'I ___ a student.', '["am","is","are","be"]', '0',
 'I → am.', null),
((select id from public.path_lessons where slug='a1-recap-getting-started'), 2, 2, 'mcq',
 'My sister ___ from Jeddah.', '["am","is","are","be"]', '1',
 'my sister = she → is.', null),
((select id from public.path_lessons where slug='a1-recap-getting-started'), 3, 3, 'mcq',
 'Sara and Ali ___ my friends.', '["am","is","are","be"]', '2',
 'Two people → they → are.', null),
((select id from public.path_lessons where slug='a1-recap-getting-started'), 3, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["Nice to meet you.","Nice to heat you.","Nine to meet you."]','0',
 'The speaker says “Nice to meet you.”', 'Nice to meet you.');

-- a1-unit-1-check (step 0 = check)
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-unit-1-check'), 0, 1, 'mcq',
 '___ is my brother.', '["He","It","We","They"]', '0',
 'One male person = he.', null),
((select id from public.path_lessons where slug='a1-unit-1-check'), 0, 2, 'type_in',
 'I ___ from Saudi Arabia.', null, '["am"]',
 'I → am.', null),
((select id from public.path_lessons where slug='a1-unit-1-check'), 0, 3, 'mcq',
 'The cat ___ small.', '["am","is","are","be"]', '1',
 'the cat = it → is.', null),
((select id from public.path_lessons where slug='a1-unit-1-check'), 0, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["They are students.","They is students.","They am students."]','0',
 'The speaker says “They are students.”', 'They are students.'),
((select id from public.path_lessons where slug='a1-unit-1-check'), 0, 5, 'type_in',
 'My ___ is Ali.', null, '["name","Name"]',
 'My name is Ali — الاسم.', null);

-- a1-articles-a-an-the
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-articles-a-an-the'), 3, 1, 'mcq',
 'I have ___ car.', '["a","an","the","—"]', '0',
 'car starts with a consonant sound → a.', null),
((select id from public.path_lessons where slug='a1-articles-a-an-the'), 3, 2, 'mcq',
 'She eats ___ apple.', '["a","an","the","—"]', '1',
 'apple starts with a vowel sound → an.', null),
((select id from public.path_lessons where slug='a1-articles-a-an-the'), 4, 3, 'mcq',
 '___ sun is bright today.', '["A","An","The","—"]', '2',
 'There is only one sun → the.', null),
((select id from public.path_lessons where slug='a1-articles-a-an-the'), 4, 4, 'type_in',
 'This is ___ egg. (a / an)', null, '["an"]',
 'egg begins with a vowel sound → an.', null),
((select id from public.path_lessons where slug='a1-articles-a-an-the'), 4, 5, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["I have an uncle in Makkah.","I have a uncle in Makkah.","I have the uncle in Makkah."]','0',
 'The speaker says “I have an uncle in Makkah.”', 'I have an uncle in Makkah.');

-- a1-plurals
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-plurals'), 3, 1, 'mcq',
 'One book, two ___.', '["book","books","bookes","bookies"]', '1',
 'Most nouns just add -s.', null),
((select id from public.path_lessons where slug='a1-plurals'), 3, 2, 'mcq',
 'One box, three ___.', '["boxs","boxes","boxies","box"]', '1',
 'Nouns ending in -x add -es.', null),
((select id from public.path_lessons where slug='a1-plurals'), 4, 3, 'mcq',
 'One man, two ___.', '["mans","men","mens","manes"]', '1',
 'man → men is irregular.', null),
((select id from public.path_lessons where slug='a1-plurals'), 4, 4, 'type_in',
 'One child, two ___ (children/childs).', null, '["children"]',
 'child → children is irregular.', null),
((select id from public.path_lessons where slug='a1-plurals'), 4, 5, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["Two boxes are on the desk.","Two books are on the desk.","Two buses are on the desk."]','0',
 'The speaker says “Two boxes are on the desk.”', 'Two boxes are on the desk.');

-- a1-phrasal-turn-on
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-phrasal-turn-on'), 3, 1, 'mcq',
 'It is dark. ___ the light, please.', '["Turn on","Turn off","Give up","Keep going"]', '0',
 'Dark → you need light → turn on.', null),
((select id from public.path_lessons where slug='a1-phrasal-turn-on'), 3, 2, 'type_in',
 'I am sleepy. I will ___ the TV. (عطّف)', null, '["turn off","turn  off"]',
 'Stop a device = turn off.', null),
((select id from public.path_lessons where slug='a1-phrasal-turn-on'), 4, 3, 'mcq',
 'The opposite of “turn on” is ___.', '["turn off","turn up","turn over","turn into"]', '0',
 'on ↔ off.', null),
((select id from public.path_lessons where slug='a1-phrasal-turn-on'), 4, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["Can you turn on the fan?","Can you turn off the fan?","Can you turn up the fan?"]','0',
 'The speaker says “Can you turn on the fan?”', 'Can you turn on the fan?'),
((select id from public.path_lessons where slug='a1-phrasal-turn-on'), 4, 5, 'type_in',
 '___ the light, please. (شغّل) — one phrasal verb.', null, '["turn on","Turn on"]',
 'Start a device = turn on.', null);

-- a1-present-simple-affirmative-negative
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-present-simple-affirmative-negative'), 3, 1, 'mcq',
 'She ___ in Jeddah.', '["work","works","working","is work"]', '1',
 'he / she / it → verb + s.', null),
((select id from public.path_lessons where slug='a1-present-simple-affirmative-negative'), 3, 2, 'mcq',
 'They ___ live here.', '["don’t","doesn’t","isn’t","aren’t"]', '0',
 'they → don’t.', null),
((select id from public.path_lessons where slug='a1-present-simple-affirmative-negative'), 4, 3, 'mcq',
 'He ___ in a bank.', '["work","works","workes","is work"]', '1',
 'he → works.', null),
((select id from public.path_lessons where slug='a1-present-simple-affirmative-negative'), 4, 4, 'type_in',
 'I ___ in Riyadh. (work / works)', null, '["work"]',
 'I → base verb: work.', null),
((select id from public.path_lessons where slug='a1-present-simple-affirmative-negative'), 4, 5, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["She works in Jeddah.","She work in Jeddah.","She is working in Jeddah."]','0',
 'The speaker says “She works in Jeddah.”', 'She works in Jeddah.');

-- a1-present-simple-questions
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-present-simple-questions'), 3, 1, 'mcq',
 '___ you like coffee?', '["Do","Does","Is","Are"]', '0',
 'you → do.', null),
((select id from public.path_lessons where slug='a1-present-simple-questions'), 3, 2, 'mcq',
 '___ she work here?', '["Do","Does","Is","Are"]', '1',
 'she → does.', null),
((select id from public.path_lessons where slug='a1-present-simple-questions'), 4, 3, 'type_in',
 'Where ___ they live? (do / does)', null, '["do"]',
 'they → do.', null),
((select id from public.path_lessons where slug='a1-present-simple-questions'), 4, 4, 'mcq',
 '___ he speak English?', '["Do","Does","Is","Has"]', '1',
 'he → does.', null),
((select id from public.path_lessons where slug='a1-present-simple-questions'), 4, 5, 'listen_mcq',
 'Listen and choose the question you hear.', '["Do you like coffee?","Do you like tea?","Does you like coffee?"]','0',
 'The speaker says “Do you like coffee?”', 'Do you like coffee?');

-- a1-have-has
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-have-has'), 3, 1, 'mcq',
 'I ___ a car.', '["have","has","haves","having"]', '0',
 'I → have.', null),
((select id from public.path_lessons where slug='a1-have-has'), 3, 2, 'mcq',
 'She ___ two brothers.', '["have","has","haves","is have"]', '1',
 'she → has.', null),
((select id from public.path_lessons where slug='a1-have-has'), 4, 3, 'mcq',
 'We ___ time.', '["have","has","haves","are have"]', '0',
 'we → have.', null),
((select id from public.path_lessons where slug='a1-have-has'), 4, 4, 'type_in',
 'He ___ a big house. (have / has)', null, '["has"]',
 'he → has.', null),
((select id from public.path_lessons where slug='a1-have-has'), 4, 5, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["She has two brothers.","She have two brothers.","She has two sisters."]','0',
 'The speaker says “She has two brothers.”', 'She has two brothers.');

-- a1-phrasal-give-up
insert into public.path_exercises (lesson_id, step_index, order_index, type, prompt, options, answer, explanation, audio_script) values
((select id from public.path_lessons where slug='a1-phrasal-give-up'), 3, 1, 'mcq',
 'The lesson is hard, but don’t ___!', '["give up","give in","give out","give away"]', '0',
 'Give up = stop trying. The sentence encourages you to continue.', null),
((select id from public.path_lessons where slug='a1-phrasal-give-up'), 3, 2, 'mcq',
 'He ___ smoking last year.', '["gave up","gives up","giving up","give"]', '0',
 'Past of give up = gave up.', null),
((select id from public.path_lessons where slug='a1-phrasal-give-up'), 4, 3, 'type_in',
 '___ going — you are almost there! (استمر)', null, '["keep","Keep"]',
 'Keep going = continue.', null),
((select id from public.path_lessons where slug='a1-phrasal-give-up'), 4, 4, 'listen_mcq',
 'Listen and choose the sentence you hear.', '["Don’t give up!","Don’t give in!","Don’t give out!"]','0',
 'The speaker says “Don’t give up!”', 'Don’t give up.'),
((select id from public.path_lessons where slug='a1-phrasal-give-up'), 4, 5, 'type_in',
 'He never ___ up when a word is hard. (he → give/gives/gave… present simple)', null, '["gives"]',
 'he → gives up (present simple).', null);
