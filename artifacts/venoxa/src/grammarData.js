// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa — shared grammar curriculum source
//
//  Extracted verbatim from the original in-app GRAMMAR_CEFR_DETAILED constant.
//  This is the single source of truth for the grammar browser, the study-plan
//  generator and the Learning Path builder. Category order is preserved exactly
//  (alphabetical), including the anomalies reported in docs/content-inventory.md.
//  Do not re-sequence, dedupe, or move rules between levels.
// ─────────────────────────────────────────────────────────────────────────────

export const GRAMMAR_CEFR_DETAILED = [
  {
    level: "A1", labelAr: "مبتدئ", labelEn: "Beginner", color: "#22c55e",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives vs adverbs: word formation & word order (good → well, quick → quickly)", "Comparative adjectives with -er and more (happier, more comfortable)", "Superlative adjectives with -est and the most (the happiest, the most comfortable)"] },
      { name: "Articles & Quantifiers", nameAr: "أدوات التعريف", rules: ["Articles: a, an, the, zero article (I am a singer. I have books. I feel love.)", "Superlative with the (the best, the most interesting)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional (If you are ill, go to the doctor.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Future with will for sudden decisions (I will help you.)", "Future with going to for plans (I am going to see my sister.)", "Will for requests (Will you carry my bag, please?)"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs followed by infinitive or gerund: like, love, want, would like (I like reading. I want to see my family.)", "Stative verbs: know, like, seem, love, have, want, see"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple for actions in the past (I worked last night. I didn't work.)", "Past simple of TO BE (I was, You were, She was…)", "Past simple: regular and irregular verbs (I visited London. I went to see a film.)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Can / can't for abilities (I can't swim. I can cook.)", "Could / couldn't for past abilities (I could swim when I was five.)", "Could for polite requests (Could you help me?)", "Must / mustn't for obligation & prohibition (I must study. You mustn't smoke.)", "Need / needn't for necessity (You need to finish. You needn't hurry.)", "Can for permission & possibility (Can I bring my dog? I can see you after work.)", "Shall for suggestions (Shall I walk you to work?)"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositions of place: at, in, on, in front of, under, behind, among, beside, near, next to, between, across, into, through, onto, out of", "By, of, etc."] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Personal pronouns (I, he, she, it, we, you, they)", "Possessive pronouns (my, your, his, her, its, our, their)", "Possessive with 's (Paul's daughter, my sister's house)", "Object pronouns (me, you, him, her, it, us, them)", "Demonstrative pronouns (this, that, these, those)", "Pronouns: something, anything"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Have got: positive, negative, question (I have got blond hair. Has she got a car?)", "Have (I have breakfast at 8.)", "To be (I am, You are, He is…)", "There is / There are (There is a book. There are books.)", "Present simple for habits (I wake up at 8 every day.)", "Adverbs of frequency: always, never, often, seldom, usually (I usually drink coffee.)", "Present progressive for actions now (I am working now.)", "Present perfect with since and for (I have lived alone since 2000.)", "Present perfect with ever and never (Have you ever been to Britain?)", "Present perfect with already and yet (I haven't been yet. I have already done that.)", "Imperative (Stand up! Do this!)"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Interrogative pronouns: Where, When, Who, How, What, Which, Whose, What time", "Questions with TO BE (Are they relatives?)", "Questions with HAVE GOT (Have you got a car?)", "Questions with Present simple (Do you speak English?)", "Questions with Past simple (Did he do it? Was he at home?)", "Question tags (She is Spanish, isn't she?)"] },
    ]
  },
  {
    level: "A2", labelAr: "أساسي", labelEn: "Elementary", color: "#84cc16",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives vs adverbs (quick → quickly, sudden → suddenly, bad → badly)", "Comparatives with -er and more (older, more expensive)", "Superlatives with -est and the most (the biggest, the most interesting)", "Irregular adjectives: less, good, bad, more", "Use of than (She is a better driver than me.)", "Adverbial phrases of time, place and frequency — including word order"] },
      { name: "Articles & Quantifiers", nameAr: "أدوات التعريف", rules: ["A, an, the, zero article (a book, an orange, the book, students)", "Superlatives with the (He is the best man I have ever met.)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional (Take medicine if you feel ill.)", "First conditional (If it rains tomorrow, I will stay home.)", "First conditional with unless, if only (I will come unless you cancel.)", "Wish (I wish I was taller.)"] },
      { name: "Conjunctions", nameAr: "أدوات الربط", rules: ["Relative clauses: where, when, whose, who, that", "Basic compound sentences (I went out when it was raining. She is the woman who can speak five languages.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will for sudden decisions (I will show you how to use the laptop.)", "Going to for plans (Sarah is going to sell her car.)", "Present simple for future (The plane leaves at 8.)", "Present progressive for future plans (He is not working tomorrow.)", "Will for requests / Shall for suggestions"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs + infinitive or gerund: want, plan, decide, try, hope, expect, offer, forget, need, promise, refuse, learn", "Stative verbs: like, know, belong, love, hate, want, understand, seem, prefer"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Can / can't for abilities", "Could / couldn't for past abilities", "Could for polite requests", "Must for obligation / Mustn't for prohibition", "Have to for obligations in present and past (I had to go to the dentist.)", "Must vs have to distinction", "Need / needn't / have to for necessity and permission", "Should for giving advice (You should sleep more.)"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple: actions in the past (I worked. I didn't work. Did you work?)", "Past simple of TO BE", "Regular and irregular verbs", "Past progressive (I was watching the game.)", "Past progressive interrupted by past simple (I was playing when the phone rang.)", "Major irregular verbs"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositions of place: at, in, on, in front of, under, behind, etc.", "Prepositions of time: on, in, for, at", "Prepositional phrases: on foot, etc.", "By, of, with"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["TO BE / There is / There are", "Have got (positive, negative)", "Present simple for habits & daily routines", "Present simple for future (The bank opens at 8.)", "Adverbs of frequency + word order (She ate quickly.)", "Present progressive now and for future", "Present perfect with since, for, ever, never, already, yet"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Personal, possessive, object, demonstrative pronouns", "Possessive with 's", "Reflexive pronouns: myself, himself, herself, etc."] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Interrogative pronouns: Where, When, Who, How, What, Which, Whose", "Questions with TO BE, HAVE GOT, Present simple/progressive, Past simple/progressive, Present perfect", "Question tags (You have a cat, don't you?)"] },
    ]
  },
  {
    level: "B1", labelAr: "تحت المتوسط", labelEn: "Pre-Intermediate", color: "#3b82f6",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives -ed vs -ing (boring vs bored, tiring vs tired)", "Adverbs of frequency and their word order (I never smoke. I am never late.)", "Comparatives and superlatives of irregular adjectives (little – less – the least)", "Same as, the same (You're just the same as your mother.)", "As… as (He isn't as old as he looks.)", "Like, alike, slightly (You look like your mother. She is slightly taller.)"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero conditional", "First conditional (If you are late, I will be angry.)", "Second conditional (If they had time, they would go on holiday.)", "Third conditional (We would have won if we had played better.)"] },
      { name: "Conjunctions", nameAr: "أدوات الربط", rules: ["Cause, effect and contrast: so, which, until, why, while, when, as, before, after, as long as, whenever"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will for sudden decisions (I will phone tomorrow.)", "Future progressive (Will you be going away this summer?)", "Going to for plans", "Passive voice in future (The report will be done by tomorrow.)"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Verbs + infinitive: want, hope, need, plan, expect, promise, decide, offer, refuse, try, forget, learn, would like", "Verbs + gerund: enjoy, mind, finish, suggest", "Verbs + infinitive or gerund: stop", "Forming nouns from verbs using -ing (swim → swimming)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["May / might for probability and polite requests", "Can / can't in past (She can't have seen me.)", "Can for polite request and probability", "Could for ability and probability (Alcohol could cause cancer.)", "Must vs have to / Must/can't for deduction (That must be the entrance. It can't be far.)", "Be able to in past, present perfect and future", "Ought to for obligation", "Need / needn't — present and past", "Mustn't for obligation", "Shall for suggestions and polite offers"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple", "Past progressive (In 2010 we were living in Australia.)", "Past perfect (When I arrived, everybody had left.)", "Past perfect progressive (I had been playing basketball.)", "Used to (I used to have a dog.)", "Passive voice in past tenses", "Reported speech (She said she loved the film.)"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositional phrases with in, for, from, to, at, about, with, of", "Among, Until, On, At, In"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Present simple and progressive", "Present perfect with for, since, yet, already, never, ever, just", "Present perfect progressive (I have been learning English forever.)", "Passive voice in present tenses", "Present progressive and simple for future", "Reported speech", "There is / There are"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Pronouns: something, anything, nothing", "Reflexive pronouns: myself, himself, herself, itself, ourselves, yourselves, themselves"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Complex question tags (It was raining, wasn't it? You did it, didn't you?)", "Wh- questions (Who is she with? What are they like? What kind of job do you need?)"] },
    ]
  },
  {
    level: "B2", labelAr: "فوق المتوسط", labelEn: "Upper-Intermediate", color: "#f59e0b",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["Adjectives -ed vs -ing", "Adverbs of frequency and word order", "Comparative and superlative of irregular adjectives (far – further/farther – furthest/farthest)", "Same as, the same / As… as / Like, alike, slightly"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["Zero, first, second, third conditionals", "Mixed conditional (If I had worked harder, I would have a better job now.)", "Wish (I wish I was taller. I wish I had done that earlier.)"] },
      { name: "Future Tenses", nameAr: "المستقبل", rules: ["Will / Going to / Future progressive", "Will and going to for prediction", "Will get used to (I will get used to living in a city.)", "Passive voice in future / Reported speech in future", "Future perfect (We will have been married for ten years.)", "Future perfect progressive"] },
      { name: "Gerund & Infinitive", nameAr: "المصدر وإن+فعل", rules: ["Forming nouns from verbs using -ing", "Verbs + gerund: decide, hate, suggest, remember, prefer, try, etc.", "Verbs + infinitive: hope, advise, manage, mind, etc.", "Verbs + bare infinitive: I'd rather, had better", "Verbs + to + gerund: look forward to, help, etc."] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["May / might for probability and polite requests", "May and might for deduction or speculation (I might look for another job.)", "Can / can't have done (It could have been Sarah.)", "Can / could for polite requests and probability", "Could for ability, probability, and deduction", "Must vs have to / Have got to", "Must have done (She must have been asleep.)", "Must / can't for deduction", "Be able to in past, present perfect, future", "Ought to / Need / Needn't / Needn't have done", "Mustn't / Shall / Should / Should have done", "Would expressing past habits (My dad would read me stories every night.)", "Reported speech modals"] },
      { name: "Past Tenses", nameAr: "الماضي", rules: ["Past simple (active & questions)", "Past progressive", "Past perfect (She found the keys she had lost.)", "Past perfect progressive (We had been playing tennis all evening.)", "Used to / Was used to / Got used to", "Had something done (I had my hair cut.)", "Passive voice of all past tenses", "Reported speech / Past tenses for narration", "All irregular verbs"] },
      { name: "Prepositions", nameAr: "حروف الجر", rules: ["Prepositional phrases with in, for, from, to, at, about, with, of, etc.", "Among, Until, On, At, In case, By, Of, With, About, To, For, Out of"] },
      { name: "Present Tenses", nameAr: "المضارع", rules: ["Present simple (including stative verbs: like, prefer, understand, want, know, believe)", "Present simple and progressive for future", "Present progressive with always (She is always screaming.)", "Present perfect with for, since, yet, already, never, ever, just, recently", "Present perfect progressive", "Passive voice of all present tenses", "Reported speech", "Is used to / get used to in all present tenses", "To have something done (I have had my hair cut.)"] },
      { name: "Pronouns", nameAr: "الضمائر", rules: ["Pronouns: something, anything, someone, anyone, somewhere, anywhere, etc.", "Reflexive pronouns", "Relative pronouns for relative clauses: which, who, whose, whom, that, where, when"] },
      { name: "Questions", nameAr: "الأسئلة", rules: ["Complex question tags (I'm going to get an email, aren't I?)", "Wh- questions (How long ago…)", "Auxiliary verbs: either, neither, So do I, I hope so, etc."] },
    ]
  },
  {
    level: "C1", labelAr: "متقدم", labelEn: "Advanced", color: "#ef4444",
    categories: [
      { name: "Adjectives & Adverbs", nameAr: "الصفات والأحوال", rules: ["All forms of adjectives and adverbs", "Inversion with negative adverbials (Never have I seen… / Not only did she… / Hardly had he…)"] },
      { name: "Modal Verbs", nameAr: "الأفعال الناقصة", rules: ["Modals in the past: could have done, may have seen, should have done, might have found, would have been", "Advanced modal distinctions and nuances"] },
      { name: "Conditionals", nameAr: "الجمل الشرطية", rules: ["All conditional forms (zero through mixed)", "Wish / if only for expressing regrets (I wish I had studied harder. If only I had known.)", "Mixed conditionals combining past, present, and future"] },
      { name: "Vocabulary & Collocations", nameAr: "المفردات والتراكيب", rules: ["Phrasal verbs — all forms", "Splitting phrasal verbs (She shut the door up.)", "Idioms — all forms and registers", "Advanced collocations and idiomatic structures across all topics"] },
    ]
  },
];

/** Full CEFR ladder used by the grammar browser and study-plan target picker. */
export const GRAMMAR_LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
