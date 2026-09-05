import type { Difficulty, Food, GameResult, Profile, QType, Question, ScoringConfig, L10n } from "../data/types";
import { DB, getFood, getCountry, cityOf } from "./data";
import { TRIVIA } from "../data/impossible";

// ---------------- RNG ----------------
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

// ---------------- scoring config (admin-configurable) ----------------
export const DEFAULT_SCORING: ScoringConfig = {
  base: { easy: 100, medium: 200, hard: 400, extreme: 800, impossible: 1500 },
  combo: [{ threshold: 3, mult: 2 }, { threshold: 5, mult: 3 }, { threshold: 10, mult: 5 }],
  lives: 3,
  xp: { easy: 10, medium: 20, hard: 40, extreme: 80, impossible: 150 },
};
export function getScoring(): ScoringConfig {
  try {
    const raw = localStorage.getItem("fg_scoring");
    if (raw) return { ...DEFAULT_SCORING, ...(JSON.parse(raw) as ScoringConfig) };
  } catch { /* default */ }
  return DEFAULT_SCORING;
}
export function setScoring(s: ScoringConfig) {
  try { localStorage.setItem("fg_scoring", JSON.stringify(s)); } catch { /* ignore */ }
}

export function comboFor(streak: number): number {
  const cfg = getScoring().combo;
  let m = 1;
  for (const c of cfg) if (streak >= c.threshold) m = c.mult;
  return m;
}
export function pointsFor(diff: Difficulty, streakAfter: number, timeBonus = 0): number {
  return getScoring().base[diff] * comboFor(streakAfter) + timeBonus;
}

// ---------------- XP / levels ----------------
export const xpForLevel = (level: number) => level * 150; // XP needed to go from `level` to level+1
export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1, rest = xp;
  while (rest >= xpForLevel(level)) { rest -= xpForLevel(level); level++; }
  return { level, into: rest, need: xpForLevel(level) };
}

// ---------------- question generation ----------------
const ALL_TYPES: QType[] = ["country", "cuisine", "foodname", "ingredient", "meat", "region", "notingredient", "ingfood", "city", "recipe"];

function eligibleTypes(f: Food): QType[] {
  const db = DB();
  const types: QType[] = [];
  for (const t of ALL_TYPES) {
    switch (t) {
      case "country": case "cuisine": case "foodname": types.push(t); break;
      case "ingredient": case "notingredient": if (f.ings.length >= 3) types.push(t); break;
      case "ingfood": case "recipe": if (f.ings.length >= 3) types.push(t); break;
      case "meat": if (f.meats[0] !== "none") types.push(t); break;
      case "city": {
        const c = cityOf(f);
        if (c) {
          const sameCountry = db.byCountry.get(f.country) ?? [];
          const others = new Set(sameCountry.map((x) => cityOf(x)).filter((x) => x && x !== c));
          if (others.size >= 3) types.push(t);
        }
        break;
      }
      case "region": {
        if (f.region && f.region !== "Nationwide") {
          const regions = new Set(db.foods.map((x) => x.region).filter((r) => r && r !== "Nationwide" && r !== f.region));
          if (regions.size >= 3) types.push(t);
        }
        break;
      }
    }
  }
  return types;
}

/** Three plausible food-name distractors: same country first, then the wider world. */
function foodNameDistractors(food: Food, rng: () => number): string[] | null {
  const db = DB();
  const same = db.foods.filter((f) => f.country === food.country && f.id !== food.id).map((f) => f.id);
  const other = db.foods.filter((f) => f.country !== food.country && f.id !== food.id).map((f) => f.id);
  let d = shuffle(same, rng).slice(0, 3);
  if (d.length < 3) d = [...d, ...shuffle(other, rng).slice(0, 3 - d.length)];
  return d.length >= 3 ? d : null;
}

function distractorsFrom<T>(pool: T[], exclude: Set<string>, key: (x: T) => string, n: number, rng: () => number): string[] {
  const opts = pool.map(key).filter((k) => !exclude.has(k));
  const uniq = [...new Set(opts)];
  return shuffle(uniq, rng).slice(0, n);
}

