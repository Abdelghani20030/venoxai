// ─────────────────────────────────────────────────────────────────────────────
//  Venoxa A1 authored lesson content
//
//  Every explanation below is derived from the approved A1 grammar rules in
//  artifacts/venoxa/src/grammarData.js and the approved curriculum preview in
//  docs/content-inventory.md. No new grammar topics or lessons are introduced.
//  Vocabulary comes from public/data/langeek.csv; Arabic glosses are joined
//  from public/data/global.csv with a small fallback map in the builder.
//
//  Each lesson contributes:
//    - objectiveEn / objectiveAr
//    - learn: explanation + bilingual examples + notes
//    - grammar: exactly two authored questions (1 practice + 1 check)
//  The builder adds six vocabulary questions per lesson from the real CSV
//  slice, giving the approved 8 questions per lesson (4 practice + 4 check).
// ─────────────────────────────────────────────────────────────────────────────

export const A1_LESSON_CONTENT = {
  'a1-adjectives-and-adverbs': {
    objectiveEn: 'Describe people and things with adjectives and adverbs, then compare them.',
    objectiveAr: 'صِف الأشخاص والأشياء بالصفات والأحوال، ثم قارن بينها.',
    learn: {
      explanationEn:
        'Adjectives describe nouns: a quick learner. Adverbs describe verbs and usually end in -ly: She learns quickly. For short adjectives add -er and -est (quick → quicker → the quickest). For longer adjectives use more and the most (comfortable → more comfortable → the most comfortable).',
      explanationAr:
        'الصفة تصف الاسم: متعلم سريع. والحال يصف الفعل وغالباً ينتهي بـ -ly: هي تتعلم بسرعة. مع الصفات القصيرة نضيف -er و-est (quick ← quicker ← the quickest)، ومع الصفات الطويلة نستخدم more وthe most (comfortable ← more comfortable ← the most comfortable).',
      examples: [
        { en: 'She is a quick learner.', ar: 'هي متعلمة سريعة.' },
        { en: 'She learns quickly.', ar: 'هي تتعلم بسرعة.' },
        { en: 'This book is cheaper than that one.', ar: 'هذا الكتاب أرخص من ذاك.' },
        { en: 'This is the most interesting lesson.', ar: 'هذا هو الدرس الأكثر تشويقاً.' },
      ],
      notesEn: 'Good and well are irregular: good → better → the best.',
      notesAr: 'good وwell شاذتان: good ← better ← the best.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'She sings very ___.',
        promptAr: 'هي تغني بشكل ___ جداً.',
        options: ['good', 'well', 'goodly', 'better'],
        answer: 1,
        explanationEn: 'Sings is a verb, so it needs the adverb well.',
        explanationAr: 'الفعل sings يحتاج إلى الحال well.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'This is the ___ (comfortable) chair in the room.',
        promptAr: 'هذا هو الكرسي ___ (مريح) في الغرفة.',
        accept: ['most comfortable'],
        explanationEn: 'Long adjectives form the superlative with the most.',
        explanationAr: 'الصفات الطويلة تُصاغ بصيغة التفضيل باستخدام the most.',
      },
    ],
  },

  'a1-articles-and-quantifiers': {
    objectiveEn: 'Use a, an, the and the zero article with everyday nouns.',
    objectiveAr: 'استخدم a وan وthe وحالة عدم استخدام أداة التعريف مع الأسماء اليومية.',
    learn: {
      explanationEn:
        'Use a before a consonant sound and an before a vowel sound: a singer, an apple. Use the for something specific or unique, and with superlatives: the best, the most interesting. Use no article for general plurals and uncountable nouns: I have books. I feel love.',
      explanationAr:
        'نستخدم a قبل الصوت الساكن وan قبل صوت العلة: a singer، an apple. ونستخدم the لشيء محدد أو فريد، ومع صيغة التفضيل: the best، the most interesting. ولا نستخدم أداة مع الجمع العام والأسماء غير المعدودة: I have books. I feel love.',
      examples: [
        { en: 'I am a singer.', ar: 'أنا مغنٍ.' },
        { en: 'She has an apple.', ar: 'لديها تفاحة.' },
        { en: 'I have books.', ar: 'لدي كتب.' },
        { en: 'He is the best student.', ar: 'هو أفضل طالب.' },
      ],
      notesEn: 'The choice of a/an depends on the sound, not the letter: an hour, a university.',
      notesAr: 'اختيار a/an يعتمد على الصوت لا على الحرف: an hour، a university.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'I need ___ umbrella.',
        promptAr: 'أحتاج ___ مظلة.',
        options: ['a', 'an', 'the', 'no article'],
        answer: 1,
        explanationEn: 'Umbrella starts with a vowel sound, so use an.',
        explanationAr: 'كلمة umbrella تبدأ بصوت علة، لذلك نستخدم an.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'She is ___ most interesting person here.',
        promptAr: 'هي ___ شخص أكثر تشويقاً هنا.',
        accept: ['the'],
        explanationEn: 'Superlatives take the definite article the.',
        explanationAr: 'صيغة التفضيل تأخذ أداة التعريف the.',
      },
    ],
  },

  'a1-conditionals': {
    objectiveEn: 'Talk about general truths and give instructions with the zero conditional.',
    objectiveAr: 'تحدّث عن الحقائق العامة وأعطِ تعليمات باستخدام الشرط الصفري.',
    learn: {
      explanationEn:
        'The zero conditional describes things that are always true or instructions. Use If + present simple, then present simple: If you are ill, go to the doctor. When the if-clause comes first, put a comma after it.',
      explanationAr:
        'الشرط الصفري يصف ما هو صحيح دائماً أو التعليمات. استخدم If + المضارع البسيط ثم المضارع البسيط: If you are ill, go to the doctor. وإذا جاءت جملة الشرط أولاً نضع فاصلة بعدها.',
      examples: [
        { en: 'If you are ill, go to the doctor.', ar: 'إذا كنت مريضاً، اذهب إلى الطبيب.' },
        { en: 'If water reaches 100°C, it boils.', ar: 'إذا وصل الماء إلى 100 درجة مئوية، فإنه يغلي.' },
        { en: 'If you press this button, the machine starts.', ar: 'إذا ضغطت هذا الزر، تعمل الآلة.' },
      ],
      notesEn: 'Do not use will in the zero conditional.',
      notesAr: 'لا نستخدم will في الشرط الصفري.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'If you ___ tired, go to bed.',
        promptAr: 'إذا كنت ___، فاذهب إلى النوم.',
        options: ['are', 'is', 'be', 'were'],
        answer: 0,
        explanationEn: 'With you we use are in the present simple.',
        explanationAr: 'مع you نستخدم are في المضارع البسيط.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'If it rains, the ground ___ wet.',
        promptAr: 'إذا أمطرت، تصبح الأرض ___ .',
        accept: ['gets', 'is'],
        explanationEn: 'The result clause stays in the present simple.',
        explanationAr: 'جملة النتيجة تبقى في المضارع البسيط.',
      },
    ],
  },

  'a1-future-tenses': {
    objectiveEn: 'Use will for decisions and requests, and going to for plans.',
    objectiveAr: 'استخدم will للقرارات والطلبات وgoing to للخطط.',
    learn: {
      explanationEn:
        'Use will for a sudden decision made now (I will help you) and for requests (Will you carry my bag, please?). Use be going to for plans made before speaking: I am going to see my sister.',
      explanationAr:
        'نستخدم will للقرار المفاجئ في لحظة الكلام (I will help you) وللطلبات (Will you carry my bag, please?). ونستخدم be going to للخطط التي اتُخذت قبل الكلام: I am going to see my sister.',
      examples: [
        { en: 'The phone is ringing. I will answer it.', ar: 'الهاتف يرن. سأجيب عليه.' },
        { en: 'I am going to see my sister next week.', ar: 'سأزور أختي الأسبوع القادم.' },
        { en: 'Will you carry my bag, please?', ar: 'هل تحمل حقيبتي من فضلك؟' },
      ],
      notesEn: 'Going to needs the correct form of be: am / is / are.',
      notesAr: 'تحتاج going to الصيغة الصحيحة من be: am / is / are.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'The phone is ringing. I ___ answer it.',
        promptAr: 'الهاتف يرن. ___ أجيب عليه.',
        options: ['will', 'am going to', 'would', 'do'],
        answer: 0,
        explanationEn: 'This is a sudden decision, so use will.',
        explanationAr: 'هذا قرار مفاجئ، لذلك نستخدم will.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: 'We ___ our grandmother next Friday. We already bought the tickets.',
        promptAr: 'سوف ___ جدتنا الجمعة القادمة. لقد اشترينا التذاكر بالفعل.',
        options: ['are going to visit', 'will visit', 'visit', 'visited'],
        answer: 0,
        explanationEn: 'A plan made before speaking uses be going to.',
        explanationAr: 'الخطة التي اتُخذت قبل الكلام تستخدم be going to.',
      },
    ],
  },

  'a1-gerund-and-infinitive': {
    objectiveEn: 'Use -ing forms and to-infinitives after common verbs.',
    objectiveAr: 'استخدم صيغة -ing وto-infinitives بعد الأفعال الشائعة.',
    learn: {
      explanationEn:
        'Some verbs take an infinitive: want to see, would like to go. Like and love can take either form: I like reading / I like to read. Stative verbs such as know, like, seem, love, have, want and see usually do not take the progressive.',
      explanationAr:
        'بعض الأفعال تأخذ infinitive: want to see، would like to go. والفعلان like وlove يقبلان الصيغتين: I like reading / I like to read. والأفعال الحالية مثل know وlike وseem وlove وhave وwant وsee لا تُستخدم عادةً في الصيغة المستمرة.',
      examples: [
        { en: 'I like reading.', ar: 'أحب القراءة.' },
        { en: 'I want to see my family.', ar: 'أريد أن أرى عائلتي.' },
        { en: 'She knows the answer.', ar: 'هي تعرف الإجابة.' },
      ],
      notesEn: 'Do not say “I am knowing” or “I am wanting”.',
      notesAr: 'لا تقل “I am knowing” أو “I am wanting”.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'I want ___ my family.',
        promptAr: 'أريد ___ عائلتي.',
        options: ['see', 'to see', 'seeing', 'saw'],
        answer: 1,
        explanationEn: 'Want is followed by the to-infinitive.',
        explanationAr: 'الفعل want يتبعه to-infinitive.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: 'She ___ him very well.',
        promptAr: 'هي ___ جيداً جداً.',
        options: ['knows', 'is knowing', 'know', 'knowing'],
        answer: 0,
        explanationEn: 'Know is a stative verb, so use the present simple.',
        explanationAr: 'الفعل know فعل حال، لذلك نستخدم المضارع البسيط.',
      },
    ],
  },

  'a1-past-tenses': {
    objectiveEn: 'Talk about finished past actions with the past simple.',
    objectiveAr: 'تحدّث عن أفعال ماضية منتهية باستخدام الماضي البسيط.',
    learn: {
      explanationEn:
        'The past simple describes a finished action in the past: I worked last night. I did not work. Regular verbs add -ed (worked, visited); irregular verbs change form (go → went, see → saw). The verb to be is was or were: I was, you were, she was.',
      explanationAr:
        'الماضي البسيط يصف فعلاً منتهياً في الماضي: I worked last night. I did not work. الأفعال المنتظمة تأخذ -ed (worked، visited)، والأفعال الشاذة يتغير شكلها (go ← went، see ← saw). وفعل الكينونة يكون was أو were: I was، you were، she was.',
      examples: [
        { en: 'I worked last night.', ar: 'عملت الليلة الماضية.' },
        { en: 'I did not work yesterday.', ar: 'لم أعمل أمس.' },
        { en: 'I visited London.', ar: 'زرت لندن.' },
        { en: 'I went to see a film.', ar: 'ذهبت لمشاهدة فيلم.' },
      ],
      notesEn: 'After did/didn’t, use the base verb: Did you go? not Did you went?',
      notesAr: 'بعد did/didn’t نستخدم الفعل الأساسي: Did you go? وليس Did you went?',
    },
    grammar: [
      {
        step: 'practice',
        type: 'fill_blank',
        promptEn: 'I ___ (work) last night.',
        promptAr: 'أنا ___ (عمل) الليلة الماضية.',
        accept: ['worked'],
        explanationEn: 'Work is regular: add -ed for the past simple.',
        explanationAr: 'الفعل work منتظم: نضيف -ed للماضي البسيط.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: 'They ___ to London last year.',
        promptAr: 'هم ___ إلى لندن العام الماضي.',
        options: ['go', 'went', 'gone', 'going'],
        answer: 1,
        explanationEn: 'Go is irregular: go → went.',
        explanationAr: 'الفعل go شاذ: go ← went.',
      },
    ],
  },

  'a1-modal-verbs-1': {
    objectiveEn: 'Talk about ability in the present and past, and make polite requests.',
    objectiveAr: 'تحدّث عن القدرة في الحاضر والماضي وقدّم طلبات مهذبة.',
    learn: {
      explanationEn:
        'Can and can’t describe present ability: I can cook. I can’t swim. Could and couldn’t describe past ability: I could swim when I was five. Could is also a polite way to ask: Could you help me?',
      explanationAr:
        'can وcan’t تصفان القدرة في الحاضر: I can cook. I can’t swim. وcould وcouldn’t تصفان القدرة في الماضي: I could swim when I was five. كما تُستخدم could للطلب المهذب: Could you help me?',
      examples: [
        { en: 'I can cook.', ar: 'أستطيع الطبخ.' },
        { en: 'I can’t swim.', ar: 'لا أستطيع السباحة.' },
        { en: 'I could swim when I was five.', ar: 'كنت أستطيع السباحة عندما كان عمري خمس سنوات.' },
        { en: 'Could you help me?', ar: 'هل يمكنك مساعدتي؟' },
      ],
      notesEn: 'After can/could, use the base verb without to: can swim, not can to swim.',
      notesAr: 'بعد can/could نستخدم الفعل الأساسي بدون to: can swim وليس can to swim.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'When I was five, I ___ swim.',
        promptAr: 'عندما كان عمري خمس سنوات، ___ السباحة.',
        options: ['can', 'could', 'can’t', 'must'],
        answer: 1,
        explanationEn: 'Past ability uses could.',
        explanationAr: 'القدرة في الماضي تُعبَّر عنها بـ could.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: '___ you help me, please?',
        promptAr: '___ تساعدني من فضلك؟',
        accept: ['Could', 'Can'],
        explanationEn: 'Could or Can makes a polite request.',
        explanationAr: 'could أو can تصنعان طلباً مهذباً.',
      },
    ],
  },

  'a1-modal-verbs-2': {
    objectiveEn: 'Express obligation, prohibition and necessity with must and need.',
    objectiveAr: 'عبّر عن الإلزام والمنع والضرورة باستخدام must وneed.',
    learn: {
      explanationEn:
        'Must shows strong obligation: I must study. Mustn’t shows prohibition: You mustn’t smoke. Need to shows necessity: You need to finish. Needn’t shows that something is not necessary: You needn’t hurry.',
      explanationAr:
        'must تعبّر عن إلزام قوي: I must study. وmustn’t تعبّر عن المنع: You mustn’t smoke. وneed to تعبّر عن الضرورة: You need to finish. وneedn’t تعني أن الشيء غير ضروري: You needn’t hurry.',
      examples: [
        { en: 'I must study tonight.', ar: 'يجب أن أدرس الليلة.' },
        { en: 'You mustn’t smoke here.', ar: 'يجب ألا تدخن هنا.' },
        { en: 'You need to finish the report.', ar: 'تحتاج إلى إنهاء التقرير.' },
        { en: 'You needn’t hurry.', ar: 'لا حاجة للاستعجال.' },
      ],
      notesEn: 'Mustn’t means “not allowed”; needn’t means “not necessary”. They are different.',
      notesAr: 'mustn’t تعني “غير مسموح”، وneedn’t تعني “غير ضروري”. وهما مختلفتان.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'You ___ smoke here. It is forbidden.',
        promptAr: '___ التدخين هنا. إنه ممنوع.',
        options: ['must', 'mustn’t', 'needn’t', 'can'],
        answer: 1,
        explanationEn: 'Forbidden actions use mustn’t.',
        explanationAr: 'الأفعال الممنوعة تُستخدم معها mustn’t.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'You ___ hurry. We have plenty of time.',
        promptAr: '___ للاستعجال. لدينا وقت كافٍ.',
        accept: ['needn’t', 'need not'],
        explanationEn: 'Something not necessary uses needn’t.',
        explanationAr: 'الشيء غير الضروري يُعبَّر عنه بـ needn’t.',
      },
    ],
  },

  'a1-modal-verbs-3': {
    objectiveEn: 'Ask for permission and make suggestions with can and shall.',
    objectiveAr: 'اطلب الإذن وقدّم اقتراحات باستخدام can وshall.',
    learn: {
      explanationEn:
        'Can asks for permission and describes possibility: Can I bring my dog? I can see you after work. Shall is used for suggestions, especially with I and we: Shall I walk you to work?',
      explanationAr:
        'can تُستخدم لطلب الإذن ووصف الاحتمال: Can I bring my dog? I can see you after work. وshall تُستخدم للاقتراحات، خصوصاً مع I وwe: Shall I walk you to work?',
      examples: [
        { en: 'Can I bring my dog?', ar: 'هل يمكنني إحضار كلبي؟' },
        { en: 'I can see you after work.', ar: 'يمكنني رؤيتك بعد العمل.' },
        { en: 'Shall I walk you to work?', ar: 'هل أوصلك سيراً إلى العمل؟' },
      ],
      notesEn: 'Shall I…? is a common way to offer help.',
      notesAr: 'Shall I…? طريقة شائعة لعرض المساعدة.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: '___ I bring my dog to the park?',
        promptAr: '___ لي إحضار كلبي إلى الحديقة؟',
        options: ['Can', 'Must', 'Should', 'Need'],
        answer: 0,
        explanationEn: 'Can asks for permission.',
        explanationAr: 'can تُستخدم لطلب الإذن.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: '___ I carry your bag?',
        promptAr: '___ أحمل حقيبتك؟',
        options: ['Shall', 'Do', 'Am', 'Are'],
        answer: 0,
        explanationEn: 'Shall I…? makes a suggestion or offer.',
        explanationAr: 'Shall I…? تقدّم اقتراحاً أو عرضاً.',
      },
    ],
  },

  'a1-prepositions': {
    objectiveEn: 'Describe where things are and how they move with prepositions.',
    objectiveAr: 'صِف مكان الأشياء وحركتها باستخدام حروف الجر.',
    learn: {
      explanationEn:
        'Prepositions of place answer “where?”: at the door, in the box, on the table, under the chair, next to the bank, between A and C. Prepositions such as by and of show relationships: a book by the window, a cup of tea.',
      explanationAr:
        'حروف الجر للمكان تجيب عن سؤال “أين؟”: at the door، in the box، on the table، under the chair، next to the bank، between A and C. وحروف مثل by وof تُظهر علاقات: a book by the window، a cup of tea.',
      examples: [
        { en: 'The milk is in the fridge.', ar: 'الحليب في الثلاجة.' },
        { en: 'The book is on the table.', ar: 'الكتاب على الطاولة.' },
        { en: 'The bank is next to the post office.', ar: 'البنك بجوار مكتب البريد.' },
        { en: 'She is sitting by the window.', ar: 'هي تجلس بجوار النافذة.' },
      ],
      notesEn: 'At is often used for a point or place: at the bus stop.',
      notesAr: 'غالباً نستخدم at لنقطة أو مكان: at the bus stop.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'The milk is ___ the fridge.',
        promptAr: 'الحليب ___ الثلاجة.',
        options: ['in', 'on', 'at', 'under'],
        answer: 0,
        explanationEn: 'Inside a container or room uses in.',
        explanationAr: 'داخل وعاء أو غرفة نستخدم in.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'The bank is next ___ the post office.',
        promptAr: 'البنك بجوار ___ مكتب البريد.',
        accept: ['to'],
        explanationEn: 'The fixed phrase is next to.',
        explanationAr: 'العبارة الثابتة هي next to.',
      },
    ],
  },

  'a1-pronouns-1': {
    objectiveEn: 'Replace people and things with subject, possessive and possessive-s pronouns.',
    objectiveAr: 'استبدل الأشخاص والأشياء بضمائر الفاعل والملكية و’s.',
    learn: {
      explanationEn:
        'Subject pronouns replace the person or thing doing the action: I, he, she, it, we, you, they. Possessive adjectives show ownership: my, your, his, her, its, our, their. Add ’s to a person to show possession: Paul’s daughter, my sister’s house.',
      explanationAr:
        'ضمائر الفاعل تحل مكان الشخص أو الشيء الذي يقوم بالفعل: I، he، she، it، we، you، they. وصفات الملكية تُظهر الملكية: my، your، his، her، its، our، their. ونضيف ’s إلى الشخص لإظهار الملكية: Paul’s daughter، my sister’s house.',
      examples: [
        { en: 'She is my sister.', ar: 'هي أختي.' },
        { en: 'This is my book.', ar: 'هذا كتابي.' },
        { en: 'Paul’s daughter is a doctor.', ar: 'ابنة بول طبيبة.' },
        { en: 'My sister’s house is big.', ar: 'منزل أختي كبير.' },
      ],
      notesEn: 'Its shows possession for a thing; it’s means “it is”.',
      notesAr: 'its تُظهر الملكية لشيء، أما it’s فتعني “it is”.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'This is ___ book. (I)',
        promptAr: 'هذا ___ كتاب. (أنا)',
        options: ['my', 'me', 'I', 'mine'],
        answer: 0,
        explanationEn: 'Before a noun, use the possessive adjective my.',
        explanationAr: 'قبل الاسم نستخدم صفة الملكية my.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'That is Paul___ daughter.',
        promptAr: 'تلك ابنة بول ___.',
        accept: ['’s', "'s", 's'],
        explanationEn: 'Add ’s to a person to show possession.',
        explanationAr: 'نضيف ’s إلى الشخص لإظهار الملكية.',
      },
    ],
  },

  'a1-pronouns-2': {
    objectiveEn: 'Use object, demonstrative and indefinite pronouns.',
    objectiveAr: 'استخدم ضمائر المفعول وأسماء الإشارة والضمائر غير المحددة.',
    learn: {
      explanationEn:
        'Object pronouns replace the person or thing receiving the action: me, you, him, her, it, us, them. Demonstratives point to things: this/these for near, that/those for far. Something and anything refer to unnamed things: I need something; I don’t need anything.',
      explanationAr:
        'ضمائر المفعول تحل مكان الشخص أو الشيء الذي يتلقى الفعل: me، you، him، her، it، us، them. وأسماء الإشارة تشير إلى الأشياء: this/these للقريب، that/those للبعيد. وsomething/anything تشيران إلى أشياء غير محددة: I need something؛ I don’t need anything.',
      examples: [
        { en: 'Please give me the pen.', ar: 'أعطني القلم من فضلك.' },
        { en: 'These are my shoes.', ar: 'هذه أحذيتي.' },
        { en: 'I need something to drink.', ar: 'أحتاج شيئاً لأشربه.' },
      ],
      notesEn: 'Use anything in negatives and questions: I don’t have anything.',
      notesAr: 'نستخدم anything في النفي والأسئلة: I don’t have anything.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'Please give ___ the pen. (I)',
        promptAr: 'أعطني القلم من فضلك. (أنا)',
        options: ['me', 'I', 'my', 'mine'],
        answer: 0,
        explanationEn: 'The object pronoun for I is me.',
        explanationAr: 'ضمير المفعول لـ I هو me.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: '___ are my shoes.',
        promptAr: '___ أحذيتي.',
        options: ['This', 'These', 'That', 'It'],
        answer: 1,
        explanationEn: 'Shoes is plural and near, so use these.',
        explanationAr: 'shoes جمع وقريب، لذلك نستخدم these.',
      },
    ],
  },

  'a1-present-tenses-1': {
    objectiveEn: 'Use have got, have and the verb to be in the present.',
    objectiveAr: 'استخدم have got وhave وفعل الكينونة to be في المضارع.',
    learn: {
      explanationEn:
        'Have got shows possession: I have got blond hair. Has she got a car? Have without got describes routines and meals: I have breakfast at 8. The verb to be links a subject to a description: I am, you are, he is.',
      explanationAr:
        'have got تُظهر الملكية: I have got blond hair. Has she got a car? وhave بدون got تصف الروتين والوجبات: I have breakfast at 8. وفعل الكينونة to be يربط الفاعل بوصف: I am، you are، he is.',
      examples: [
        { en: 'I have got blond hair.', ar: 'لدي شعر أشقر.' },
        { en: 'Has she got a car?', ar: 'هل لديها سيارة؟' },
        { en: 'I have breakfast at 8.', ar: 'أتناول الفطور في الثامنة.' },
        { en: 'He is a teacher.', ar: 'هو معلم.' },
      ],
      notesEn: 'Have got is common in British English; have is common in American English.',
      notesAr: 'have got شائعة في الإنجليزية البريطانية، وhave شائعة في الأمريكية.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'She ___ got a car.',
        promptAr: 'هي ___ سيارة.',
        options: ['have', 'has', 'is', 'are'],
        answer: 1,
        explanationEn: 'With she, have got becomes has got.',
        explanationAr: 'مع she تصبح have got → has got.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'I ___ breakfast at 8 every day.',
        promptAr: 'أنا ___ الفطور في الثامنة كل يوم.',
        accept: ['have', 'eat'],
        explanationEn: 'Routines use have or eat in the present simple.',
        explanationAr: 'الروتين يستخدم have أو eat في المضارع البسيط.',
      },
    ],
  },

  'a1-present-tenses-2': {
    objectiveEn: 'Describe what exists, habits and frequency.',
    objectiveAr: 'صِف ما يوجد والعادات وتكرارها.',
    learn: {
      explanationEn:
        'There is introduces one thing; there are introduces more than one: There is a book. There are books. The present simple describes habits: I wake up at 8 every day. Adverbs of frequency (always, never, often, seldom, usually) show how often: I usually drink coffee.',
      explanationAr:
        'there is تُقدّم شيئاً واحداً، وthere are تُقدّم أكثر من شيء: There is a book. There are books. والمضارع البسيط يصف العادات: I wake up at 8 every day. وظروف التكرار (always، never، often، seldom، usually) تُظهر عدد المرات: I usually drink coffee.',
      examples: [
        { en: 'There is a book on the table.', ar: 'هناك كتاب على الطاولة.' },
        { en: 'There are books on the shelf.', ar: 'هناك كتب على الرف.' },
        { en: 'I wake up at 8 every day.', ar: 'أستيقظ في الثامنة كل يوم.' },
        { en: 'I usually drink coffee.', ar: 'عادةً أشرب القهوة.' },
      ],
      notesEn: 'Frequency adverbs go before the main verb but after be: I am always tired.',
      notesAr: 'ظروف التكرار تأتي قبل الفعل الرئيسي وبعد be: I am always tired.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'There ___ a book on the table.',
        promptAr: 'هناك ___ كتاب على الطاولة.',
        options: ['is', 'are', 'be', 'am'],
        answer: 0,
        explanationEn: 'A book is singular, so use there is.',
        explanationAr: 'a book مفرد، لذلك نستخدم there is.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: 'I ___ drink coffee in the morning.',
        promptAr: 'أنا ___ أشرب القهوة في الصباح.',
        options: ['usually', 'usual', 'am usually', 'usualy'],
        answer: 0,
        explanationEn: 'Usually is the correct frequency adverb.',
        explanationAr: 'usually هو ظرف التكرار الصحيح.',
      },
    ],
  },

  'a1-present-tenses-3': {
    objectiveEn: 'Use the present progressive and present perfect with since, for, ever and never.',
    objectiveAr: 'استخدم المضارع المستمر والمضارع التام مع since وfor وever وnever.',
    learn: {
      explanationEn:
        'The present progressive describes an action happening now: I am working now. The present perfect links the past to now: I have lived alone since 2000 (since + starting point) and I have lived here for two years (for + period). Ever and never ask or talk about life experience: Have you ever been to Britain?',
      explanationAr:
        'المضارع المستمر يصف فعلاً يحدث الآن: I am working now. والمضارع التام يربط الماضي بالحاضر: I have lived alone since 2000 (since + نقطة البداية) وI have lived here for two years (for + مدة). وever وnever تُستخدمان للسؤال عن تجارب الحياة أو نفيها: Have you ever been to Britain?',
      examples: [
        { en: 'I am working now.', ar: 'أنا أعمل الآن.' },
        { en: 'I have lived alone since 2000.', ar: 'أعيش وحدي منذ عام 2000.' },
        { en: 'Have you ever been to Britain?', ar: 'هل زرت بريطانيا من قبل؟' },
        { en: 'I have never been to Britain.', ar: 'لم أزر بريطانيا قط.' },
      ],
      notesEn: 'Use since with a point in time and for with a length of time.',
      notesAr: 'نستخدم since مع نقطة زمنية وfor مع مدة زمنية.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'I ___ working now.',
        promptAr: 'أنا ___ الآن.',
        options: ['am', 'is', 'are', 'be'],
        answer: 0,
        explanationEn: 'With I, the present progressive uses am + -ing.',
        explanationAr: 'مع I نستخدم am + -ing في المضارع المستمر.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: 'I have lived here ___ 2020.',
        promptAr: 'أعيش هنا ___ عام 2020.',
        accept: ['since'],
        explanationEn: '2020 is a starting point, so use since.',
        explanationAr: '2020 نقطة بداية، لذلك نستخدم since.',
      },
    ],
  },

  'a1-present-tenses-4': {
    objectiveEn: 'Use already, yet and the imperative in everyday instructions.',
    objectiveAr: 'استخدم already وyet وصيغة الأمر في التعليمات اليومية.',
    learn: {
      explanationEn:
        'The present perfect with already shows something happened earlier: I have already done that. Yet is used in negatives and questions: I haven’t been yet. The imperative gives instructions or orders: Stand up! Do this!',
      explanationAr:
        'المضارع التام مع already يُظهر أن شيئاً حدث مسبقاً: I have already done that. وyet تُستخدم في النفي والأسئلة: I haven’t been yet. وصيغة الأمر تعطي تعليمات أو أوامر: Stand up! Do this!',
      examples: [
        { en: 'I have already done that.', ar: 'لقد فعلت ذلك بالفعل.' },
        { en: 'I haven’t been yet.', ar: 'لم أذهب بعد.' },
        { en: 'Stand up!', ar: 'قف!' },
        { en: 'Open your books.', ar: 'افتحوا كتبكم.' },
      ],
      notesEn: 'The imperative uses the base verb with no subject.',
      notesAr: 'صيغة الأمر تستخدم الفعل الأساسي بدون فاعل.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: 'I haven’t finished ___.',
        promptAr: 'لم أنتهِ ___.',
        options: ['yet', 'already', 'since', 'for'],
        answer: 0,
        explanationEn: 'Negatives use yet at the end.',
        explanationAr: 'النفي يستخدم yet في النهاية.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: '___ up and open your books.',
        promptAr: '___ وافتحوا كتبكم.',
        options: ['Stand', 'Stood', 'Standing', 'Stands'],
        answer: 0,
        explanationEn: 'The imperative uses the base verb stand.',
        explanationAr: 'صيغة الأمر تستخدم الفعل الأساسي stand.',
      },
    ],
  },

  'a1-questions-1': {
    objectiveEn: 'Ask questions with question words, to be and have got.',
    objectiveAr: 'اطرح أسئلة باستخدام أدوات الاستفهام وto be وhave got.',
    learn: {
      explanationEn:
        'Question words ask for information: Where, When, Who, How, What, Which, Whose, What time. With to be, put the verb before the subject: Are they relatives? With have got, put have/has before the subject: Have you got a car?',
      explanationAr:
        'أدوات الاستفهام تطلب معلومات: Where، When، Who، How، What، Which، Whose، What time. ومع to be نضع الفعل قبل الفاعل: Are they relatives? ومع have got نضع have/has قبل الفاعل: Have you got a car?',
      examples: [
        { en: 'Where are you from?', ar: 'من أين أنت؟' },
        { en: 'When is your birthday?', ar: 'متى عيد ميلادك؟' },
        { en: 'Are they relatives?', ar: 'هل هم أقارب؟' },
        { en: 'Have you got a car?', ar: 'هل لديك سيارة؟' },
      ],
      notesEn: 'In questions with be, the word order is be + subject.',
      notesAr: 'في الأسئلة مع be يكون الترتيب be + الفاعل.',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: '___ is your birthday?',
        promptAr: '___ عيد ميلادك؟',
        options: ['When', 'Who', 'Whose', 'Which'],
        answer: 0,
        explanationEn: 'When asks about time.',
        explanationAr: 'when تسأل عن الوقت.',
      },
      {
        step: 'check',
        type: 'fill_blank',
        promptEn: '___ they relatives?',
        promptAr: '___ هم أقارب؟',
        accept: ['Are'],
        explanationEn: 'With they, the question form of be is Are.',
        explanationAr: 'مع they يكون شكل السؤال من be هو Are.',
      },
    ],
  },

  'a1-questions-2': {
    objectiveEn: 'Ask present and past simple questions and add question tags.',
    objectiveAr: 'اطرح أسئلة المضارع والماضي البسيط وأضف الأسئلة الذيلية.',
    learn: {
      explanationEn:
        'Present simple questions use do/does + base verb: Do you speak English? Past simple questions use did + base verb: Did he do it? Questions with be use was/were: Was he at home? Question tags repeat the auxiliary with the opposite polarity: She is Spanish, isn’t she?',
      explanationAr:
        'أسئلة المضارع البسيط تستخدم do/does + الفعل الأساسي: Do you speak English? وأسئلة الماضي البسيط تستخدم did + الفعل الأساسي: Did he do it? وأسئلة be تستخدم was/were: Was he at home? والأسئلة الذيلية تكرر الفعل المساعد بالعكس: She is Spanish, isn’t she?',
      examples: [
        { en: 'Do you speak English?', ar: 'هل تتحدث الإنجليزية؟' },
        { en: 'Did he do it?', ar: 'هل فعلها؟' },
        { en: 'Was he at home?', ar: 'هل كان في المنزل؟' },
        { en: 'She is Spanish, isn’t she?', ar: 'هي إسبانية، أليس كذلك؟' },
      ],
      notesEn: 'After do/does/did, use the base verb: Did he go? not Did he went?',
      notesAr: 'بعد do/does/did نستخدم الفعل الأساسي: Did he go? وليس Did he went?',
    },
    grammar: [
      {
        step: 'practice',
        type: 'multiple_choice',
        promptEn: '___ you speak English?',
        promptAr: '___ تتحدث الإنجليزية؟',
        options: ['Do', 'Are', 'Have', 'Is'],
        answer: 0,
        explanationEn: 'Present simple questions with you use Do.',
        explanationAr: 'أسئلة المضارع البسيط مع you تستخدم Do.',
      },
      {
        step: 'check',
        type: 'multiple_choice',
        promptEn: 'She is Spanish, ___ she?',
        promptAr: 'هي إسبانية، ___؟',
        options: ['isn’t', 'doesn’t', 'aren’t', 'is'],
        answer: 0,
        explanationEn: 'The tag for “she is” is “isn’t she?”.',
        explanationAr: 'السؤال الذيلي لـ “she is” هو “isn’t she?”.',
      },
    ],
  },
};
