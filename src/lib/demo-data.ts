// DEMO MODE DATA. These are hand-written examples used when no AI provider is
// configured or the provider fails. They are never presented as live output.
// Pinyin here is hand-written; Phase 3 replaces it with a generated version.

import type { Candidate, ComposeRequest, ComposeResult } from "./types";

interface DemoExample extends ComposeRequest {
  id: string;
  keywords: string[];
  candidates: Omit<Candidate, "provenance">[];
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: "thank-friend",
    intent:
      "I want to thank my friend for helping me with homework, but not sound too formal",
    relationship: "friend",
    tone: "casual",
    keywords: ["thank", "help", "homework", "friend"],
    candidates: [
      {
        label: "direct",
        chinese: "谢谢你帮我做作业。",
        pinyin: "Xièxie nǐ bāng wǒ zuò zuòyè.",
        english: "Thank you for helping me do my homework.",
        nuance:
          "Correct and clear, but a little flat, like a line from a textbook.",
        literalMeaning: "Thank you (for) helping me do homework.",
        gap: "Faithful, but it ignores the \"not too formal\" part. It is neutral rather than warm.",
        vocab: [
          { word: "谢谢", pinyin: "xièxie", meaning: "thank you" },
          { word: "帮", pinyin: "bāng", meaning: "to help" },
          { word: "作业", pinyin: "zuòyè", meaning: "homework" },
        ],
      },
      {
        label: "natural",
        chinese: "作业的事多亏有你，太感谢了！",
        pinyin: "Zuòyè de shì duōkuī yǒu nǐ, tài gǎnxiè le!",
        english: "Couldn't have done the homework without you, thanks so much!",
        nuance:
          "Warm and natural. 多亏有你 (\"thanks to having you\") is how friends give each other credit.",
        literalMeaning:
          "The homework matter, (it was) thanks to having you, so grateful!",
        gap: "Adds \"couldn't have done it without you\", slightly stronger than what you said.",
        vocab: [
          { word: "多亏", pinyin: "duōkuī", meaning: "thanks to, luckily" },
          { word: "感谢", pinyin: "gǎnxiè", meaning: "to be grateful" },
        ],
      },
      {
        label: "fitted",
        chinese: "今天多亏你了，作业总算搞定，改天请你喝奶茶！",
        pinyin:
          "Jīntiān duōkuī nǐ le, zuòyè zǒngsuàn gǎodìng, gǎitiān qǐng nǐ hē nǎichá!",
        english:
          "You saved me today, homework's finally done. Bubble tea on me sometime!",
        nuance:
          "Very casual, friend to friend. Offering bubble tea is a typical light way to say thanks without sounding formal.",
        literalMeaning:
          "Today (it was) thanks to you, the homework is finally sorted, another day I'll treat you to milk tea!",
        gap: "Adds a promise to treat them to bubble tea, which you didn't say. Drop that part if you don't mean it.",
        vocab: [
          { word: "搞定", pinyin: "gǎodìng", meaning: "to get done, sorted (colloquial)" },
          { word: "改天", pinyin: "gǎitiān", meaning: "another day" },
          { word: "请", pinyin: "qǐng", meaning: "to treat (someone)" },
        ],
      },
    ],
  },
  {
    id: "meet-classmate",
    intent: "Ask my classmate if we can meet tomorrow to study",
    relationship: "classmate",
    tone: "friendly",
    keywords: ["meet", "study", "tomorrow", "classmate"],
    candidates: [
      {
        label: "direct",
        chinese: "我们明天可以见面学习吗？",
        pinyin: "Wǒmen míngtiān kěyǐ jiànmiàn xuéxí ma?",
        english: "Can we meet tomorrow to study?",
        nuance:
          "Clear and polite, but 见面学习 sounds slightly stiff. People usually say 一起学习 or 一起复习.",
        literalMeaning: "Can we meet (and) study tomorrow?",
        gap: "none",
        vocab: [
          { word: "明天", pinyin: "míngtiān", meaning: "tomorrow" },
          { word: "见面", pinyin: "jiànmiàn", meaning: "to meet" },
          { word: "学习", pinyin: "xuéxí", meaning: "to study" },
        ],
      },
      {
        label: "natural",
        chinese: "明天有空吗？要不要一起复习？",
        pinyin: "Míngtiān yǒu kòng ma? Yào bu yào yìqǐ fùxí?",
        english: "Free tomorrow? Want to review together?",
        nuance:
          "How classmates actually text: check if they're free first, then suggest. 复习 (review) is more natural than 学习 when a test is coming.",
        literalMeaning:
          "Tomorrow have free time? Want or not want to review together?",
        gap: "Says \"review\" instead of \"study\". Fine before a test; otherwise use 一起学习.",
        vocab: [
          { word: "有空", pinyin: "yǒu kòng", meaning: "to be free, have time" },
          { word: "要不要", pinyin: "yào bu yào", meaning: "do you want to" },
          { word: "一起", pinyin: "yìqǐ", meaning: "together" },
          { word: "复习", pinyin: "fùxí", meaning: "to review" },
        ],
      },
      {
        label: "fitted",
        chinese: "明天要不要约个时间一起学习？图书馆怎么样？",
        pinyin:
          "Míngtiān yào bu yào yuē ge shíjiān yìqǐ xuéxí? Túshūguǎn zěnmeyàng?",
        english: "Want to set a time to study together tomorrow? Library maybe?",
        nuance:
          "Friendly and proactive. Proposing a place makes it easy for them to say yes.",
        literalMeaning:
          "Tomorrow do you want to arrange a time to study together? How about the library?",
        gap: "Adds a suggested place (the library) that you didn't mention.",
        vocab: [
          { word: "约", pinyin: "yuē", meaning: "to arrange, to set up (a time)" },
          { word: "图书馆", pinyin: "túshūguǎn", meaning: "library" },
          { word: "怎么样", pinyin: "zěnmeyàng", meaning: "how about" },
        ],
      },
    ],
  },
  {
    id: "dinner-family",
    intent: "Tell my host family's mom that dinner was delicious",
    relationship: "family",
    tone: "appreciative",
    keywords: ["dinner", "delicious", "food", "mom", "family", "host", "meal"],
    candidates: [
      {
        label: "direct",
        chinese: "晚饭很好吃。",
        pinyin: "Wǎnfàn hěn hǎochī.",
        english: "Dinner was delicious.",
        nuance:
          "Correct but bare. On its own it can sound like a report rather than a thank-you.",
        literalMeaning: "Dinner (was) very tasty.",
        gap: "Matches the words, but says nothing about appreciation.",
        vocab: [
          { word: "晚饭", pinyin: "wǎnfàn", meaning: "dinner" },
          { word: "好吃", pinyin: "hǎochī", meaning: "delicious" },
        ],
      },
      {
        label: "natural",
        chinese: "阿姨，今天的晚饭太好吃了！",
        pinyin: "Āyí, jīntiān de wǎnfàn tài hǎochī le!",
        english: "Auntie, tonight's dinner was so good!",
        nuance:
          "阿姨 (auntie) is the natural way to address a host mother, and 太…了 adds warmth.",
        literalMeaning: "Auntie, today's dinner (was) too tasty!",
        gap: "Adds the address \"auntie\", which is expected and polite here.",
        vocab: [
          { word: "阿姨", pinyin: "āyí", meaning: "auntie (also a friend's mother)" },
          { word: "太…了", pinyin: "tài…le", meaning: "so, too (emphasis)" },
        ],
      },
      {
        label: "fitted",
        chinese: "阿姨，今天的菜太好吃了，谢谢您辛苦做饭！",
        pinyin: "Āyí, jīntiān de cài tài hǎochī le, xièxie nín xīnkǔ zuòfàn!",
        english: "Auntie, the food today was amazing, thank you for cooking!",
        nuance:
          "Warm and appreciative. 您 and 辛苦 acknowledge her effort, which matters with elders.",
        literalMeaning:
          "Auntie, today's dishes (were) too tasty, thank you (respectful) for working hard cooking!",
        gap: "Adds explicit thanks for her effort. It fits the appreciative tone but goes beyond \"it was delicious\".",
        vocab: [
          { word: "菜", pinyin: "cài", meaning: "dishes, food" },
          { word: "您", pinyin: "nín", meaning: "you (respectful)" },
          { word: "辛苦", pinyin: "xīnkǔ", meaning: "hard work, to go to trouble" },
        ],
      },
    ],
  },
  {
    id: "late-assignment",
    intent: "Apologize to my teacher for sending the assignment late",
    relationship: "teacher",
    tone: "polite",
    keywords: ["sorry", "apolog", "late", "teacher", "assignment"],
    candidates: [
      {
        label: "direct",
        chinese: "对不起，我的作业交晚了。",
        pinyin: "Duìbuqǐ, wǒ de zuòyè jiāo wǎn le.",
        english: "Sorry, I turned in my assignment late.",
        nuance:
          "Fine for a quick apology, but 对不起 plus 我的 reads a little childlike when writing to a teacher.",
        literalMeaning: "Sorry, my homework (was) handed in late.",
        gap: "none",
        vocab: [
          { word: "对不起", pinyin: "duìbuqǐ", meaning: "sorry" },
          { word: "交", pinyin: "jiāo", meaning: "to hand in" },
          { word: "晚", pinyin: "wǎn", meaning: "late" },
        ],
      },
      {
        label: "natural",
        chinese: "老师，不好意思，作业交晚了。",
        pinyin: "Lǎoshī, bù hǎoyìsi, zuòyè jiāo wǎn le.",
        english: "Teacher, sorry, I handed in the assignment late.",
        nuance:
          "Addressing 老师 first is standard. 不好意思 is the everyday, lighter apology.",
        literalMeaning: "Teacher, (I'm) embarrassed, homework handed in late.",
        gap: "Lighter than \"apologize\". Fine for a small delay, too light for a serious one.",
        vocab: [
          { word: "老师", pinyin: "lǎoshī", meaning: "teacher" },
          { word: "不好意思", pinyin: "bù hǎoyìsi", meaning: "sorry, excuse me (mild)" },
        ],
      },
      {
        label: "fitted",
        chinese: "老师您好，很抱歉作业交晚了，给您添麻烦了，下次一定按时交。",
        pinyin:
          "Lǎoshī nín hǎo, hěn bàoqiàn zuòyè jiāo wǎn le, gěi nín tiān máfan le, xiàcì yídìng ànshí jiāo.",
        english:
          "Hello teacher, I'm very sorry the assignment was late and for the trouble. I'll hand it in on time next time.",
        nuance:
          "Properly polite: 抱歉, 您, 添麻烦 and a promise to do better. This is the shape of a respectful apology to a teacher.",
        literalMeaning:
          "Teacher hello (respectful), very sorry homework handed in late, caused you trouble, next time will definitely hand in on time.",
        gap: "Adds an apology for the trouble and a promise for next time. You didn't say those, but a teacher would expect them.",
        vocab: [
          { word: "抱歉", pinyin: "bàoqiàn", meaning: "sorry (more formal)" },
          { word: "添麻烦", pinyin: "tiān máfan", meaning: "to cause trouble" },
          { word: "按时", pinyin: "ànshí", meaning: "on time" },
        ],
      },
    ],
  },
];

/**
 * Picks the prepared example that best matches a request.
 * `matched` is false when nothing in the intent overlaps a known example,
 * so the UI can say so instead of pretending the result fits.
 */
export function matchDemo(req: ComposeRequest): {
  result: ComposeResult;
  matched: boolean;
} {
  const text = req.intent.toLowerCase();
  let best = DEMO_EXAMPLES[0];
  let bestScore = 0;
  for (const ex of DEMO_EXAMPLES) {
    let score = ex.keywords.filter((k) => text.includes(k)).length;
    if (ex.relationship === req.relationship) score += 0.5;
    if (score > bestScore) {
      best = ex;
      bestScore = score;
    }
  }
  const result: ComposeResult = {
    id: best.id,
    intent: best.intent,
    relationship: best.relationship,
    tone: best.tone,
    sourceLanguage: "en",
    targetLanguage: "zh-Hans",
    // Hand-written by the developers with AI help; no native speaker has checked them.
    candidates: best.candidates.map((c) => ({ ...c, provenance: "ai-generated" })),
  };
  return { result, matched: bestScore >= 1 };
}