export function makeQuestion(food: Food, type: QType, rng: () => number): Question | null {
  const db = DB();
  const base = { diff: food.diff, foodId: food.id, type };
  switch (type) {
    case "country": {
      const d = distractorsFrom(db.countries, new Set([food.country]), (c) => c.id, 3, rng);
      if (d.length < 3) return null;
      const options = shuffle([food.country, ...d], rng);
      return { ...base, id: `${food.id}:country`, correct: food.country, options };
    }
    case "cuisine": {
      const d = distractorsFrom(db.countries, new Set([food.country]), (c) => c.id, 3, rng);
      if (d.length < 3) return null;
      const options = shuffle([food.country, ...d], rng);
      return { ...base, id: `${food.id}:cuisine`, correct: food.country, options };
    }
    case "region": {
      const regions = [...new Set(db.foods.map((f) => f.region).filter((r) => r && r !== "Nationwide"))];
      const d = distractorsFrom(regions, new Set([food.region]), (r) => r, 3, rng);
      if (d.length < 3) return null;
      return { ...base, id: `${food.id}:region:${food.region}`, correct: food.region, options: shuffle([food.region, ...d], rng) };
    }
    case "ingredient": {
      const correct = pick(food.ings, rng);
      const d = distractorsFrom(globalIngKeys(), new Set(food.ings), (k) => k, 3, rng);
      if (d.length < 3) return null;
      return { ...base, id: `${food.id}:ing:${correct}`, correct, options: shuffle([correct, ...d], rng) };
    }
    case "notingredient": {
      const real = shuffle(food.ings, rng).slice(0, 3);
      const fake = distractorsFrom(globalIngKeys(), new Set(food.ings), (k) => k, 1, rng)[0];
      if (!fake) return null;
      return { ...base, id: `${food.id}:noting:${fake}`, correct: fake, options: shuffle([...real, fake], rng) };
    }
    case "meat": {
      const correct = food.meats.find((m) => m !== "none") ?? "beef";
      const meatKeys = ["beef", "lamb", "chicken", "fish", "shrimp", "pork", "turkey", "duck", "offal"];
      const d = distractorsFrom(meatKeys, new Set(food.meats), (k) => k, 3, rng);
      if (d.length < 3) return null;
      return { ...base, id: `${food.id}:meat`, correct, options: shuffle([correct, ...d], rng) };
    }
    case "foodname": {
      const d = foodNameDistractors(food, rng);
      if (!d) return null;
      return { ...base, id: `${food.id}:name`, correct: food.id, options: shuffle([food.id, ...d], rng) };
    }
    case "ingfood": {
      // "Which dish is made with these ingredients?" — options are food names
      const d = foodNameDistractors(food, rng);
      if (!d || food.ings.length < 3) return null;
      return { ...base, id: `${food.id}:ingfood`, correct: food.id, options: shuffle([food.id, ...d], rng) };
    }
    case "recipe": {
      // "Which dish do these recipe steps describe?"
      const d = foodNameDistractors(food, rng);
      if (!d) return null;
      return { ...base, id: `${food.id}:recipe`, correct: food.id, options: shuffle([food.id, ...d], rng) };
    }
    case "city": {
      const c = cityOf(food);
      if (!c) return null;
      const sameCountry = db.byCountry.get(food.country) ?? [];
      const otherCities = [...new Set(sameCountry.map((x) => cityOf(x)).filter((x) => x && x !== c))] as string[];
      const d = shuffle(otherCities, rng).slice(0, 3);
      if (d.length < 3) return null;
      return { ...base, id: `${food.id}:city:${c}`, correct: c, options: shuffle([c, ...d], rng) };
    }
    default: return null;
  }
}

let ingKeysCache: string[] | null = null;
function globalIngKeys(): string[] {
  if (!ingKeysCache) {
    const s = new Set<string>();
    DB().foods.forEach((f) => f.ings.forEach((i) => s.add(i)));
    ingKeysCache = [...s];
  }
  return ingKeysCache;
}

export function triviaToQuestion(t: (typeof TRIVIA)[number], rng: () => number): Question {
  const order = shuffle([0, 1, 2, 3], rng);
  const correctIdx = order.indexOf(0); // correct option is originally at index 0
  return {
    id: t.id, type: "country", diff: "impossible", foodId: "",
    correct: `o${correctIdx}`,
    options: order.map((i) => `o${i}`),
    custom: { prompt: t.prompt, options: t.options, fact: t.fact },
  };
}

