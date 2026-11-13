// scripts/vocab-grammar-map.mjs
// ─────────────────────────────────────────────────────────────────────────────
//  The classification brain of the vocabulary system.
//
//  Maps every (level × category × part-of-speech) sense to 1–3 concrete CEFR
//  grammar topics the learner is studying "along with" those words. Used by
//  build-vocab.mjs at seed time; deterministic and dependency-free.
//
//  Exports:
//    GRAMMAR_RULES       curated rule list [{code, level, title_en, title_ar, blurb}]
//    CATEGORY_GROUPS     category name → thematic group key (covers all 208)
//    GROUP_RULES         thematic rules per group × level
//    rulesForSense({level, category, pos, word}) → ordered rule codes (max 3)
// ─────────────────────────────────────────────────────────────────────────────

export const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

// ── 1. Curated grammar rules ────────────────────────────────────────────────
export const GRAMMAR_RULES = [
  // ══ A1 ══
  { code: "A1-BE",        level: "A1", title_en: "Verb to be (am / is / are)",            title_ar: "فعل الكينونة (am / is / are)",            blurb: "Affirmative, negative and question forms of be." },
  { code: "A1-QUEST-BE",  level: "A1", title_en: "Questions with be (Are you…? What is…?)", title_ar: "الأسئلة مع فعل الكينونة",               blurb: "Yes/no and wh-questions built on be." },
  { code: "A1-BE-ADJ",    level: "A1", title_en: "be + adjective (She is tall)",           title_ar: "فعل الكينونة مع الصفات",                  blurb: "Describing people and things with be + adj." },
  { code: "A1-SUBJ-PRON", level: "A1", title_en: "Subject pronouns (I, you, he, she…)",    title_ar: "ضمائر الفاعل",                            blurb: "Matching pronouns with be and present verbs." },
  { code: "A1-OBJPRON",   level: "A1", title_en: "Object pronouns (me, him, her…)",        title_ar: "ضمائر المفعول به",                        blurb: "Pronouns after verbs and prepositions." },
  { code: "A1-ART",       level: "A1", title_en: "Articles a / an / the",                  title_ar: "أدوات التعريف والتنكير (a / an / the)",   blurb: "Choosing a, an or the; zero article basics." },
  { code: "A1-PLU-REG",   level: "A1", title_en: "Regular plurals (-s / -es)",             title_ar: "الجمع المنتظم",                           blurb: "Spelling rules for -s and -es plurals." },
  { code: "A1-PLU-IRR",   level: "A1", title_en: "Irregular plurals (children, feet…)",    title_ar: "الجمع الشاذ",                             blurb: "Words that change form in the plural." },
  { code: "A1-POSS-ADJ",  level: "A1", title_en: "Possessive adjectives (my, your, his…)", title_ar: "ضمائر الملكية",                           blurb: "my / your / his / her / its / our / their." },
  { code: "A1-POSS-S",    level: "A1", title_en: "Possessive 's (Ali's sister)",           title_ar: "المملوك بـ 's",                           blurb: "Ownership with 's and s'." },
  { code: "A1-DEMO",      level: "A1", title_en: "Demonstratives (this / that / these / those)", title_ar: "أسماء الإشارة",                     blurb: "Pointing at near and far things." },
  { code: "A1-THERE",     level: "A1", title_en: "there is / there are",                   title_ar: "تركيب there is / there are",              blurb: "Saying what exists; some/any with there." },
  { code: "A1-PRES-AFF",  level: "A1", title_en: "Present simple: affirmative (+s)",       title_ar: "المضارع البسيط: الإثبات",                 blurb: "Habits and facts; third-person -s." },
  { code: "A1-PRES-NEG",  level: "A1", title_en: "Present simple: negative (don't / doesn't)", title_ar: "المضارع البسيط: النفي",               blurb: "don't and doesn't forms." },
  { code: "A1-PRES-Q",    level: "A1", title_en: "Present simple: questions (Do / Does…?)", title_ar: "المضارع البسيط: الأسئلة",                blurb: "Do/does questions and short answers." },
  { code: "A1-HAVEGOT",   level: "A1", title_en: "have / has got",                         title_ar: "فعل الملكية have got",                    blurb: "Possession with have got / have." },
  { code: "A1-CAN",       level: "A1", title_en: "can / can't (ability)",                  title_ar: "فعل القدرة can",                          blurb: "Ability and permission with can." },
  { code: "A1-IMP",       level: "A1", title_en: "Imperatives (Sit down. Please open…)",   title_ar: "صيغة الأمر",                              blurb: "Instructions, directions and requests." },
  { code: "A1-PREP-PLACE",level: "A1", title_en: "Prepositions of place (in, on, under, next to)", title_ar: "حروف الجر المكانية",              blurb: "Where things are." },
  { code: "A1-PREP-TIME", level: "A1", title_en: "Prepositions of time (at 7, on Monday, in May)", title_ar: "حروف الجر الزمانية",              blurb: "at / on / in for clock, day, month, season." },
  { code: "A1-QWORDS",    level: "A1", title_en: "Question words (what, where, who, how)", title_ar: "أدوات الاستفهام",                         blurb: "Asking for information." },
  { code: "A1-COUNT",     level: "A1", title_en: "Countable & uncountable nouns",          title_ar: "الأسماء المعدودة وغير المعدودة",          blurb: "an apple vs water; singular/plural nouns." },
  { code: "A1-SOMEANY",   level: "A1", title_en: "some / any",                             title_ar: "استخدام some و any",                      blurb: "Quantities with countable/uncountable nouns." },
  { code: "A1-WOULD-LIKE",level: "A1", title_en: "would like / I'd like (ordering)",       title_ar: "الطلب بالتأدب would like",                blurb: "Polite requests in cafés and shops." },
  { code: "A1-LIKE",      level: "A1", title_en: "like / love / hate + noun or -ing",      title_ar: "أفعال الإعجاب like و love",               blurb: "Talking about preferences." },
  { code: "A1-FREQ-ADV",  level: "A1", title_en: "Adverbs of frequency (always, usually…)", title_ar: "ظروف التكرار",                           blurb: "How often; position before the main verb." },
  { code: "A1-CARDINAL",  level: "A1", title_en: "Cardinal numbers (one → 100)",           title_ar: "الأعداد الأصلية",                         blurb: "Counting and phone numbers." },
  { code: "A1-ORDINAL",   level: "A1", title_en: "Ordinal numbers (first, second…)",       title_ar: "الأعداد الترتيبية",                       blurb: "Order, dates and floors." },
  { code: "A1-DATES",     level: "A1", title_en: "Days, months & dates",                   title_ar: "الأيام والشهور والتواريخ",                blurb: "Writing and saying the date." },
  { code: "A1-TIME",      level: "A1", title_en: "Telling the time (o'clock, half past…)", title_ar: "قراءة الساعة",                            blurb: "Clock times and asking the time." },
  { code: "A1-GREET",     level: "A1", title_en: "Greetings & survival formulas",          title_ar: "التحيات وعبارات البقاء",                  blurb: "Hello/goodbye, thanks, sorry, please." },
  { code: "A1-CONJ-BASIC",level: "A1", title_en: "and / but / or",                         title_ar: "أدوات العطف and و but و or",              blurb: "Joining words and short clauses." },

  // ══ A2 ══
  { code: "A2-PAST-REG",  level: "A2", title_en: "Past simple: regular verbs (-ed)",       title_ar: "الماضي البسيط: الأفعال المنتظمة",          blurb: "Spelling and pronunciation of -ed." },
  { code: "A2-PAST-IRR",  level: "A2", title_en: "Past simple: irregular verbs",           title_ar: "الماضي البسيط: الأفعال الشاذة",            blurb: "go→went, buy→bought…" },
  { code: "A2-PAST-NEGQ", level: "A2", title_en: "Past simple: negatives & questions",     title_ar: "الماضي البسيط: النفي والاستفهام",          blurb: "didn't / Did…? forms." },
  { code: "A2-PASTCONT",  level: "A2", title_en: "Past continuous (was/were + -ing)",      title_ar: "الماضي المستمر",                          blurb: "Actions in progress in the past." },
  { code: "A2-WHENWHILE", level: "A2", title_en: "when / while + past continuous",         title_ar: "when و while مع الماضي المستمر",          blurb: "Interrupted actions." },
  { code: "A2-PRESCONT",  level: "A2", title_en: "Present continuous (am/is/are + -ing)",  title_ar: "المضارع المستمر",                         blurb: "Now / around now actions." },
  { code: "A2-CONT-VS-SIMP", level: "A2", title_en: "Present continuous vs present simple", title_ar: "المقارنة بين المضارع المستمر والبسيط",  blurb: "Right now vs habits." },
  { code: "A2-GOINGTO",   level: "A2", title_en: "Future with going to",                   title_ar: "المستقبل بـ going to",                    blurb: "Plans and intentions." },
  { code: "A2-WILL",      level: "A2", title_en: "Future with will",                       title_ar: "المستقبل بـ will",                        blurb: "Predictions and instant decisions." },
  { code: "A2-COMP",      level: "A2", title_en: "Comparatives (-er than / more … than)",  title_ar: "صيغة المقارنة",                           blurb: "Comparing two things." },
  { code: "A2-SUP",       level: "A2", title_en: "Superlatives (the -est / the most …)",   title_ar: "صيغة التفضيل",                            blurb: "Comparing three or more." },
  { code: "A2-ASAS",      level: "A2", title_en: "as … as (equality)",                     title_ar: "التساوي بـ as…as",                        blurb: "not as … as; as … as." },
  { code: "A2-ADV-MANNER",level: "A2", title_en: "Adverbs of manner (-ly)",                title_ar: "ظروف الحال",                              blurb: "slowly, carefully; adverb vs adjective." },
  { code: "A2-ADV-FREQ",  level: "A2", title_en: "Frequency expressions (once a week…)",   title_ar: "عبارات التكرار",                          blurb: "How often exactly." },
  { code: "A2-OBJPRON",   level: "A2", title_en: "Object & reflexive pronouns",            title_ar: "ضمائر المفعول والانعكاس",                 blurb: "me/him/… and myself/himself/…" },
  { code: "A2-TOO-ENOUGH",level: "A2", title_en: "too + adj / adj + enough",               title_ar: "التكافؤ بـ too و enough",                 blurb: "too heavy / not big enough." },
  { code: "A2-MUCHMANY",  level: "A2", title_en: "much / many / a lot of",                 title_ar: "كميات much و many",                       blurb: "Countable vs uncountable quantities." },
  { code: "A2-QUANT",     level: "A2", title_en: "Quantifiers (a few / a little / plenty)", title_ar: "أسماء الكمية",                           blurb: "Small/large quantities." },
  { code: "A2-MUST",      level: "A2", title_en: "must / have to (obligation)",            title_ar: "الإلزام must و have to",                  blurb: "Rules and necessities." },
  { code: "A2-MUSTNT",    level: "A2", title_en: "mustn't vs don't have to",               title_ar: "الفرق بين mustn't و don't have to",        blurb: "Prohibition vs no obligation." },
  { code: "A2-SHOULD",    level: "A2", title_en: "should / shouldn't (advice)",            title_ar: "النصيحة should",                          blurb: "Giving advice." },
  { code: "A2-CAN-PERM",  level: "A2", title_en: "can / could (permission & requests)",    title_ar: "الإذن والطلب بـ can و could",             blurb: "Can I…? Could you…?" },
  { code: "A2-COULD",     level: "A2", title_en: "could for past ability",                 title_ar: "القدرة في الماضي could",                  blurb: "was able to in the past." },
  { code: "A2-IMP-NEG",   level: "A2", title_en: "Negative imperatives (Don't…)",          title_ar: "الأمر المنفي",                            blurb: "Prohibitions and warnings." },
  { code: "A2-TAGQ",      level: "A2", title_en: "Question tags (…isn't it?)",             title_ar: "الأسئلة الذيلية",                         blurb: "Checking information." },
  { code: "A2-GER-SUBJ",  level: "A2", title_en: "Gerunds as subjects (Swimming is fun)",  title_ar: "المصدر كفاعل",                            blurb: "-ing form as a noun." },
  { code: "A2-LIKE-ING",  level: "A2", title_en: "like / love / hate + -ing",              title_ar: "أفعال الإعجاب مع المصدر",                 blurb: "Verb + gerund patterns." },
  { code: "A2-INF-PURPOSE",level: "A2", title_en: "Infinitive of purpose (to buy…)",       title_ar: "المصدر للغرض",                            blurb: "Why we do things." },
  { code: "A2-NEED-WANT", level: "A2", title_en: "want / need + infinitive",               title_ar: "want و need مع المصدر",                   blurb: "Wants and necessities." },
  { code: "A2-PREP-MOVE", level: "A2", title_en: "Prepositions of movement (into, across…)", title_ar: "حروف الجر الحركية",                     blurb: "Directions and movement." },
  { code: "A2-PAST-TIME", level: "A2", title_en: "Past time expressions (yesterday, ago, last)", title_ar: "مظاهر الزمن الماضي",               blurb: "Saying when things happened." },
  { code: "A2-FUT-TIME",  level: "A2", title_en: "Future time expressions (next week, soon)", title_ar: "مظاهر الزمن المستقبلي",                blurb: "Saying when things will happen." },
  { code: "A2-PHRASAL",   level: "A2", title_en: "Common phrasal verbs (get up, turn on…)", title_ar: "الأفعال المركبة الشائعة",                blurb: "Everyday two-word verbs." },
  { code: "A2-REL-BASIC", level: "A2", title_en: "who / which / that (basic relatives)",   title_ar: "أدوات الوصل الأساسية",                    blurb: "Joining simple ideas." },
  { code: "A2-CONN",      level: "A2", title_en: "so / because / when connectors",         title_ar: "أدوات الربط so و because",                blurb: "Reason and result links." },
  { code: "A2-INDEF",     level: "A2", title_en: "something / anything / nothing",         title_ar: "المشتقات غير المحددة",                    blurb: "Indefinite compound words." },
  { code: "A2-BOTH",      level: "A2", title_en: "both / all / none / half",               title_ar: "أدوات الكل والجزء",                       blurb: "Whole and part quantities." },
  { code: "A2-EACH",      level: "A2", title_en: "each / every",                           title_ar: "each و every",                            blurb: "Single items in a group." },

  // ══ B1 ══
  { code: "B1-PRES-PERF", level: "B1", title_en: "Present perfect simple",                 title_ar: "المضارع التام",                           blurb: "have/has + participle; experience & results." },
  { code: "B1-PERF-FORSINCE", level: "B1", title_en: "for / since with present perfect",   title_ar: "for و since مع المضارع التام",            blurb: "Durations and starting points." },
  { code: "B1-PERF-VS-PAST", level: "B1", title_en: "Present perfect vs past simple",     title_ar: "المقارنة بين المضارع التام والماضي البسيط", blurb: "Finished time vs up-to-now." },
  { code: "B1-ALREADY",   level: "B1", title_en: "already / just / yet / still",           title_ar: "ظروف الإتمام already و yet",              blurb: "Timing with the perfect." },
  { code: "B1-EVERNEVER", level: "B1", title_en: "ever / never (experience)",              title_ar: "التجربة بـ ever و never",                 blurb: "Have you ever…?" },
  { code: "B1-PERF-CONT", level: "B1", title_en: "Present perfect continuous",             title_ar: "المضارع التام المستمر",                   blurb: "have been + -ing; duration up to now." },
  { code: "B1-PASTCONT-VS", level: "B1", title_en: "Past continuous vs past simple",      title_ar: "المقارنة بين الماضي المستمر والبسيط",      blurb: "Background vs events." },
  { code: "B1-PASTPERF",  level: "B1", title_en: "Past perfect (had + participle)",        title_ar: "الماضي التام",                            blurb: "Earlier past; before/after links." },
  { code: "B1-USEDTO",    level: "B1", title_en: "used to / would (past habits)",          title_ar: "عادات الماضي used to",                    blurb: "Past states and repeated actions." },
  { code: "B1-BEUSEDTO",  level: "B1", title_en: "be used to / get used to + -ing",        title_ar: "الاعتياد بـ be used to",                  blurb: "Familiarity vs past habits." },
  { code: "B1-FUT-CONT",  level: "B1", title_en: "Future continuous (will be + -ing)",     title_ar: "المستقبل المستمر",                        blurb: "In progress at a future time." },
  { code: "B1-COND-0",    level: "B1", title_en: "Zero conditional (general truths)",      title_ar: "الشرط من النوع صفر",                      blurb: "If + present, present." },
  { code: "B1-COND-1",    level: "B1", title_en: "First conditional",                      title_ar: "الشرط من النوع الأول",                    blurb: "If + present, will." },
  { code: "B1-COND-2",    level: "B1", title_en: "Second conditional",                     title_ar: "الشرط من النوع الثاني",                   blurb: "If + past, would." },
  { code: "B1-UNLESS",    level: "B1", title_en: "unless / in case / as long as",          title_ar: "أدوات الشرط unless و in case",            blurb: "Conditional connectors." },
  { code: "B1-DEDUCT",    level: "B1", title_en: "Modals of deduction (must / might / can't)", title_ar: "أفعال الاستنتاج",                     blurb: "Guessing with evidence." },
  { code: "B1-PASS-PRES", level: "B1", title_en: "Passive voice: present & past",          title_ar: "المبني للمجهول",                          blurb: "be + participle; by-phrases." },
  { code: "B1-PASS-PAST", level: "B1", title_en: "Passive: past simple & continuous",      title_ar: "المجهول في الماضي",                       blurb: "was/were + participle." },
  { code: "B1-CAUSATIVE", level: "B1", title_en: "Causative have / get (have it done)",    title_ar: "التسبيب have / get",                      blurb: "Services done for you." },
  { code: "B1-REL-DEF",   level: "B1", title_en: "Defining relative clauses",              title_ar: "جمل الوصل التعريفية",                     blurb: "who/which/that/where; omitting that." },
  { code: "B1-REL-NONDEF",level: "B1", title_en: "Non-defining relative clauses",          title_ar: "جمل الوصل غير التعريفية",                 blurb: "Comma + which/who; extra information." },
  { code: "B1-REP-STAT",  level: "B1", title_en: "Reported speech: statements",            title_ar: "الكلام المنقول: الإخبار",                 blurb: "say/tell; tense backshift." },
  { code: "B1-REP-QUEST", level: "B1", title_en: "Reported speech: questions & commands",  title_ar: "الكلام المنقول: الأسئلة والأوامر",        blurb: "asked if / told to." },
  { code: "B1-VERB-PATT", level: "B1", title_en: "Verb patterns (-ing vs to-infinitive)",  title_ar: "أنماط الأفعال مع المصدر والمصدر المتحول", blurb: "stop/try/remember/forget differences." },
  { code: "B1-MAKE-LET",  level: "B1", title_en: "make / let / allow",                     title_ar: "أفعال الإجبار والسماح",                   blurb: "make sb do / let sb do / allow sb to do." },
  { code: "B1-HADBETTER", level: "B1", title_en: "had better / it's time",                 title_ar: "had better للتوصية",                      blurb: "Strong advice forms." },
  { code: "B1-WISH",      level: "B1", title_en: "wish / if only + past",                  title_ar: "التمني بـ wish",                          blurb: "Regrets about the present." },
  { code: "B1-COND3-INTRO",level: "B1", title_en: "Third conditional (introduction)",      title_ar: "مقدمة الشرط الثالث",                      blurb: "If + had + participle, would have." },
  { code: "B1-ALTHOUGH",  level: "B1", title_en: "although / though / despite",            title_ar: "أدوات التناقض",                           blurb: "Contrast links; despite/in spite of + noun." },
  { code: "B1-HOWEVER",   level: "B1", title_en: "however / therefore / nevertheless",     title_ar: "روابط أسلوبية",                           blurb: "Formal connectors of contrast & result." },
  { code: "B1-SOSUCH",    level: "B1", title_en: "so / such (intensity)",                  title_ar: "التوكيد بـ so و such",                    blurb: "so good / such a good idea." },
  { code: "B1-THEMORE",   level: "B1", title_en: "Double comparatives (the more… the more)", title_ar: "صيغ المقارنة المزدوجة",                 blurb: "Parallel increase." },
  { code: "B1-ART-ADV",   level: "B1", title_en: "Articles: the & zero article (advanced)", title_ar: "أدوات التعريف المتقدمة",                 blurb: "General vs specific reference." },
  { code: "B1-QUANT-ADV", level: "B1", title_en: "Quantifiers: little / few / several",    title_ar: "الكميات المتقدمة",                        blurb: "Negative quantities; countability." },
  { code: "B1-MODAL-PERF",level: "B1", title_en: "Modal + have (must have / might have)",  title_ar: "أفعال النقص مع الماضي",                   blurb: "Deductions about the past." },
  { code: "B1-BEABLE",    level: "B1", title_en: "be able to / manage to / succeed in",    title_ar: "تعبيرات القدرة المتقدمة",                 blurb: "Ability beyond can." },
  { code: "B1-NEEDNT",    level: "B1", title_en: "needn't have / didn't need to",          title_ar: "عدم الضرورة في الماضي",                   blurb: "Unnecessary past actions." },
  { code: "B1-TAGQ-ADV",  level: "B1", title_en: "Question tags & echo questions",         title_ar: "أسئلة التأكيد",                           blurb: "Advanced tag rules." },
  { code: "B1-PARTICIPLE",level: "B1", title_en: "Participle clauses (-ing / -ed clauses)", title_ar: "الجمل المبتورة بالـ -ing و -ed",          blurb: "Feeling tired, I went to bed." },
  { code: "B1-SUBST",     level: "B1", title_en: "Substitution (one / ones / do)",         title_ar: "الإحالة والبدل",                          blurb: "Avoiding repetition." },

  // ══ B2 ══
  { code: "B2-COND-3",    level: "B2", title_en: "Third conditional",                      title_ar: "الشرط من النوع الثالث",                   blurb: "Unreal past: if + had, would have." },
  { code: "B2-COND-MIXED",level: "B2", title_en: "Mixed conditionals",                     title_ar: "الشروط المختلطة",                         blurb: "Past condition → present result and vice versa." },
  { code: "B2-WISH-WOULD",level: "B2", title_en: "wish / if only + would",                 title_ar: "wish مع would",                           blurb: "Annoyance and desired change." },
  { code: "B2-PASTPERF-CONT", level: "B2", title_en: "Past perfect continuous",            title_ar: "الماضي التام المستمر",                    blurb: "had been + -ing duration." },
  { code: "B2-FUT-PERF",  level: "B2", title_en: "Future perfect & future perfect continuous", title_ar: "المستقبل التام",                      blurb: "will have done by a time." },
  { code: "B2-FUT-PAST",  level: "B2", title_en: "Future in the past (was going to / would)", title_ar: "المستقبل في الماضي",                   blurb: "Plans that changed." },
  { code: "B2-PASS-MODAL",level: "B2", title_en: "Passive with modals (must be done)",     title_ar: "المجهول مع أفعال النقص",                  blurb: "Modal + be + participle." },
  { code: "B2-PASS-REPORT",level: "B2", title_en: "Passive of reporting verbs",           title_ar: "المجهول لأفعال النقل",                    blurb: "It is said that… / He is believed to…" },
  { code: "B2-PASS-IMPERSONAL", level: "B2", title_en: "Impersonal passives",              title_ar: "المجهول غير الشخصي",                      blurb: "Distance and formality." },
  { code: "B2-GET-PASSIVE",level: "B2", title_en: "get-passive & need + -ing",            title_ar: "المجهول بـ get و need + ing",              blurb: "Informal passives; need doing." },
  { code: "B2-ART-ADV2",  level: "B2", title_en: "Articles & determiners: advanced",       title_ar: "أدوات التعريف المتقدمة ٢",                blurb: "Idiomatic article uses." },
  { code: "B2-SUCH-SO2",  level: "B2", title_en: "such / so / quite / rather",             title_ar: "أدوات التوكيد والتخفيف",                  blurb: "Grading adjectives and nouns." },
  { code: "B2-QUANT-OF",  level: "B2", title_en: "Quantifiers with of (most of, none of)", title_ar: "الكميات مع of",                           blurb: "Partitive structures." },
  { code: "B2-SV-AGREE",  level: "B2", title_en: "Subject–verb agreement (complex)",       title_ar: "التطابق بين الفعل والفاعل",               blurb: "Tricky subjects; collective nouns." },
  { code: "B2-REL-WHOM",  level: "B2", title_en: "whom / of which / whose (formal)",       title_ar: "أدوات الوصل الرسمية",                     blurb: "Formal relatives." },
  { code: "B2-REL-REDUCED",level: "B2", title_en: "Reduced relative clauses",             title_ar: "اختصار جمل الوصل",                        blurb: "The man (who is) standing…" },
  { code: "B2-PART-CLAUSE",level: "B2", title_en: "Participle clauses (present/past/perfect)", title_ar: "الجمل المبتورة المتقدمة",              blurb: "Having finished, …" },
  { code: "B2-INVERSION", level: "B2", title_en: "Inversion after negative adverbials",    title_ar: "القلب بعد الظروف المنفية",                blurb: "Never have I… / Not only…" },
  { code: "B2-COND-INVERT",level: "B2", title_en: "Inverted conditionals (Had I known…)", title_ar: "قلب الشروط",                              blurb: "Formal conditional forms." },
  { code: "B2-EMPH-DO",   level: "B2", title_en: "Emphasis with do / did / indeed",        title_ar: "التوكيد بـ do و did",                     blurb: "Stress and emphasis forms." },
  { code: "B2-CLEFT",     level: "B2", title_en: "Cleft sentences (It was … that …)",      title_ar: "جمل التوكيد",                             blurb: "Focusing information." },
  { code: "B2-FRONTING",  level: "B2", title_en: "Fronting & information structure",       title_ar: "تقديم العناصر",                           blurb: "Rearranging for emphasis." },
  { code: "B2-REP-ADV",   level: "B2", title_en: "Advanced reporting verbs",               title_ar: "أفعال النقل المتقدمة",                    blurb: "suggest + -ing; insist on; accuse of." },
  { code: "B2-REP-MIXED", level: "B2", title_en: "Reported speech: mixed & free",          title_ar: "النقل المختلط والحر",                     blurb: "Complex backshift cases." },
  { code: "B2-GER-SUBJ",  level: "B2", title_en: "Gerund clauses & perfect gerunds",       title_ar: "المصدر المتحول المتقدم",                  blurb: "having done; being done." },
  { code: "B2-INF-ADV",   level: "B2", title_en: "Advanced infinitives (to have done)",    title_ar: "المصدر التام",                            blurb: "Perfect & continuous infinitives." },
  { code: "B2-ADJ-ORDER", level: "B2", title_en: "Adjective order & compound adjectives",  title_ar: "ترتيب الصفات",                            blurb: "a big old red car; well-known." },
  { code: "B2-COLLOC",    level: "B2", title_en: "Verb collocations (make/do/take/get)",   title_ar: "التجميعات اللفظية",                       blurb: "Natural word partnerships." },
  { code: "B2-DEP-PREP",  level: "B2", title_en: "Dependent prepositions (about, for, from)", title_ar: "حروف الجر التابعة",                    blurb: "depend on; apologize for; suffer from." },
  { code: "B2-ADJ-PREP",  level: "B2", title_en: "Adjectives + prepositions",              title_ar: "الصفات مع حروف الجر",                     blurb: "afraid of; keen on; good at." },
  { code: "B2-PHRASAL-ADV",level: "B2", title_en: "Phrasal verbs: advanced & separable",  title_ar: "الأفعال المركبة المتقدمة",                blurb: "Separable/inseparable; idiomatic uses." },
  { code: "B2-DISCOURSE", level: "B2", title_en: "Discourse markers (formal)",             title_ar: "إشارات الخطاب الرسمية",                   blurb: "furthermore / nonetheless / in contrast." },
  { code: "B2-HEDGE",     level: "B2", title_en: "Hedging & vague language",               title_ar: "لغة التلطيف والتحوط",                     blurb: "seem, appear, tend to, sort of." },
  { code: "B2-CONN-ADV",  level: "B2", title_en: "Connectors: contrast, reason, result",   title_ar: "الروابط المتقدمة",                        blurb: "whereas / owing to / consequently." },
  { code: "B2-NOMINAL",   level: "B2", title_en: "Nominalization (introduction)",          title_ar: "التحويل إلى اسم",                         blurb: "decide → decision; fail → failure." },
  { code: "B2-ELLIPSIS",  level: "B2", title_en: "Ellipsis & substitution",                title_ar: "الحذف والبدل",                            blurb: "Leaving out repeated words." },
  { code: "B2-REFER",     level: "B2", title_en: "Referring words (the former, this, one)", title_ar: "أدوات الإحالة",                          blurb: "Text cohesion." },
  { code: "B2-SUBJUNCT-WERE", level: "B2", title_en: "were-subjunctive (If I were…)",      title_ar: "صيغة الشرطية were",                       blurb: "Formal/unreal were." },

  // ══ C1 ══
  { code: "C1-INVERSION-ADV", level: "C1", title_en: "Advanced inversion patterns",        title_ar: "القلب المتقدم",                           blurb: "So strange was…; Little did they know…" },
  { code: "C1-SUBJ-MAND", level: "C1", title_en: "Mandative subjunctive (demand that he be)", title_ar: "الشرطية الأمرية",                      blurb: "insist/suggest + base form." },
  { code: "C1-SUBJ-FORM", level: "C1", title_en: "Formulaic subjunctive",                  title_ar: "الشرطية الاصطلاحية",                      blurb: "be that as it may; come what may." },
  { code: "C1-COND-ADV",  level: "C1", title_en: "Advanced conditionals & inversion",      title_ar: "الشروط المتقدمة",                         blurb: "Were I to…; Should you need…" },
  { code: "C1-CLEFT-ADV", level: "C1", title_en: "Advanced clefts (What I need is…)",      title_ar: "جمل التوكيد المتقدمة",                    blurb: "all/what/why-clefts." },
  { code: "C1-NOMINAL-ADV",level: "C1", title_en: "Nominalization (advanced)",            title_ar: "التحويل إلى اسم المتقدم",                 blurb: "Dense academic style." },
  { code: "C1-ABS-CLAUSE",level: "C1", title_en: "Absolute clauses",                       title_ar: "الجمل المستقلة",                          blurb: "Weather permitting; all things considered." },
  { code: "C1-PASS-ADV",  level: "C1", title_en: "Advanced passive forms",                 title_ar: "المجهول المتقدم",                         blurb: "Progressive & perfect passives." },
  { code: "C1-PASS-GERINF",level: "C1", title_en: "Passive gerunds & infinitives",        title_ar: "مصادر المبني للمجهول",                    blurb: "being done; to be done." },
  { code: "C1-REP-NOUN",  level: "C1", title_en: "Reporting with noun clauses",            title_ar: "النقل بجمل الاسمية",                      blurb: "the fact that; the question of whether." },
  { code: "C1-HEDGE-ADV", level: "C1", title_en: "Hedging: advanced",                      title_ar: "التلطيف المتقدم",                         blurb: "arguably, to some extent, ostensibly." },
  { code: "C1-CONN-ADV2", level: "C1", title_en: "Complex connectors (albeit, whilst)",    title_ar: "روابط متقدمة",                            blurb: "whereas / whilst / albeit." },
  { code: "C1-ELLIPSIS-ADV", level: "C1", title_en: "Ellipsis & do so substitution",      title_ar: "الحذف والبدل المتقدم",                    blurb: "did so; clause reduction." },
  { code: "C1-ADJ-COMPL", level: "C1", title_en: "Adjective complementation",              title_ar: "متممات الصفات",                           blurb: "loath to admit; intent on." },
  { code: "C1-NOUN-COMPL",level: "C1", title_en: "Noun complementation",                   title_ar: "متممات الأسماء",                          blurb: "the fact that; ability to." },
  { code: "C1-VERB-COMPL",level: "C1", title_en: "Verb complementation (advanced)",        title_ar: "متممات الأفعال المتقدمة",                 blurb: "accuse sb of doing; congratulate on." },
  { code: "C1-COLLOC-ADV",level: "C1", title_en: "Advanced collocations & idiom pairs",    title_ar: "التجميعات المتقدمة",                      blurb: "utterly ridiculous; safe and sound." },
  { code: "C1-REGISTER",  level: "C1", title_en: "Register & style shifts",                title_ar: "مستويات الأسلوب",                         blurb: "Formal vs informal choices." },
  { code: "C1-QUANT-EXPR",level: "C1", title_en: "Complex quantity expressions",           title_ar: "عبارات الكمية المعقدة",                   blurb: "a good deal of; a substantial number." },
  { code: "C1-REL-SENT",  level: "C1", title_en: "Sentential relatives & apposition",      title_ar: "الوصل الجملية والبدل",                    blurb: ", which surprised everyone; my friend Ali." },
  { code: "C1-NOMREL",    level: "C1", title_en: "Nominal relative clauses (what / whoever)", title_ar: "جمل الوصل الاسمية",                    blurb: "What matters is…" },
  { code: "C1-FUT-PAST2", level: "C1", title_en: "Future in the past (advanced)",          title_ar: "المستقبل في الماضي المتقدم",              blurb: "was to do / would soon." },
  { code: "C1-MODAL-NUANCE",level: "C1", title_en: "Modal nuances (should have / need have)", title_ar: "دلالات أفعال النقص",                    blurb: "Criticism and speculation." },
  { code: "C1-COMPLEX-PREP",level: "C1", title_en: "Complex prepositions",                title_ar: "حروف الجر المركبة",                       blurb: "with regard to; in spite of the fact that." },
];

