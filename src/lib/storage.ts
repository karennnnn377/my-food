import type { GameResult, Profile, Settings } from "../data/types";
import { hashStr, mulberry32 } from "./engine";
import { todayKey } from "./calendar";

const get = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    if (raw != null) return { ...(fallback as object), ...(JSON.parse(raw) as object) } as T;
  } catch { /* ignore */ }
  return fallback;
};
const getRaw = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    if (raw != null) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
};
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export const DEFAULT_PROFILE: Profile = {
  name: "Traveler", avatar: "🧑‍🍳", xp: 0, coins: 120, games: 0, correct: 0, wrong: 0,
  bestScore: 0, bestStreak: 0, bestCombo: 0, bestAccuracy: 0,
  impossibleCorrect: 0, dailyCompleted: 0, perfectRounds: 0,
  countryWins: {}, foodWins: {}, unlocked: [], dailyDone: {},
  totalsByContinent: {}, timeAttackBest: 0,
  discovered: [], freeHintsDate: "", freeHintsLeft: 3, hintsUsed: 0, mysteryBest: 0,
};

export const DEFAULT_SETTINGS: Settings = {
  lang: "en", sound: true, music: false, notifications: false,
  theme: "dark", calendar: "gregorian", animations: true,
};

export const loadProfile = () => get<Profile>("fg_profile", DEFAULT_PROFILE);
export const saveProfile = (p: Profile) => set("fg_profile", p);
export const loadSettings = () => get<Settings>("fg_settings", DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => set("fg_settings", s);

// ---------- score bookkeeping (backend-ready: replace with API calls) ----------
interface ScoreBook {
  global: number;
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  byCountry: Record<string, number>;
}
const weekKey = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 1);
  const wk = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
  return `${d.getFullYear()}-W${wk}`;
};
const monthKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}`;

export function recordResult(r: GameResult, dateKey: string) {
  const book = getRaw<ScoreBook>("fg_scores", { global: 0, daily: {}, weekly: {}, monthly: {}, byCountry: {} });
  book.global = Math.max(book.global, r.score);
  if (r.score > 0) {
    if (r.mode === "country") {
      if (r.country) book.byCountry[r.country] = Math.max(book.byCountry[r.country] ?? 0, r.score);
    } else {
      if (r.mode === "daily") book.daily[dateKey] = Math.max(book.daily[dateKey] ?? 0, r.score);
      book.weekly[weekKey()] = Math.max(book.weekly[weekKey()] ?? 0, r.score);
      book.monthly[monthKey()] = Math.max(book.monthly[monthKey()] ?? 0, r.score);
    }
  }
  set("fg_scores", book);
}

export interface LbEntry { rank: number; name: string; flag: string; score: number; level: number; streak: number; correct: number; you?: boolean }

const NAMES: [string, string][] = [
  ["Yasmin", "🇮🇷"], ["Kenji", "🇯🇵"], ["Fatima", "🇪🇬"], ["Marco", "🇮🇹"], ["Priya", "🇮🇳"], ["José", "🇲🇽"],
  ["Ingrid", "🇸🇪"], ["Ahmed", "🇲🇦"], ["Chen", "🇨🇳"], ["Amara", "🇳🇬"], ["Dmitri", "🇷🇺"], ["Sofia", "🇪🇸"],
  ["Hana", "🇰🇷"], ["Omar", "🇯🇴"], ["Leila", "🇱🇧"], ["Erik", "🇩🇰"], ["Thiago", "🇧🇷"], ["Mei", "🇹🇼"],
  ["Nadia", "🇹🇷"], ["Kwame", "🇬🇭"], ["Anya", "🇺🇦"], ["Ravi", "🇱🇰"], ["Zara", "🇵🇰"], ["Luca", "🇭🇷"],
  ["Aiko", "🇯🇵"], ["Hassan", "🇸🇦"], ["Marta", "🇵🇱"], ["Diego", "🇦🇷"], ["Nia", "🇰🇪"], ["Tariq", "🇮🇶"],
  ["Elif", "🇹🇷"], ["Minh", "🇻🇳"], ["Astrid", "🇳🇴"], ["Carlos", "🇵🇪"], ["Shirin", "🇮🇷"], ["Jamal", "🇯🇲"],
  ["Olga", "🇧🇬"], ["Sam", "🇺🇸"], ["Yuki", "🇯🇵"], ["Bilal", "🇮🇩"], ["Greta", "🇩🇪"], ["Ali", "🇮🇷"],
];

function seedEntries(tab: string, scale: number): LbEntry[] {
  const rng = mulberry32(hashStr(`lb-${tab}-v1`));
  const count = 24;
  const out: LbEntry[] = [];
  for (let i = 0; i < count; i++) {
    const [name, flag] = NAMES[Math.floor(rng() * NAMES.length)];
    const score = Math.round((0.3 + rng() * 0.7) * scale * (1 - i / (count * 1.4)));
    out.push({
      rank: 0, name: `${name}${i % 3 === 0 ? " " + (i + 1) : ""}`, flag, score,
      level: 3 + Math.floor(rng() * 30), streak: 2 + Math.floor(rng() * 24),
      correct: 20 + Math.floor(rng() * 400),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

export function getLeaderboard(tab: "global" | "daily" | "weekly" | "monthly" | "country", opts: { country?: string; playerName: string; dateKey?: string } = { playerName: "You" }): LbEntry[] {
  const book = getRaw<ScoreBook>("fg_scores", { global: 0, daily: {}, weekly: {}, monthly: {}, byCountry: {} });
  let scale = 6000; let userScore = 0;
  if (tab === "global") { scale = 9500; userScore = book.global; }
  else if (tab === "daily") { scale = 2600; userScore = book.daily[opts.dateKey ?? todayKey()] ?? 0; }
  else if (tab === "weekly") { scale = 5200; userScore = book.weekly[weekKey()] ?? 0; }
  else if (tab === "monthly") { scale = 7800; userScore = book.monthly[monthKey()] ?? 0; }
  else { scale = 4400; userScore = opts.country ? (book.byCountry[opts.country] ?? 0) : 0; }

  const entries = seedEntries(`${tab}-${opts.country ?? "all"}`, scale);
  if (userScore > 0) entries.push({ rank: 0, name: opts.playerName, flag: "⭐", score: userScore, level: 1, streak: 0, correct: 0, you: true });
  entries.sort((a, b) => b.score - a.score);
  return entries.map((e, i) => ({ ...e, rank: i + 1 }));
}