// ---------------- anti-repetition ----------------
interface SeenRec { id: string; ts: number; n: number }
const loadSeen = (): SeenRec[] => {
  try { const raw = localStorage.getItem("fg_seen"); if (raw) return JSON.parse(raw) as SeenRec[]; } catch { /* ignore */ }
  return [];
};
export function seenIds(maxAgeDays = 3): Set<string> {
  const cutoff = Date.now() - maxAgeDays * 86400000;
  return new Set(loadSeen().filter((r) => r.ts > cutoff).map((r) => r.id));
}
export function markSeen(ids: string[]) {
  const now = Date.now();
  const map = new Map<string, SeenRec>();
  loadSeen().forEach((r) => map.set(r.id, r));
  ids.forEach((id) => {
    const ex = map.get(id);
    map.set(id, { id, ts: now, n: (ex?.n ?? 0) + 1 });
  });
  const arr = [...map.values()].sort((a, b) => b.ts - a.ts).slice(0, 400);
  try { localStorage.setItem("fg_seen", JSON.stringify(arr)); } catch { /* ignore */ }
}

// ---------------- session builders ----------------
function genForFood(food: Food, rng: () => number, avoid: Set<string>): Question | null {
  const types = shuffle(eligibleTypes(food), rng);
  for (const t of types) {
    const q = makeQuestion(food, t, rng);
    if (q && !avoid.has(q.id)) return q;
  }
  // allow repeats only if nothing else possible
  for (const t of types) { const q = makeQuestion(food, t, rng); if (q) return q; }
  return null;
}

function sampleFoods(pool: Food[], n: number, rng: () => number): Food[] {
  return shuffle(pool, rng).slice(0, n);
}

const RAMP: Difficulty[] = ["easy", "easy", "easy", "medium", "medium", "medium", "medium", "hard", "hard", "hard", "extreme", "extreme", "extreme", "hard", "hard", "medium", "extreme", "hard", "medium", "easy"];

export function buildSession(opts: { diff: Difficulty | "mixed"; country?: string; city?: string; onlyType?: QType; count: number; rng?: () => number }): Question[] {
  const db = DB();
  const rng = opts.rng ?? Math.random;
  const avoid = seenIds();
  const out: Question[] = [];
  const usedFoods = new Set<string>();

  // Impossible mode uses its own separate trivia pool — never mixed with other difficulties.
  if (opts.diff === "impossible" && !opts.country && !opts.city && !opts.onlyType) {
    return shuffle(TRIVIA, rng).slice(0, Math.min(opts.count, TRIVIA.length)).map((tq) => triviaToQuestion(tq, rng));
  }

  // Mystery mode: name-only questions; the tile reveal does the difficulty work.
  if (opts.onlyType) {
    const pool = opts.country ? (db.byCountry.get(opts.country) ?? []) : db.foods;
    for (const f of sampleFoods(pool, opts.count * 2, rng)) {
      if (out.length >= opts.count) break;
      if (usedFoods.has(f.id)) continue;
      const q = makeQuestion(f, opts.onlyType, rng);
      if (q && !avoid.has(q.id)) { out.push(q); usedFoods.add(f.id); }
    }
    return out;
  }

  if (opts.country || opts.city) {
    const pool = opts.city ? db.foods.filter((f) => cityOf(f) === opts.city) : (db.byCountry.get(opts.country!) ?? []);
    for (const f of sampleFoods(pool, opts.count * 2, rng)) {
      if (out.length >= opts.count) break;
      if (usedFoods.has(f.id)) continue;
      const q = genForFood(f, rng, avoid);
      if (q) { out.push(q); usedFoods.add(f.id); }
    }
    return out;
  }

  for (let i = 0; i < opts.count; i++) {
    const diff: Difficulty = opts.diff === "mixed" ? RAMP[i % RAMP.length] : opts.diff;
    let pool = db.byDiff.get(diff) ?? [];
    if (opts.diff !== "mixed") {
      // for fixed difficulty, spread across countries
      pool = shuffle(pool, rng);
    }
    let q: Question | null = null;
    for (const f of pool) {
      if (usedFoods.has(f.id)) continue;
      q = genForFood(f, rng, avoid);
      if (q) { usedFoods.add(f.id); break; }
    }
    if (!q) {
      // pool exhausted for this difficulty — relax constraints
      for (const f of pool) { q = genForFood(f, rng, avoid); if (q) break; }
    }
    if (q) out.push(q);
  }
  return out;
}