// ── 2. Category name → thematic group ──────────────────────────────────────
// Every one of the 208 LanGeek category names maps to a group key.
export const CATEGORY_GROUPS = {
  // greetings & personal info
  "Hello and Goodbye": "greetings",
  "Personal Information": "personal-info",
  "Countries and Nationalities": "personal-info",
  "Directions and Continents": "personal-info",
  "Languages and Nationalities": "personal-info",
  "Languages and Grammar": "language",
  "Language Components": "language",
  "Grammar": "language",
  // people & family
  "Family": "people-family",
  "People": "people-family",
  "Describing People": "people-family",
  "Family and Friends": "people-family",
  "Family and Relationships": "people-family",
  "People and Stages of Life": "people-family",
  "People and Society": "people-family",
  "Identity and Society": "people-family",
  "Bonds and Relationships": "people-family",
  "Romance": "people-family",
  "Love and Romance": "people-family",
  "Wedding Ceremony": "people-family",
  "Special Occasions": "people-family",
  "Religion and Festivals": "people-family",
  // appearance & personality
  "Appearance": "appearance",
  "Personality and Behavior": "appearance",
  "Personality": "appearance",
  "Personal Characteristics": "appearance",
  "Human Characteristics": "appearance",
  "Personal Traits": "appearance",
  "Human Attributes": "appearance",
  "Character and Traits": "appearance",
  // body & health
  "The Body": "body-health",
  "The Head and Face": "body-health",
  "The Human Body": "body-health",
  "The Human Anatomy": "body-health",
  "Body Actions": "body-health",
  "Health and Sickness": "body-health",
  "Injuries and Sickness": "body-health",
  "Sickness": "body-health",
  "Self-care Products": "body-health",
  // home
  "House and Apartment": "home",
  "Household Items": "home",
  "Furniture and Home Appliances": "home",
  "Home": "home",
  "Home Appliances and Devices": "home",
  "Furniture and Household Items": "home",
  "Home Appliances and Furniture": "home",
  "Housing & Home": "home",
  "Houses and Buildings": "home",
  "Buildings and Construction": "home",
  "City Structures": "home",
  // food & drink
  "Food and Ingredients": "food",
  "Food and Drinks": "food",
  "Food": "food",
  "Restaurants and Food": "food",
  "Food and Diet": "food",
  "Foods": "food",
  "Foods and Ingredients": "food",
  "Dishes and Dining": "food",
  "Cooking": "food",
  "Meat and Dairy": "food",
  "Fruits and Nuts": "food",
  "Flowers, Fruits, and Nuts": "food",
  "Drinks": "food",
  // time & numbers & measurement
  "Time and Date": "time-numbers",
  "Months and Seasons": "time-numbers",
  "Time": "time-numbers",
  "Numbers 0 to 100": "time-numbers",
  "Measurement": "time-numbers",
  "Quantities and Containers": "time-numbers",
  "Quantity": "time-numbers",
  "Mathematics": "time-numbers",
  // clothes & fashion
  "Clothes and Shoes": "clothes",
  "Clothes and Accessories": "clothes",
  "Clothes and Fashion": "clothes",
  "Fashion": "clothes",
  "Fashion and Attire": "clothes",
  // money & shopping
  "Money and Shopping": "money-shopping",
  "Money": "money-shopping",
  "Shopping": "money-shopping",
  // city & travel
  "City": "city-travel",
  "City and the Countryside": "city-travel",
  "Transportation": "city-travel",
  "Travelling": "city-travel",
  "Travel and Vacation": "city-travel",
  "Travel": "city-travel",
  "Tourism": "city-travel",
  "Outer Space": "nature-world",
  // school & work
  "School": "school-work",
  "School and Education": "school-work",
  "Education": "school-work",
  "Jobs": "school-work",
  "Jobs and Work": "school-work",
  "Employment and Occupations": "school-work",
  "Occupations": "school-work",
  "Jobs and Professions": "school-work",
  "Working Life": "school-work",
  "Business and Workplace": "school-work",
  "Business and Office": "school-work",
  "Business and Management": "school-work",
  "Stationery and Office Supplies": "school-work",
  "Fields of Study": "school-work",
  // leisure & sports
  "Free Time Activities": "leisure-sports",
  "Hobbies and Daily Activities": "leisure-sports",
  "Sports": "leisure-sports",
  "Sports and Players": "leisure-sports",
  "Hobbies": "leisure-sports",
  "Hobbies and Activities": "leisure-sports",
  "Games and Toys": "leisure-sports",
  "Exercise and Matches": "leisure-sports",
  "Working Out": "leisure-sports",
  // entertainment & art & media
  "Cinema and Theater": "entertainment",
  "Music and Literature": "entertainment",
  "Movie and Theater": "entertainment",
  "The Cinema": "entertainment",
  "Movies": "entertainment",
  "Music": "entertainment",
  "Art": "entertainment",
  "Entertainment": "entertainment",
  "Media and Journalism": "entertainment",
  "Media": "entertainment",
  "News and Network": "entertainment",
  "Fairy Tales": "entertainment",
  "Literature": "entertainment",
  "Writing and Narrative": "entertainment",
  // nature & world
  "The Weather and Nature": "nature-world",
  "The Weather": "nature-world",
  "Weather Conditions": "nature-world",
  "Nature and Natural Disasters": "nature-world",
  "Nature": "nature-world",
  "Nature and Regions": "nature-world",
  "The Environment": "nature-world",
  "The Environment and Energy": "nature-world",
  "Animals": "nature-world",
  "The Animal Kingdom": "nature-world",
  "Plants": "nature-world",
  "Farming": "nature-world",
  "Science and the Natural World": "nature-world",
  "World of Science": "nature-world",
  // core verb groups
  "Basic Verbs": "core-verbs",
  "Useful Verbs": "core-verbs",
  "Simple Verbs": "core-verbs",
  "Essential Verbs": "core-verbs",
  "Common Verbs": "core-verbs",
  "Necessary Verbs": "core-verbs",
  "Modal and Other Verbs": "core-verbs",
  "Vital Verbs": "core-verbs",
  "Integral Verbs": "core-verbs",
  "Fundamental Verbs": "core-verbs",
  "Phrasal Verbs": "core-verbs",
  "Basic Phrasal Verbs": "core-verbs",
  // adjectives & descriptive
  "Opposite Adjectives": "descriptive",
  "Necessary Opposite Adjectives": "descriptive",
  "Essential Opposite Adjectives": "descriptive",
  "Adjectives (General)": "descriptive",
  "Adjectives": "descriptive",
  "Colors": "descriptive",
  "Colors and Shapes": "descriptive",
  "Shapes and Colors": "descriptive",
  "Essential Adjectives": "descriptive",
  "Necessary Adjectives": "descriptive",
  // grammar words
  "Prepositions and Determiners": "grammar-words",
  "Adverbs and Pronouns": "grammar-words",
  "Conjunctions and Prepositions": "grammar-words",
  "Adverbs and Prepositions": "grammar-words",
  "Pronouns and Determiners": "grammar-words",
  "Essential Adverbs": "grammar-words",
  "General Adverbs": "grammar-words",
  "Common Adverbs": "grammar-words",
  // feelings & mind
  "Emotions": "feelings",
  "Feelings and Emotions": "feelings",
  "Feelings or States of Being": "feelings",
  "Feelings": "feelings",
  "The Mind": "feelings",
  // communication
  "Communication": "communication",
  "Dialogue and Discourse": "communication",
  "Digital Communication": "communication",
  "Assessment and Discourse": "communication",
  "Agreement and Disagreement": "communication",
  "Advice and Suggestion": "communication",
  "Preference": "communication",
  "Certainty and Doubt": "communication",
  "Evaluation and Opinion": "communication",
  "Regulations and Requirements": "communication",
  // abstract ideas
  "Abstract Concepts": "abstract",
  "Change": "abstract",
  "Success and Failure": "abstract",
  "Struggles and Setbacks": "abstract",
  "Determination and Struggles": "abstract",
  "Ambition and Achievement": "abstract",
  "Achievement and Progress": "abstract",
  "Threats and Danger": "abstract",
  // law, politics, history, religion
  "Law and Politics": "society",
  "Law and Order": "society",
  "Crime and Violence": "society",
  "War and Peace": "society",
  "Politics": "society",
  "Monarchy": "society",
  "History and Artifacts": "society",
  "Religion": "society",
  "Social Issues": "society",
  // tech & science
  "Computer and Information": "tech-science",
  "Computer": "tech-science",
  "Computers and Networks": "tech-science",
  "Computer Science": "tech-science",
  "Internet and Websites": "tech-science",
  "Technology": "tech-science",
  "Tools": "tech-science",
  "Science": "tech-science",
  "Scientific Research": "tech-science",
};

