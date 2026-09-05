import { COUNTRIES } from "../data/countries";
import { IRAN_FOODS } from "../data/foods-iran";
import { WORLD_FOODS } from "../data/foods-world";
import { INGREDIENTS, MEATS, CATEGORIES } from "../data/ingredients";
import { CITIES, resolveCity } from "../data/cities";
import type { Country, Food, Lang, Difficulty } from "../data/types";

/** Scalable data layer. The UI never touches raw seed files — everything goes
 *  through this module, so swapping in an API/backend later is a single-file change. */

export interface Overlay {
  foods: Food[];
  countries: Country[];
  deleted: string[];
}

const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* full/private */ } };

export function loadOverlay(): Overlay {
  try {
    const raw = safeGet("fg_overlay");
    if (raw) { const o = JSON.parse(raw) as Overlay; return { foods: o.foods ?? [], countries: o.countries ?? [], deleted: o.deleted ?? [] }; }
  } catch { /* corrupt overlay — ignore */ }
  return { foods: [], countries: [], deleted: [] };
}

export function saveOverlay(o: Overlay) { safeSet("fg_overlay", JSON.stringify(o)); }

function buildDB() {
  const ov = loadOverlay();
  const countries: Country[] = [...COUNTRIES, ...ov.countries];
  const byId = new Map<string, Country>();
  countries.forEach((c) => byId.set(c.id, c));

  const deleted = new Set(ov.deleted);
  const foods: Food[] = [...IRAN_FOODS, ...WORLD_FOODS, ...ov.foods].filter((f) => !deleted.has(f.id));

  const foodsById = new Map<string, Food>();
  const byCountry = new Map<string, Food[]>();
  const byDiff = new Map<Difficulty, Food[]>();
  const byIng = new Map<string, string[]>();

  for (const f of foods) {
    foodsById.set(f.id, f);
    const cl = byCountry.get(f.country) ?? [];
    cl.push(f); byCountry.set(f.country, cl);
    const dl = byDiff.get(f.diff) ?? [];
    dl.push(f); byDiff.set(f.diff, dl);
    for (const ing of f.ings) {
      const il = byIng.get(ing) ?? [];
      il.push(f.id); byIng.set(ing, il);
    }
  }

  return { countries, countryById: byId, foods, foodsById, byCountry, byDiff, byIng, deleted };
}

let db = buildDB();
export function refreshDB() { db = buildDB(); }
export const DB = () => db;

// ---------- accessors ----------
export const getCountry = (id: string) => db.countryById.get(id);
export const getFood = (id: string) => db.foodsById.get(id);
export const countryName = (id: string, lang: Lang) => {
  const c = db.countryById.get(id);
  if (!c) return id;
  return lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en;
};
export const foodName = (f: Food | undefined, lang: Lang) => {
  if (!f) return "—";
  return lang === "fa" ? (f.fa || f.en) : lang === "ar" ? (f.ar || f.en) : f.en;
};
export const ingredientName = (key: string, lang: Lang) => {
  const i = INGREDIENTS[key];
  if (!i) return key;
  return lang === "fa" ? (i.fa ?? i.en) : lang === "ar" ? (i.ar ?? i.en) : i.en;
};
export const meatName = (key: string, lang: Lang) => {
  const m = MEATS[key as keyof typeof MEATS];
  if (!m) return key;
  return lang === "fa" ? (m.fa ?? m.en) : lang === "ar" ? (m.ar ?? m.en) : m.en;
};
export const categoryName = (key: string, lang: Lang) => {
  const c = CATEGORIES[key];
  if (!c) return key;
  const l = c.l;
  return lang === "fa" ? (l.fa ?? l.en) : lang === "ar" ? (l.ar ?? l.en) : l.en;
};
export const foodsOfCountry = (countryId: string) => db.byCountry.get(countryId) ?? [];
export const foodsOfIngredient = (key: string) => (db.byIng.get(key) ?? []).map((id) => db.foodsById.get(id)).filter(Boolean) as Food[];
export const cuisineOf = (countryId: string, lang: Lang) => {
  const c = db.countryById.get(countryId);
  if (!c) return "—";
  return lang === "fa" ? (c.cuisine.fa ?? c.cuisine.en) : lang === "ar" ? (c.cuisine.ar ?? c.cuisine.en) : c.cuisine.en;
};

// ---------- city axis ----------
const cityCache = new Map<string, string | null>();
export function cityOf(f: Food): string | null {
  let c = cityCache.get(f.id);
  if (c === undefined) {
    c = resolveCity(f.region, f.country);
    cityCache.set(f.id, c);
  }
  return c;
}
export const foodsOfCity = (cityId: string) => db.foods.filter((f) => cityOf(f) === cityId);
export function citiesOfCountry(countryId: string): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const f of db.byCountry.get(countryId) ?? []) {
    const c = cityOf(f);
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
}
export const getCity = (id: string) => CITIES[id] ?? null;
export function cityNameOf(f: Food, lang: Lang): string {
  const id = cityOf(f);
  if (!id) return f.region;
  const c = CITIES[id];
  return lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en;
}

/** Related foods: same country or ≥2 shared ingredients, capped. */
export function relatedFoods(f: Food, n = 6): Food[] {
  const scored = db.foods
    .filter((x) => x.id !== f.id)
    .map((x) => {
      let s = 0;
      if (x.country === f.country) s += 3;
      s += x.ings.filter((i) => f.ings.includes(i)).length;
      if (x.cats.some((c) => f.cats.includes(c))) s += 1;
      return { x, s };
    })
    .filter((e) => e.s >= 3)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, n).map((e) => e.x);
}

export function foodMatchesQuery(f: Food, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [f.en, f.fa, f.ar, f.region, f.desc, ...f.ings.map((i) => INGREDIENTS[i]?.en ?? i), countryName(f.country, "en")].join(" ").toLowerCase();
  return s.split(/\s+/).every((part) => hay.includes(part));
}

export function searchAll(q: string) {
  const s = q.trim().toLowerCase();
  const foods = s ? db.foods.filter((f) => foodMatchesQuery(f, s)) : [];
  const countries = s ? db.countries.filter((c) => [c.en, c.fa, c.ar, c.cuisine.en].join(" ").toLowerCase().includes(s)) : [];
  const ingredients = s ? Object.entries(INGREDIENTS).filter(([, v]) => [v.en, v.fa ?? "", v.ar ?? ""].join(" ").toLowerCase().includes(s)).map(([k]) => k) : [];
  return { foods, countries, ingredients };
}

export const STATS = () => ({
  foods: db.foods.length,
  countries: db.countries.length,
  ingredients: Object.keys(INGREDIENTS).length,
  // every food supports ~5 question types → pool estimate
  questions: db.foods.length * 5 + 26,
  iranFoods: (db.byCountry.get("iran") ?? []).length,
});
