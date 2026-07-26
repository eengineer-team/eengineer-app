// Plain typed dictionary, no i18n framework -- one page doesn't justify the
// dependency, and a plain Record gives compile-time errors for missing
// keys instead of a runtime "key not found."
//
// Two tiers, deliberately kept as separate top-level object groups so a
// shallow merge can't accidentally leak one into the other:
//   - Chrome tier (ChromeCopy): nav labels, buttons, form fields -- short,
//     low-risk strings. Drafted in uz/ru below, each block flagged
//     unreviewed.
//   - Substantive tier (SubstantiveCopy): About body, judging criteria,
//     FAQ, rules -- the text a participant could point at as evidence the
//     contest was unfair. English only until the founder (a native Uzbek
//     speaker) writes the uz/ru versions directly -- not machine-translated
//     and presented as final.
//
// A language is only offered in the switcher once BOTH tiers are complete
// for it (see LANGS below) -- a half-translated contest page is worse than
// an honest single-language one. Until uz/ru substantive copy lands, the
// page defaults to English even though uz is the primary audience.

export type Lang = 'en' | 'uz' | 'ru'

interface ChromeCopy {
  nav: { about: string; judging: string; register: string; faq: string; sponsors: string }
  hero: { eyebrow: string; ctaRegister: string }
  form: {
    name: string
    namePlaceholder: string
    region: string
    regionPlaceholder: string
    ageGroup: string
    junior: string
    seniorLabel: string
    telegram: string
    telegramPlaceholder: string
    guardianTelegram: string
    guardianTelegramHelp: string
    guardianTelegramWarning: string
    email: string
    emailPlaceholder: string
    submit: string
    submitting: string
    successTitle: string
    successBody: string
    errorFallback: string
  }
  inquiry: {
    title: string
    contact: string
    contactPlaceholder: string
    message: string
    messagePlaceholder: string
    submit: string
    success: string
  }
  registrationOpenNote: string
}

interface SubstantiveCopy {
  aboutTitle: string
  aboutBody: string[]
  judgingTitle: string
  judgingIntro: string
  judgingCriteria: { label: string; weight: number; description: string }[]
  judgingGates: string[]
  judgingShortlist: string
  faqTitle: string
  faq: { q: string; a: string }[]
  sponsorsTitle: string
}

export type ContestCopy = ChromeCopy & SubstantiveCopy

// -- English: complete, both tiers. The current source of truth. --------

const en: ContestCopy = {
  nav: { about: 'About', judging: 'Judging', register: 'Register', faq: 'FAQ', sponsors: 'Sponsors' },
  hero: {
    eyebrow: 'eengineer × Pizik Lab',
    ctaRegister: 'Register',
  },
  form: {
    name: 'Full name',
    namePlaceholder: 'Your name',
    region: 'Region',
    regionPlaceholder: 'e.g. Tashkent',
    ageGroup: 'Age group',
    junior: 'Junior (12–15)',
    seniorLabel: 'Senior (16–18)',
    telegram: 'Your Telegram handle',
    telegramPlaceholder: '@yourhandle',
    guardianTelegram: 'Parent/guardian Telegram handle',
    guardianTelegramHelp:
      "Required for the Junior bracket. We'll use it to send results, arrange any prize, and so your family has a direct way to reach us with questions or concerns. It won't be used for marketing.",
    guardianTelegramWarning: "That looks the same as your own handle — that's fine if your family shares one account.",
    email: 'Email (optional)',
    emailPlaceholder: 'you@example.com',
    submit: 'Register',
    submitting: 'Registering…',
    successTitle: "You're registered.",
    successBody:
      "We'll message you on Telegram once the submission window opens, with the exact deadline and how to submit.",
    errorFallback: "Couldn't register right now. Please try again in a moment.",
  },
  inquiry: {
    title: 'Questions or concerns',
    contact: 'Your contact (email or Telegram)',
    contactPlaceholder: '@yourhandle or you@example.com',
    message: 'Message',
    messagePlaceholder: 'Ask us anything about the contest, or tell us if something feels unfair.',
    submit: 'Send',
    success: "Sent. We'll get back to you.",
  },
  registrationOpenNote:
    'Registration is open now. The submission window opens once the contest is announced — everyone registered gets the exact date first, before it goes anywhere else.',
  aboutTitle: 'About',
  aboutBody: [
    'Every child deserves to taste science. The eengineer Challenge is a video contest for Uzbek youth, co-hosted with Pizik Lab, built on one idea: applied physics, chemistry, and biology should be accessible and fun no matter where a child lives.',
    'Explain a science or engineering idea you find genuinely interesting, and show it working — build it, film it, demonstrate it. Two minutes, your own work, judged by peers and then by a small panel.',
  ],
  judgingTitle: 'Judging',
  judgingIntro:
    'Every entry is compared head-to-head by the community with no names attached, so what gets ranked is the work, not who posted it. That peer voting produces a ranking; a shortlist from the top of that ranking is then scored in detail by a small panel against the rubric below. Only shortlisted entries receive a per-criterion breakdown — that\'s a limit of scoring at volume, not a secret about who gets reviewed. The shortlist size scales with how many people enter (roughly the top 20%, capped at 10 per bracket).',
  judgingCriteria: [
    { label: 'Clarity of explanation', weight: 30, description: 'Does a non-expert actually understand it?' },
    { label: 'Engagement', weight: 25, description: 'Is it watchable — does it hold attention for the full two minutes?' },
    { label: 'Creativity of presentation', weight: 20, description: 'The format is yours — build it, film it, animate it, draw it.' },
    { label: 'Scientific accuracy', weight: 15, description: 'Is the science actually correct?' },
    {
      label: 'Topic difficulty (age-weighted)',
      weight: 10,
      description:
        'The same topic scores differently by bracket — an ambitious topic for a Junior counts more than the same topic for a Senior. The gap is small and can be made up with creativity and the rest of the rubric, so nobody should feel they lost for picking an age-appropriate topic.',
    },
  ],
  judgingGates: [
    'The video is exactly 2 minutes.',
    "It's the entrant's own work.",
    'Factually incorrect science disqualifies the entry, regardless of how it scores otherwise.',
  ],
  judgingShortlist:
    'This full process — the rubric, the shortlist rule, and the pass/fail gates above — is what will actually be used to judge every entry. Nothing here is aspirational.',
  faqTitle: 'FAQ',
  faq: [
    {
      q: 'Do I need an eengineer account to register?',
      a: "No. Registration only needs your name, region, age group, and a Telegram handle — no account, no password.",
    },
    {
      q: "I'm 12 — can I enter?",
      a: 'Yes. The contest has a Junior bracket for ages 12–15 and a Senior bracket for 16–18, judged separately. (Creating an eengineer account is a separate thing with its own 13+ age requirement — the contest doesn\'t need one.)',
    },
    {
      q: 'Is there a cash prize?',
      a: "We're not confirming a prize amount until it's secured. We'll announce it here the moment it is.",
    },
    {
      q: 'When is the submission deadline?',
      a: "Not set yet — it depends on funding. Register now and we'll message everyone the exact date first, before it's announced anywhere else.",
    },
    {
      q: 'How do I submit my video once the window opens?',
      a: "We'll message registered participants on Telegram with submission instructions when the window opens.",
    },
  ],
  sponsorsTitle: 'Sponsors',
}