// Fallback group for a category that somehow isn't listed.
export function groupFor(category) {
  if (CATEGORY_GROUPS[category]) return CATEGORY_GROUPS[category];
  const c = category.toLowerCase();
  const hints = [
    [/famil|friend|people|person|wedding|romance|love/, "people-family"],
    [/food|drink|meal|fruit|meat|dairy|cook|din|restaur/, "food"],
    [/job|work|school|educat|business|office|employ|career/, "school-work"],
    [/time|date|month|season|number|measur|quant|math/, "time-numbers"],
    [/home|house|apart|furnitur|build/, "home"],
    [/cloth|fashion|shoe|accessor/, "clothes"],
    [/money|shop|price|cost/, "money-shopping"],
    [/travel|tour|city|transport|country/, "city-travel"],
    [/health|body|sick|medic|anatomy/, "body-health"],
    [/animal|nature|weather|plant|environment|space/, "nature-world"],
    [/sport|hobby|game|free time|leisure/, "leisure-sports"],
    [/music|art|movie|cinema|media|film|literat/, "entertainment"],
    [/feel|emotion|mind|mood/, "feelings"],
    [/verb/, "core-verbs"],
    [/adjective|color|shape|appear/, "descriptive"],
    [/adverb|pronoun|preposition|conjunction|determiner|grammar|article/, "grammar-words"],
    [/law|politic|crime|war|religio|societ/, "society"],
    [/comput|tech|science|internet|network/, "tech-science"],
  ];
  for (const [re, g] of hints) if (re.test(c)) return g;
  return "abstract";
}