/** On-demand question for endless / time attack, with rising difficulty and anti-repeat. */
export function nextLiveQuestion(index: number, used: Set<string>, rng: () => number = Math.random): Question | null {
  const db = DB();
  const avoid = seenIds();
  const stages: Difficulty[] = index < 4 ? ["easy"] : index < 9 ? ["easy", "medium"] : index < 15 ? ["medium", "hard"] : index < 22 ? ["hard", "extreme"] : ["extreme", "impossible"];
  for (const diff of shuffle(stages, rng)) {
    if (diff === "impossible") {
      const pool = TRIVIA.filter((t) => !used.has(t.id));
      if (pool.length) return triviaToQuestion(pick(pool, rng), rng);
      continue;
    }
    const pool = (db.byDiff.get(diff) ?? []).filter((f) => !used.has(f.id));
    for (const f of shuffle(pool, rng).slice(0, 12)) {
      const q = genForFood(f, rng, avoid);
      if (q && !used.has(q.id)) return q;
    }
  }
  // fallback: any food not used
  const any = db.foods.filter((f) => !used.has(f.id));
  if (any.length) return genForFood(pick(any, rng), rng, new Set());
  return null;
}

/** Daily challenge: identical for all players on a given date. Rotates a world theme. */
export interface DailyTheme { kind: "continent" | "country"; id: string; icon: string; label: L10n }
export const DAILY_THEMES: DailyTheme[] = [
  { kind: "continent", id: "asia", icon: "🌏", label: { en: "Taste of Asia", fa: "طعم آسیا", ar: "نكهة آسيا" } },
  { kind: "country", id: "iran", icon: "🇮🇷", label: { en: "Iranian Food Challenge", fa: "چالش غذای ایرانی", ar: "تحدي الطعام الإيراني" } },
  { kind: "continent", id: "europe", icon: "🏰", label: { en: "European Table", fa: "سفره اروپایی", ar: "المائدة الأوروبية" } },
  { kind: "country", id: "japan", icon: "🇯🇵", label: { en: "Japanese Delicacies", fa: "ظرافت‌های ژاپنی", ar: "أطايب يابانية" } },
  { kind: "continent", id: "americas", icon: "🌎", label: { en: "Americas Feast", fa: "ضیافت قاره آمریکا", ar: "وليمة الأمريكيتين" } },
  { kind: "country", id: "mexico", icon: "🇲🇽", label: { en: "Mexican Fiesta", fa: "فیستای مکزیکی", ar: "احتفال مكسيكي" } },
  { kind: "continent", id: "africa", icon: "🌍", label: { en: "African Pot", fa: "دیگ آفریقایی", ar: "قِدر أفريقيا" } },
  { kind: "country", id: "turkey", icon: "🇹🇷", label: { en: "Turkish Kitchen", fa: "آشپزخانه ترکی", ar: "المطبخ التركي" } },
  { kind: "country", id: "italy", icon: "🇮🇹", label: { en: "Italian Classics", fa: "کلاسیک‌های ایتالیایی", ar: "كلاسيكيات إيطالية" } },
  { kind: "country", id: "india", icon: "🇮🇳", label: { en: "Indian Spice Route", fa: "مسیر ادویه هند", ar: "طريق التوابل الهندي" } },
  { kind: "country", id: "lebanon", icon: "🇱🇧", label: { en: "Levantine Spread", fa: "سفره شامی", ar: "مائدة شامية" } },
  { kind: "country", id: "thailand", icon: "🇹🇭", label: { en: "Thai Street Fire", fa: "آتیش خیابانی تایلند", ar: "نار الشارع التايلاندي" } },
];

export function dailyTheme(dateKey: string): DailyTheme {
  return DAILY_THEMES[hashStr(`theme-${dateKey}`) % DAILY_THEMES.length];
}

export function dailySession(dateKey: string): Question[] {
  const rng = mulberry32(hashStr(`daily-${dateKey}`));
  const theme = dailyTheme(dateKey);
  const db = DB();
  const pool = theme.kind === "country"
    ? (db.byCountry.get(theme.id) ?? [])
    : db.foods.filter((f) => getCountry(f.country)?.continent === theme.id);

  const plan: Difficulty[] = ["easy", "easy", "medium", "medium", "medium", "hard", "hard", "extreme", "extreme", "impossible"];
  const out: Question[] = [];
  const used = new Set<string>();
  const localPool = (diff: Difficulty) => shuffle(pool.filter((f) => f.diff === diff && !used.has(f.id)), rng);
  for (const diff of plan) {
    if (diff === "impossible") {
      out.push(triviaToQuestion(pick(TRIVIA, rng), rng));
      continue;
    }
    let placed = false;
    for (const f of localPool(diff)) {
      const q = genForFood(f, rng, new Set());
      if (q) { out.push(q); used.add(f.id); placed = true; break; }
    }
    if (!placed) {
      // theme pool too small at this difficulty — pull any unused theme food
      for (const f of shuffle(pool.filter((x) => !used.has(x.id)), rng)) {
        const q = genForFood(f, rng, new Set());
        if (q) { out.push(q); used.add(f.id); break; }
      }
    }
  }
  return out;
}