// -- uz / ru: chrome tier only, drafted here (unreviewed), substantive
// tier intentionally left to the founder. --------------------------------

const uzChrome: ChromeCopy = {
  nav: {
    about: 'Haqida' /* unreviewed */,
    judging: "Baholash" /* unreviewed */,
    register: "Ro'yxatdan o'tish" /* unreviewed */,
    faq: 'Savollar' /* unreviewed */,
    sponsors: 'Homiylar' /* unreviewed */,
  },
  hero: {
    eyebrow: 'eengineer × Pizik Lab' /* unreviewed */,
    ctaRegister: "Ro'yxatdan o'tish" /* unreviewed */,
  },
  form: {
    name: "To'liq ism" /* unreviewed */,
    namePlaceholder: 'Ismingiz' /* unreviewed */,
    region: 'Viloyat' /* unreviewed */,
    regionPlaceholder: 'masalan, Toshkent' /* unreviewed */,
    ageGroup: 'Yosh guruhi' /* unreviewed */,
    junior: 'Kichik guruh (12–15)' /* unreviewed */,
    seniorLabel: 'Katta guruh (16–18)' /* unreviewed */,
    telegram: 'Sizning Telegram foydalanuvchi nomingiz' /* unreviewed */,
    telegramPlaceholder: '@foydalanuvchi_nomi' /* unreviewed */,
    guardianTelegram: 'Ota-ona/vasiyning Telegram foydalanuvchi nomi' /* unreviewed */,
    guardianTelegramHelp:
      "Kichik guruh uchun majburiy. Natijalar, sovrin va oilangiz biz bilan bog'lanishi uchun kerak. Reklama uchun ishlatilmaydi." /* unreviewed */,
    guardianTelegramWarning: "Bu sizning o'zingizniki bilan bir xil ko'rinadi — agar oilangiz bitta akkauntdan foydalansa, bu normal." /* unreviewed */,
    email: 'Email (ixtiyoriy)' /* unreviewed */,
    emailPlaceholder: 'siz@example.com' /* unreviewed */,
    submit: "Ro'yxatdan o'tish" /* unreviewed */,
    submitting: "Yuborilmoqda…" /* unreviewed */,
    successTitle: "Siz ro'yxatdan o'tdingiz." /* unreviewed */,
    successBody:
      "Topshirish oynasi ochilganda sizga Telegram orqali aniq muddat va topshirish yo'riqnomasini yuboramiz." /* unreviewed */,
    errorFallback: "Hozir ro'yxatdan o'tib bo'lmadi. Birozdan so'ng qayta urinib ko'ring." /* unreviewed */,
  },
  inquiry: {
    title: 'Savol yoki shikoyat' /* unreviewed */,
    contact: 'Aloqa (email yoki Telegram)' /* unreviewed */,
    contactPlaceholder: '@foydalanuvchi_nomi yoki siz@example.com' /* unreviewed */,
    message: 'Xabar' /* unreviewed */,
    messagePlaceholder: "Musobaqa haqida savolingiz bo'lsa yoki biror narsa adolatsiz tuyulsa, yozing." /* unreviewed */,
    submit: 'Yuborish' /* unreviewed */,
    success: "Yuborildi. Siz bilan bog'lanamiz." /* unreviewed */,
  },
  registrationOpenNote:
    "Ro'yxatdan o'tish hozir ochiq. Musobaqa e'lon qilinganda topshirish oynasi ochiladi — barcha ro'yxatdan o'tganlar aniq sanani birinchi bo'lib bilishadi." /* unreviewed */,
}