// ── 3. Thematic rules per group × level (nouns mostly) ─────────────────────
export const GROUP_RULES = {
  "greetings":      { A1: ["A1-GREET", "A1-BE"], A2: ["A1-GREET", "A2-IMP-NEG"] },
  "personal-info":  { A1: ["A1-BE", "A1-QWORDS", "A1-POSS-ADJ"], A2: ["A1-BE", "A2-PAST-REG"] },
  "people-family":  { A1: ["A1-POSS-S", "A1-POSS-ADJ", "A1-HAVEGOT"], A2: ["A2-PAST-REG", "A2-COMP"], B1: ["B1-REL-DEF", "B1-PRES-PERF"], B2: ["B2-REL-WHOM", "B2-NOMINAL"], C1: ["C1-REL-SENT", "C1-NOMINAL-ADV"] },
  "appearance":     { A1: ["A1-BE-ADJ", "A1-DEMO"], A2: ["A2-COMP", "A2-SUP"], B1: ["B1-QUANT-ADV", "B1-REL-DEF"], B2: ["B2-ADJ-ORDER", "B2-ADJ-PREP"], C1: ["C1-ADJ-COMPL", "C1-REGISTER"] },
  "body-health":    { A1: ["A1-BE-ADJ", "A1-POSS-ADJ"], A2: ["A2-MUST", "A2-SHOULD"], B1: ["B1-PASS-PRES", "B1-DEDUCT"], B2: ["B2-PASS-MODAL", "B2-COLLOC"], C1: ["C1-NOMINAL-ADV", "C1-VERB-COMPL"] },
  "home":           { A1: ["A1-THERE", "A1-PREP-PLACE"], A2: ["A2-QUANT", "A2-MUCHMANY"], B1: ["B1-PASS-PRES", "B1-REL-DEF"], B2: ["B2-PASS-REPORT", "B2-NOMINAL"], C1: ["C1-PASS-ADV", "C1-NOMINAL-ADV"] },
  "food":           { A1: ["A1-COUNT", "A1-SOMEANY", "A1-WOULD-LIKE"], A2: ["A2-MUCHMANY", "A2-QUANT"], B1: ["B1-QUANT-ADV", "B1-VERB-PATT"], B2: ["B2-QUANT-OF", "B2-COLLOC"], C1: ["C1-COLLOC-ADV", "C1-NOMINAL-ADV"] },
  "time-numbers":   { A1: ["A1-CARDINAL", "A1-PREP-TIME", "A1-DATES"], A2: ["A2-PAST-TIME", "A2-FUT-TIME"], B1: ["B1-PERF-FORSINCE", "B1-THEMORE"], B2: ["B2-FUT-PERF", "B2-QUANT-OF"], C1: ["C1-QUANT-EXPR", "C1-NOMINAL-ADV"] },
  "clothes":        { A1: ["A1-PLU-REG", "A1-DEMO"], A2: ["A2-COMP", "A2-MUCHMANY"], B1: ["B1-QUANT-ADV", "B1-PASS-PRES"], B2: ["B2-ADJ-ORDER", "B2-COLLOC"], C1: ["C1-REGISTER", "C1-COLLOC-ADV"] },
  "money-shopping": { A1: ["A1-COUNT", "A1-WOULD-LIKE"], A2: ["A2-MUCHMANY", "A2-COMP"], B1: ["B1-COND-1", "B1-QUANT-ADV"], B2: ["B2-PASS-REPORT", "B2-NOMINAL"], C1: ["C1-NOMINAL-ADV", "C1-QUANT-EXPR"] },
  "city-travel":    { A1: ["A1-PREP-PLACE", "A1-IMP"], A2: ["A2-PREP-MOVE", "A2-GOINGTO"], B1: ["B1-COND-2", "B1-REL-DEF"], B2: ["B2-DISCOURSE", "B2-NOMINAL"], C1: ["C1-COMPLEX-PREP", "C1-REGISTER"] },
  "school-work":    { A1: ["A1-PRES-AFF", "A1-IMP"], A2: ["A2-PAST-NEGQ", "A2-MUST"], B1: ["B1-PRES-PERF", "B1-VERB-PATT"], B2: ["B2-NOMINAL", "B2-DISCOURSE"], C1: ["C1-NOMINAL-ADV", "C1-REGISTER"] },
  "leisure-sports": { A1: ["A1-PRES-AFF", "A1-LIKE"], A2: ["A2-LIKE-ING", "A2-PRESCONT"], B1: ["B1-PERF-CONT", "B1-VERB-PATT"], B2: ["B2-COLLOC", "B2-PHRASAL-ADV"], C1: ["C1-COLLOC-ADV", "C1-ELLIPSIS-ADV"] },
  "entertainment":  { A1: ["A1-PRES-AFF", "A1-LIKE"], A2: ["A2-LIKE-ING", "A2-PAST-REG"], B1: ["B1-REL-NONDEF", "B1-PASTPERF"], B2: ["B2-CLEFT", "B2-NOMINAL"], C1: ["C1-CLEFT-ADV", "C1-REGISTER"] },
  "nature-world":   { A1: ["A1-THERE", "A1-BE-ADJ"], A2: ["A2-CONT-VS-SIMP", "A2-PRESCONT"], B1: ["B1-PASS-PRES", "B1-COND-0"], B2: ["B2-PASS-REPORT", "B2-HEDGE"], C1: ["C1-HEDGE-ADV", "C1-PASS-ADV"] },
  "core-verbs":     { A1: ["A1-PRES-AFF", "A1-PRES-NEG", "A1-CAN"], A2: ["A2-PAST-IRR", "A2-PAST-NEGQ", "A2-GOINGTO"], B1: ["B1-PRES-PERF", "B1-VERB-PATT", "B1-PASTPERF"], B2: ["B2-REP-ADV", "B2-PART-CLAUSE", "B2-DEP-PREP"], C1: ["C1-VERB-COMPL", "C1-SUBJ-MAND", "C1-NOMINAL-ADV"] },
  "descriptive":    { A1: ["A1-BE-ADJ", "A1-PLU-REG"], A2: ["A2-COMP", "A2-SUP", "A2-ASAS"], B1: ["B1-SOSUCH", "B1-THEMORE"], B2: ["B2-ADJ-ORDER", "B2-SUCH-SO2"], C1: ["C1-ADJ-COMPL", "C1-REGISTER"] },
  "grammar-words":  { A1: ["A1-QWORDS", "A1-CONJ-BASIC", "A1-FREQ-ADV"], A2: ["A2-CONN", "A2-ADV-MANNER", "A2-INDEF"], B1: ["B1-HOWEVER", "B1-ALTHOUGH", "B1-SUBST"], B2: ["B2-CONN-ADV", "B2-DISCOURSE", "B2-ELLIPSIS"], C1: ["C1-CONN-ADV2", "C1-ELLIPSIS-ADV", "C1-REGISTER"] },
  "feelings":       { A1: ["A1-BE-ADJ", "A1-LIKE"], A2: ["A2-SHOULD", "A2-COMP"], B1: ["B1-WISH", "B1-DEDUCT"], B2: ["B2-WISH-WOULD", "B2-ADJ-PREP"], C1: ["C1-ADJ-COMPL", "C1-HEDGE-ADV"] },
  "communication":  { A1: ["A1-QWORDS", "A1-GREET"], A2: ["A2-CONN", "A2-TAGQ"], B1: ["B1-REP-STAT", "B1-REP-QUEST"], B2: ["B2-REP-ADV", "B2-HEDGE"], C1: ["C1-REP-NOUN", "C1-HEDGE-ADV"] },
  "abstract":       { A2: ["A2-CONN", "A2-NEED-WANT"], B1: ["B1-COND-2", "B1-HOWEVER"], B2: ["B2-NOMINAL", "B2-CONN-ADV"], C1: ["C1-NOMINAL-ADV", "C1-REGISTER"] },
  "society":        { A2: ["A2-MUST", "A2-PAST-REG"], B1: ["B1-PASS-PAST", "B1-REP-STAT"], B2: ["B2-PASS-REPORT", "B2-NOMINAL"], C1: ["C1-PASS-ADV", "C1-REGISTER"] },
  "tech-science":   { A1: ["A1-THERE", "A1-PRES-AFF"], A2: ["A2-CONT-VS-SIMP", "A2-QUANT"], B1: ["B1-PASS-PRES", "B1-PERF-VS-PAST"], B2: ["B2-PASS-MODAL", "B2-NOMINAL"], C1: ["C1-PASS-ADV", "C1-NOMINAL-ADV"] },
  "language":       { A1: ["A1-QWORDS", "A1-CONJ-BASIC"], A2: ["A2-REL-BASIC", "A2-CONN"], B1: ["B1-REL-DEF", "B1-VERB-PATT"], B2: ["B2-REL-WHOM", "B2-ELLIPSIS"], C1: ["C1-REL-SENT", "C1-NOMREL"] },
};

