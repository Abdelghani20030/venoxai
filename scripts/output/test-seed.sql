-- Venoxa Level Test — generated seed data.
-- Model: openai/gpt-oss-120b
-- Generated: 2026-10-29T09:19:33.337Z
-- Run migrations/level-test.sql first, then this file.
-- All items are reviewed=false / status=draft. Do not activate before teacher review.

begin;


insert into lt_items (id, type, cefr_tag, difficulty_b, stem, options, correct_index, passage_id, passage_order, audio_script, source, reviewed, status) values ('lt_b2_grammar_0001', 'grammar', 'B2', 0.5, 'If the weather had been colder, the tourists ____ to stay indoors rather than exploring the market.', '["would have chosen","would choose","could have chosen","should have chosen"]'::jsonb, 0, null, null, null, 'ai', false, 'draft') on conflict (id) do nothing;
insert into lt_items (id, type, cefr_tag, difficulty_b, stem, options, correct_index, passage_id, passage_order, audio_script, source, reviewed, status) values ('lt_b2_grammar_0002', 'grammar', 'B2', 0.5, 'There ____ a growing number of studies that suggest regular exercise improves mental health more ____ occasional jogging.', '["is","were","are","has"]'::jsonb, 2, null, null, null, 'ai', false, 'draft') on conflict (id) do nothing;

commit;