// ---------------- achievements ----------------
export interface AchievementDef { id: string; icon: string; name: L10n; desc: L10n; test: (p: Profile) => boolean }

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-correct", icon: "🥇", name: { en: "First Bite", fa: "اولین لقمه", ar: "اللقمة الأولى" }, desc: { en: "Get your first correct answer", fa: "اولین پاسخ درست را بده", ar: "أجب أول إجابة صحيحة" }, test: (p) => p.correct >= 1 },
  { id: "correct-10", icon: "🍽️", name: { en: "Appetizer", fa: "پیش‌غذا", ar: "مقبلات" }, desc: { en: "10 correct answers", fa: "۱۰ پاسخ درست", ar: "10 إجابات صحيحة" }, test: (p) => p.correct >= 10 },
  { id: "correct-100", icon: "🏅", name: { en: "Foodie", fa: "غذادوست", ar: "ذوّاق" }, desc: { en: "100 correct answers", fa: "۱۰۰ پاسخ درست", ar: "100 إجابة صحيحة" }, test: (p) => p.correct >= 100 },
  { id: "correct-500", icon: "🎖️", name: { en: "Gourmet", fa: "خوش‌خوراک", ar: "خبير طعام" }, desc: { en: "500 correct answers", fa: "۵۰۰ پاسخ درست", ar: "500 إجابة صحيحة" }, test: (p) => p.correct >= 500 },
  { id: "perfect-round", icon: "💯", name: { en: "Perfect Round", fa: "دور بی‌نقص", ar: "جولة مثالية" }, desc: { en: "Finish a game with zero mistakes", fa: "بازی را بدون اشتباه تمام کن", ar: "أنهِ لعبة بلا أخطاء" }, test: (p) => p.perfectRounds >= 1 },
  { id: "world-traveler", icon: "🌍", name: { en: "World Traveler", fa: "جهانگرد", ar: "رحّالة" }, desc: { en: "Answer correctly from 25+ countries", fa: "از ۲۵+ کشور درست پاسخ بده", ar: "أجب صحيحاً من 25 دولة" }, test: (p) => Object.values(p.countryWins).filter((v) => v > 0).length >= 25 },
  { id: "iran-expert", icon: "🇮🇷", name: { en: "Iran Food Expert", fa: "کارشناس غذای ایران", ar: "خبير الطعام الإيراني" }, desc: { en: "50 correct answers on Iranian food", fa: "۵۰ پاسخ درست درباره غذای ایرانی", ar: "50 إجابة صحيحة عن الطعام الإيراني" }, test: (p) => (p.countryWins["iran"] ?? 0) >= 50 },
  { id: "asia-explorer", icon: "🌏", name: { en: "Asia Explorer", fa: "کاوشگر آسیا", ar: "مستكشف آسيا" }, desc: { en: "30 correct answers on Asian food", fa: "۳۰ پاسخ درست درباره غذای آسیایی", ar: "30 إجابة عن الطعام الآسيوي" }, test: (p) => (p.totalsByContinent["asia"] ?? 0) >= 30 },
  { id: "europe-master", icon: "🏰", name: { en: "European Food Master", fa: "استاد غذای اروپا", ar: "أستاذ الطعام الأوروبي" }, desc: { en: "30 correct answers on European food", fa: "۳۰ پاسخ درست درباره غذای اروپایی", ar: "30 إجابة عن الطعام الأوروبي" }, test: (p) => (p.totalsByContinent["europe"] ?? 0) >= 30 },
  { id: "impossible-survivor", icon: "☠️", name: { en: "Impossible Survivor", fa: "بازمانده غیرممکن", ar: "ناجي المستحيل" }, desc: { en: "5 correct impossible answers", fa: "۵ پاسخ درست در سطح غیرممکن", ar: "5 إجابات مستحيلة صحيحة" }, test: (p) => p.impossibleCorrect >= 5 },
  { id: "country-champion", icon: "🏆", name: { en: "Country Champion", fa: "قهرمان کشور", ar: "بطل الدولة" }, desc: { en: "15 correct answers on one country", fa: "۱۵ پاسخ درست درباره یک کشور", ar: "15 إجابة صحيحة عن دولة واحدة" }, test: (p) => Object.values(p.countryWins).some((v) => v >= 15) },
  { id: "daily-3", icon: "📅", name: { en: "Regular", fa: "منظم", ar: "منتظم" }, desc: { en: "Complete 3 daily challenges", fa: "۳ چالش روزانه را کامل کن", ar: "أكمل 3 تحديات يومية" }, test: (p) => p.dailyCompleted >= 3 },
  { id: "daily-10", icon: "🗓️", name: { en: "Devotee", fa: "وفادار", ar: "مخلص" }, desc: { en: "Complete 10 daily challenges", fa: "۱۰ چالش روزانه را کامل کن", ar: "أكمل 10 تحديات يومية" }, test: (p) => p.dailyCompleted >= 10 },
  { id: "combo-3", icon: "🔥", name: { en: "Warming Up", fa: "در حال گرم‌شدن", ar: "يحمى" }, desc: { en: "Reach a ×2 combo", fa: "به کمبوی ×۲ برس", ar: "اوصل لكومبو ×2" }, test: (p) => p.bestCombo >= 2 },
  { id: "combo-5", icon: "💥", name: { en: "On Fire", fa: "آتیش‌پاره", ar: "مشتعل" }, desc: { en: "Reach a ×3 combo", fa: "به کمبوی ×۳ برس", ar: "اوصل لكومبو ×3" }, test: (p) => p.bestCombo >= 3 },
  { id: "combo-10", icon: "🌋", name: { en: "Eruption", fa: "فوران", ar: "انفجار" }, desc: { en: "Reach a ×5 combo", fa: "به کمبوی ×۵ برس", ar: "اوصل لكومبو ×5" }, test: (p) => p.bestCombo >= 5 },
  { id: "streak-10", icon: "⚡", name: { en: "Hot Hand", fa: "دست داغ", ar: "يد ساخنة" }, desc: { en: "10 correct answers in a row", fa: "۱۰ پاسخ درست پیاپی", ar: "10 إجابات متتالية" }, test: (p) => p.bestStreak >= 10 },
  { id: "streak-25", icon: "🚀", name: { en: "Unstoppable", fa: "توقف‌ناپذیر", ar: "لا يُوقف" }, desc: { en: "25 correct answers in a row", fa: "۲۵ پاسخ درست پیاپی", ar: "25 إجابة متتالية" }, test: (p) => p.bestStreak >= 25 },
  { id: "streak-50", icon: "🌟", name: { en: "Legend", fa: "افسانه", ar: "أسطورة" }, desc: { en: "50 correct answers in a row", fa: "۵۰ پاسخ درست پیاپی", ar: "50 إجابة متتالية" }, test: (p) => p.bestStreak >= 50 },
  { id: "speed-demon", icon: "⏱️", name: { en: "Speed Demon", fa: "شیطان سرعت", ar: "شيطان السرعة" }, desc: { en: "1500+ points in Time Attack", fa: "۱۵۰۰+ امتیاز در حمله زمانی", ar: "1500+ نقطة في هجوم الوقت" }, test: (p) => p.timeAttackBest >= 1500 },
  { id: "level-10", icon: "⭐", name: { en: "Rising Chef", fa: "سرآشپز نوظهور", ar: "طاهٍ صاعد" }, desc: { en: "Reach level 10", fa: "به سطح ۱۰ برس", ar: "اوصل للمستوى 10" }, test: (p) => levelFromXp(p.xp).level >= 10 },
  { id: "level-25", icon: "🌠", name: { en: "Master Taster", fa: "چشنده استاد", ar: "ذواقة ماهر" }, desc: { en: "Reach level 25", fa: "به سطح ۲۵ برس", ar: "اوصل للمستوى 25" }, test: (p) => levelFromXp(p.xp).level >= 25 },
  { id: "games-10", icon: "🎮", name: { en: "Player", fa: "بازیکن", ar: "لاعب" }, desc: { en: "Play 10 games", fa: "۱۰ بازی انجام بده", ar: "العب 10 ألعاب" }, test: (p) => p.games >= 10 },
  { id: "globe-trotter", icon: "🧭", name: { en: "Globe Trotter", fa: "جهان‌نورد", ar: "جوّاب العالم" }, desc: { en: "Correct answers from 40+ countries", fa: "پاسخ درست از ۴۰+ کشور", ar: "إجابات من 40+ دولة" }, test: (p) => Object.values(p.countryWins).filter((v) => v > 0).length >= 40 },
  // ---- collection / discovery achievements ----
  { id: "first-taste", icon: "🍴", name: { en: "First Taste", fa: "اولین چشیدن", ar: "أول تذوّق" }, desc: { en: "Discover your first food", fa: "اولین غذای خود را کشف کن", ar: "اكتشف أول طعام لك" }, test: (p) => p.discovered.length >= 1 },
  { id: "collector-50", icon: "📔", name: { en: "Collector", fa: "جمع‌آوری‌کننده", ar: "جامع" }, desc: { en: "Discover 50 foods", fa: "۵۰ غذا کشف کن", ar: "اكتشف 50 طعاماً" }, test: (p) => p.discovered.length >= 50 },
  { id: "collector-200", icon: "📚", name: { en: "Food Archivist", fa: "آرشیودار غذا", ar: "مؤرشف الطعام" }, desc: { en: "Discover 200 foods", fa: "۲۰۰ غذا کشف کن", ar: "اكتشف 200 طعام" }, test: (p) => p.discovered.length >= 200 },
  { id: "iran-explorer", icon: "🗺️", name: { en: "Iran Explorer", fa: "کاوشگر ایران", ar: "مستكشف إيران" }, desc: { en: "Discover 50 Iranian foods", fa: "۵۰ غذای ایرانی کشف کن", ar: "اكتشف 50 طعاماً إيرانياً" }, test: (p) => p.discovered.filter((id) => getFood(id)?.country === "iran").length >= 50 },
  { id: "world-traveler-2", icon: "🛫", name: { en: "World Traveler", fa: "جهانگرد", ar: "رحّالة العالم" }, desc: { en: "Discover foods from 25 countries", fa: "از ۲۵ کشور غذا کشف کن", ar: "اكتشف أطعمة من 25 دولة" }, test: (p) => new Set(p.discovered.map((id) => getFood(id)?.country).filter(Boolean)).size >= 25 },
  { id: "global-master", icon: "👑", name: { en: "Global Food Master", fa: "استاد جهانی غذا", ar: "خبير الطعام العالمي" }, desc: { en: "Discover foods from 80+ countries", fa: "از ۸۰+ کشور غذا کشف کن", ar: "اكتشف أطعمة من 80+ دولة" }, test: (p) => new Set(p.discovered.map((id) => getFood(id)?.country).filter(Boolean)).size >= 80 },
  { id: "city-explorer", icon: "🏙️", name: { en: "City Explorer", fa: "کاوشگر شهرها", ar: "مستكشف المدن" }, desc: { en: "Discover foods from 30 cities", fa: "از ۳۰ شهر غذا کشف کن", ar: "اكتشف أطعمة من 30 مدينة" }, test: (p) => new Set(p.discovered.map((id) => { const f = getFood(id); return f ? cityOf(f) : null; }).filter(Boolean)).size >= 30 },
  { id: "dessert-master", icon: "🍰", name: { en: "Dessert Master", fa: "استاد دسر", ar: "خبير الحلويات" }, desc: { en: "Discover 20 desserts", fa: "۲۰ دسر کشف کن", ar: "اكتشف 20 حلوى" }, test: (p) => p.discovered.filter((id) => getFood(id)?.cats.includes("dessert")).length >= 20 },
  { id: "regional-expert", icon: "🥘", name: { en: "Regional Expert", fa: "کارشناس منطقه‌ای", ar: "خبير إقليمي" }, desc: { en: "Discover 60 regional dishes", fa: "۶۰ غذای منطقه‌ای کشف کن", ar: "اكتشف 60 طبقاً إقليمياً" }, test: (p) => p.discovered.filter((id) => { const f = getFood(id); return f && f.region && f.region !== "Nationwide"; }).length >= 60 },
  { id: "spice-hunter", icon: "🌶️", name: { en: "Spice Hunter", fa: "شکارچی ادویه", ar: "صائد التوابل" }, desc: { en: "Discover 20 spicy foods", fa: "۲۰ غذای تند کشف کن", ar: "اكتشف 20 طعاماً حاراً" }, test: (p) => p.discovered.filter((id) => (getFood(id)?.spice ?? 0) >= 2).length >= 20 },
  { id: "food-legend", icon: "🌟", name: { en: "Food Legend", fa: "افسانه غذا", ar: "أسطورة الطعام" }, desc: { en: "Reach level 30", fa: "به سطح ۳۰ برس", ar: "اوصل للمستوى 30" }, test: (p) => levelFromXp(p.xp).level >= 30 },
  { id: "mystery-master", icon: "🕵️", name: { en: "Mystery Master", fa: "استاد معما", ar: "خبير الألغاز" }, desc: { en: "Score 2000+ in Mystery Food", fa: "۲۰۰۰+ امتیاز در غذای مرموز", ar: "2000+ نقطة في الطعام الغامض" }, test: (p) => p.mysteryBest >= 2000 },
];