// ── 4. POS-family rules per level (fallback / overlay) ─────────────────────
// pos families: n, v, adj, adv, prep, pron, num, conj, det, intj, phr
export const POS_RULES = {
  A1:  { n: ["A1-ART", "A1-PLU-REG", "A1-COUNT"], v: ["A1-PRES-AFF", "A1-PRES-NEG", "A1-CAN"], adj: ["A1-BE-ADJ", "A1-ART"], adv: ["A1-FREQ-ADV"], prep: ["A1-PREP-PLACE"], pron: ["A1-OBJPRON"], num: ["A1-CARDINAL"], conj: ["A1-CONJ-BASIC"], det: ["A1-DEMO"], intj: ["A1-GREET"], phr: ["A1-GREET"] },
  A2:  { n: ["A2-MUCHMANY", "A2-QUANT"], v: ["A2-PAST-NEGQ", "A2-PRESCONT", "A2-CONT-VS-SIMP"], adj: ["A2-COMP", "A2-SUP"], adv: ["A2-ADV-MANNER"], prep: ["A2-PREP-MOVE"], pron: ["A2-OBJPRON"], num: ["A2-MUCHMANY"], conj: ["A2-CONN"], det: ["A2-QUANT"], intj: ["A1-GREET"], phr: ["A2-PHRASAL"] },
  B1:  { n: ["B1-REL-DEF", "B1-QUANT-ADV"], v: ["B1-PRES-PERF", "B1-VERB-PATT"], adj: ["B1-SOSUCH", "B1-THEMORE"], adv: ["B1-HOWEVER"], prep: ["B1-ART-ADV"], pron: ["B1-SUBST"], num: ["B1-QUANT-ADV"], conj: ["B1-ALTHOUGH"], det: ["B1-QUANT-ADV"], intj: ["B1-TAGQ-ADV"], phr: ["B1-VERB-PATT"] },
  B2:  { n: ["B2-NOMINAL", "B2-COLLOC"], v: ["B2-REP-ADV", "B2-DEP-PREP", "B2-PART-CLAUSE"], adj: ["B2-ADJ-ORDER", "B2-ADJ-PREP"], adv: ["B2-DISCOURSE"], prep: ["B2-DEP-PREP"], pron: ["B2-REFER"], num: ["B2-QUANT-OF"], conj: ["B2-CONN-ADV"], det: ["B2-QUANT-OF"], intj: ["B2-DISCOURSE"], phr: ["B2-PHRASAL-ADV"] },
  C1:  { n: ["C1-NOMINAL-ADV", "C1-NOUN-COMPL"], v: ["C1-VERB-COMPL", "C1-SUBJ-MAND"], adj: ["C1-ADJ-COMPL", "C1-REGISTER"], adv: ["C1-HEDGE-ADV"], prep: ["C1-COMPLEX-PREP"], pron: ["C1-NOMREL"], num: ["C1-QUANT-EXPR"], conj: ["C1-CONN-ADV2"], det: ["C1-QUANT-EXPR"], intj: ["C1-REGISTER"], phr: ["C1-COLLOC-ADV"] },
};

