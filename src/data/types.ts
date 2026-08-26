/** Core domain types — the data layer is language-agnostic; UI resolves labels at render time. */

export type Lang = "en" | "fa" | "ar";
export type Difficulty = "easy" | "medium" | "hard" | "extreme" | "impossible";
export type QType = "country" | "foodname" | "ingredient" | "meat" | "region" | "cuisine" | "notingredient";
export type GameMode = "classic" | "timeattack" | "endless" | "country" | "world" | "daily";
export type Spice = 0 | 1 | 2 | 3;
export type MeatKey = "beef" | "lamb" | "chicken" | "fish" | "shrimp" | "pork" | "turkey" | "duck" | "offal" | "other" | "none";

export interface L10n { en: string; fa?: string; ar?: string }

export interface Country {
  id: string;
  en: string;
  fa: string;
  ar: string;
  flag: string;
  continent: string; // africa | asia | europe | americas | oceania | meast (middle east)
  cuisine: L10n;
  note?: string; // english cuisine overview
}

export interface Food {
  id: string;
  en: string;
  fa: string;
  ar: string;
  country: string; // country id
  region: string;
  cats: string[]; // category keys
  ings: string[]; // ingredient keys
  meats: MeatKey[];
  veg: boolean;
  vegan: boolean;
  spice: Spice;
  diff: Difficulty;
  emoji: string;
  desc: string; // english description / food fact
}

/** A question instance. For generated questions `correct`/`options` hold lookup keys
 *  (country id, ingredient key, meat key, region string, food id or `o0..o3` for custom). */
export interface Question {
  id: string;
  type: QType;
  diff: Difficulty;
  foodId: string;
  correct: string;
  options: string[]; // always length 4, shuffled
  custom?: { prompt: L10n; options: L10n[]; fact?: string };
}

export interface GameConfig {
  mode: GameMode;
  diff: Difficulty | "mixed";
  country?: string;
  questions: number;
  lives: number;
  seconds?: number; // time attack
}

export interface AnswerLog { qid: string; foodId: string; correct: boolean; points: number }

export interface GameResult {
  mode: GameMode;
  diff: Difficulty | "mixed";
  country?: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  bestCombo: number;
  bestStreak: number;
  xp: number;
  answers: AnswerLog[];
  completed: boolean;
  impossibleCorrect: number;
}

export interface Profile {
  name: string;
  xp: number;
  games: number;
  correct: number;
  wrong: number;
  bestScore: number;
  bestStreak: number;
  bestCombo: number;
  bestAccuracy: number;
  impossibleCorrect: number;
  dailyCompleted: number;
  perfectRounds: number;
  countryWins: Record<string, number>; // correct answers per country
  foodWins: Record<string, number>; // correct answers per food
  unlocked: string[]; // achievement ids
  dailyDone: Record<string, { score: number; correct: number; total: number }>;
  totalsByContinent: Record<string, number>;
  timeAttackBest: number;
}

export interface Settings {
  lang: Lang;
  sound: boolean;
  music: boolean;
  notifications: boolean;
  theme: "dark" | "light";
  calendar: "gregorian" | "persian";
  animations: boolean;
}

export interface ScoringConfig {
  base: Record<Difficulty, number>;
  combo: { threshold: number; mult: number }[];
  lives: number;
  xp: Record<Difficulty, number>;
}