export function evaluateAchievements(p: Profile): string[] {
  return ACHIEVEMENTS.filter((a) => !p.unlocked.includes(a.id) && a.test(p)).map((a) => a.id);
}

/** Applies a finished game to the profile; returns fresh profile + events for UI. */
export interface AppliedResult { profile: Profile; newUnlocked: string[]; levelBefore: number; coinsEarned: number; newlyDiscovered: string[] }

export function applyResult(p: Profile, r: GameResult, hintsUsedThisGame = 0): AppliedResult {
  const levelBefore = levelFromXp(p.xp).level;

  // ---- discovery: a correct answer on a food "discovers" it for the collection ----
  const newlyDiscovered: string[] = [];
  const discovered = new Set(p.discovered);
  for (const a of r.answers) {
    if (a.correct && a.foodId && !discovered.has(a.foodId)) {
      discovered.add(a.foodId);
      newlyDiscovered.push(a.foodId);
    }
  }

  // ---- coins: reward correct answers, streaks, discoveries, dailies, achievements ----
  let coinsEarned = r.correct * 5;
  coinsEarned += newlyDiscovered.length * 10;
  if (r.bestStreak >= 5) coinsEarned += 10;
  if (r.bestStreak >= 10) coinsEarned += 15;
  if (r.mode === "daily" && r.completed) coinsEarned += 40;
  if (r.completed && r.wrong === 0 && r.correct > 0) coinsEarned += 25;

  const np: Profile = {
    ...p,
    xp: p.xp + r.xp,
    coins: p.coins + coinsEarned,
    games: p.games + 1,
    correct: p.correct + r.correct,
    wrong: p.wrong + r.wrong,
    bestScore: Math.max(p.bestScore, r.score),
    bestStreak: Math.max(p.bestStreak, r.bestStreak),
    bestCombo: Math.max(p.bestCombo, r.bestCombo),
    bestAccuracy: Math.max(p.bestAccuracy, r.accuracy),
    impossibleCorrect: p.impossibleCorrect + r.impossibleCorrect,
    perfectRounds: p.perfectRounds + (r.completed && r.wrong === 0 && r.correct > 0 ? 1 : 0),
    timeAttackBest: r.mode === "timeattack" ? Math.max(p.timeAttackBest, r.score) : p.timeAttackBest,
    mysteryBest: r.mode === "mystery" ? Math.max(p.mysteryBest, r.score) : p.mysteryBest,
    discovered: [...discovered],
    hintsUsed: p.hintsUsed + hintsUsedThisGame,
    countryWins: { ...p.countryWins },
    foodWins: { ...p.foodWins },
    totalsByContinent: { ...p.totalsByContinent },
    unlocked: [...p.unlocked],
  };
  for (const a of r.answers) {
    if (!a.correct) continue;
    const food = getFood(a.foodId);
    if (!food) continue;
    np.countryWins[food.country] = (np.countryWins[food.country] ?? 0) + 1;
    np.foodWins[food.id] = (np.foodWins[food.id] ?? 0) + 1;
    const cont = getCountry(food.country)?.continent;
    if (cont) np.totalsByContinent[cont] = (np.totalsByContinent[cont] ?? 0) + 1;
  }
  const newUnlocked = evaluateAchievements(np);
  np.unlocked = [...np.unlocked, ...newUnlocked];
  np.coins += newUnlocked.length * 25; // achievement bonus
  coinsEarned += newUnlocked.length * 25;
  return { profile: np, newUnlocked, levelBefore, coinsEarned, newlyDiscovered };
}

// ---------------- hints (paid with coins or free daily allowance) ----------------
export interface HintDef { id: string; icon: string; cost: number; label: string }
export const HINTS: HintDef[] = [
  { id: "reveal-country", icon: "🌍", cost: 15, label: "hintCountry" },
  { id: "first-letter", icon: "🔤", cost: 10, label: "hintLetter" },
  { id: "remove-wrong", icon: "✂️", cost: 20, label: "hintRemove" },
  { id: "reveal-category", icon: "🗂️", cost: 10, label: "hintCategory" },
  { id: "reveal-region", icon: "📍", cost: 15, label: "hintRegion" },
  { id: "reveal-image", icon: "🖼️", cost: 12, label: "hintImage" },
];