// ── 5. Word-level specialisations ──────────────────────────────────────────
const IRREGULAR_PAST = new Set([
  "go went","buy bought","take took","make made","come came","get got","give gave","find found",
  "think thought","say said","tell told","know knew","see saw","write wrote","read read","run ran",
  "eat ate","drink drank","sleep slept","drive drove","ride rode","speak spoke","teach taught",
  "learn learnt","leave left","meet met","pay paid","put put","send sent","sit sat","stand stood",
  "swim swam","win won","build built","bring brought","catch caught","choose chose","cut cut",
  "fall fell","feel felt","fight fought","fly flew","forget forgot","forgive forgave","grow grew",
  "hear heard","hold held","keep kept","lead led","lose lost","mean meant","break broke",
  "become became","begin began","bend bent","bite bit","blow blew","cast cast","cost cost",
  "deal dealt","dig dug","do did","draw drew","dream dreamt","hang hung","hide hid","hit hit",
  "lay laid","lie lay","light lit","ride rode","ring rang","rise rose","seek sought","sell sold",
  "shake shook","shoot shot","shut shut","sing sang","sink sank","spread spread","stick stuck",
  "strike struck","sweep swept","wear wore","understand understood","spend spent","wake woke",
]);
const IRREGULAR_PLURAL = new Set([
  "children","men","women","people","feet","teeth","mice","geese","oxen","sheep","deer","fish",
  "criterion/criteria","child","man","woman","person","foot","tooth","mouse","goose","ox",
]);