const ruChrome: ChromeCopy = {
  nav: {
    about: 'О программе' /* unreviewed */,
    judging: 'Оценивание' /* unreviewed */,
    register: 'Регистрация' /* unreviewed */,
    faq: 'Вопросы' /* unreviewed */,
    sponsors: 'Спонсоры' /* unreviewed */,
  },
  hero: {
    eyebrow: 'eengineer × Pizik Lab' /* unreviewed */,
    ctaRegister: 'Зарегистрироваться' /* unreviewed */,
  },
  form: {
    name: 'Полное имя' /* unreviewed */,
    namePlaceholder: 'Ваше имя' /* unreviewed */,
    region: 'Регион' /* unreviewed */,
    regionPlaceholder: 'например, Ташкент' /* unreviewed */,
    ageGroup: 'Возрастная группа' /* unreviewed */,
    junior: 'Младшая группа (12–15)' /* unreviewed */,
    seniorLabel: 'Старшая группа (16–18)' /* unreviewed */,
    telegram: 'Ваш Telegram' /* unreviewed */,
    telegramPlaceholder: '@ваш_ник' /* unreviewed */,
    guardianTelegram: 'Telegram родителя/опекуна' /* unreviewed */,
    guardianTelegramHelp:
      'Обязательно для младшей группы. Нужен для результатов, вручения приза и связи с семьёй. Не используется для рекламы.' /* unreviewed */,
    guardianTelegramWarning: 'Совпадает с вашим собственным — это нормально, если у семьи один аккаунт.' /* unreviewed */,
    email: 'Email (необязательно)' /* unreviewed */,
    emailPlaceholder: 'you@example.com' /* unreviewed */,
    submit: 'Зарегистрироваться' /* unreviewed */,
    submitting: 'Отправка…' /* unreviewed */,
    successTitle: 'Вы зарегистрированы.' /* unreviewed */,
    successBody: 'Напишем вам в Telegram, когда откроется приём работ, с точной датой и инструкцией.' /* unreviewed */,
    errorFallback: 'Не удалось зарегистрироваться. Попробуйте ещё раз через минуту.' /* unreviewed */,
  },
  inquiry: {
    title: 'Вопросы или жалобы' /* unreviewed */,
    contact: 'Контакт (email или Telegram)' /* unreviewed */,
    contactPlaceholder: '@ваш_ник или you@example.com' /* unreviewed */,
    message: 'Сообщение' /* unreviewed */,
    messagePlaceholder: 'Задайте вопрос о конкурсе или напишите, если что-то кажется несправедливым.' /* unreviewed */,
    submit: 'Отправить' /* unreviewed */,
    success: 'Отправлено. Мы свяжемся с вами.' /* unreviewed */,
  },
  registrationOpenNote:
    'Регистрация открыта уже сейчас. Приём работ откроется после объявления конкурса — все зарегистрированные узнают точную дату первыми.' /* unreviewed */,
}

const STRINGS: Record<Lang, ContestCopy> = {
  en,
  uz: { ...en, ...uzChrome },
  ru: { ...en, ...ruChrome },
}

// A language only appears in the switcher once ITS substantive tier is
// filled in -- right now that's true for none of uz/ru, so only English is
// offered even though the chrome strings above are ready to go. Flip these
// once the founder supplies reviewed uz/ru copy for About/Judging/FAQ.
const SUBSTANTIVE_COMPLETE: Record<Lang, boolean> = { en: true, uz: false, ru: false }

export const AVAILABLE_LANGS: Lang[] = (['en', 'uz', 'ru'] as Lang[]).filter((l) => SUBSTANTIVE_COMPLETE[l])

// Uzbek is the primary audience and becomes the default the moment its
// substantive copy is complete; until then, fall back to the first
// complete language rather than defaulting to a half-translated page.
export const DEFAULT_LANG: Lang = SUBSTANTIVE_COMPLETE.uz ? 'uz' : 'en'

export function getContestCopy(lang: Lang): ContestCopy {
  return STRINGS[lang] ?? STRINGS.en
}

export const LANG_LABEL: Record<Lang, string> = { en: 'EN', uz: "O'Z", ru: 'РУС' }