function posFamily(pos) {
  const p = (pos || "").trim().toLowerCase().replace(/\.$/, "");
  if (["n", "noun"].includes(p)) return "n";
  if (["v", "verb"].includes(p)) return "v";
  if (["adj", "adjective"].includes(p)) return "adj";
  if (["adv", "adverb"].includes(p)) return "adv";
  if (["prep", "preposition"].includes(p)) return "prep";
  if (["pron", "pronoun"].includes(p)) return "pron";
  if (["num", "numeral"].includes(p)) return "num";
  if (["conj", "conjunction"].includes(p)) return "conj";
  if (["det", "determiner"].includes(p)) return "det";
  if (["intj", "interjection", "int"].includes(p)) return "intj";
  if (["phr", "phrase", "sentence"].includes(p)) return "phr";
  return null;
}

/**
 * Deterministic grammar classification of one sense.
 * @returns {string[]} ordered rule codes, max 3
 */
export function rulesForSense({ level, category, pos, word }) {
  const fam = posFamily(pos);
  const group = groupFor(category);
  const w = (word || "").toLowerCase().trim();

  const out = [];
  const push = (codes) => { for (const c of codes) if (!out.includes(c)) out.push(c); };

  // 1) group-level thematic rules for this level
  push(GROUP_RULES[group]?.[level] ?? []);

  // 2) pos overlay for this level
  if (fam) push(POS_RULES[level]?.[fam] ?? []);

  // 3) word-level specialisations
  if (fam === "v" && IRREGULAR_PAST.has(w)) { out.unshift("A2-PAST-IRR"); push(["A2-PAST-IRR"]); }
  if (fam === "n" && IRREGULAR_PLURAL.has(w)) push(["A1-PLU-IRR"]);
  if (group === "time-numbers" && fam === "num") push(["A1-CARDINAL", "A1-ORDINAL"]);
  if (group === "core-verbs" && fam === "v") {
    // verbs in a verb group get the full tense ladder for the level
    if (level === "A1") push(["A1-PRES-Q"]);
    if (level === "A2") push(["A2-GOINGTO", "A2-PAST-IRR"]);
    if (level === "B1") push(["B1-PASTPERF", "B1-COND-2"]);
    if (level === "B2") push(["B2-PASS-MODAL", "B2-COND-3"]);
    if (level === "C1") push(["C1-SUBJ-MAND"]);
  }

  // Keep only rules defined for this level or below (learners build up).
  const levelIdx = LEVELS.indexOf(level);
  const filtered = out.filter((code) => {
    const rl = code.slice(0, 2);
    return LEVELS.indexOf(rl) <= levelIdx;
  });

  return filtered.slice(0, 3);
}

/** Map of rule code → rule (built once). */
export const RULE_BY_CODE = Object.fromEntries(GRAMMAR_RULES.map((r) => [r.code, r]));
