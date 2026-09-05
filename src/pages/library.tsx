import { useMemo, useState } from "react";
import type { Food } from "../data/types";
import { useI18n } from "../lib/i18n";
import { DB, foodMatchesQuery, countryName, foodsOfIngredient, ingredientName, meatName, categoryName, cuisineOf, getCountry } from "../lib/data";
import { INGREDIENTS, CATEGORIES, MEATS, SPICE_LEVELS } from "../data/ingredients";
import { Chip, EmptyState, FoodTile, Icon, Modal, Reveal, SectionHead } from "../components/ui";
import { FoodInfoCard } from "../components/game";
import type { Route } from "./home";

const PAGE_SIZE = 24;

export function LibraryPage({ nav, initialQuery = "" }: { nav: (r: Route) => void; initialQuery?: string }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState(initialQuery);
  const [country, setCountry] = useState("");
  const [cat, setCat] = useState("");
  const [diff, setDiff] = useState("");
  const [meat, setMeat] = useState("");
  const [spice, setSpice] = useState(-1);
  const [vegOnly, setVegOnly] = useState(false);
  const [veganOnly, setVeganOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<Food | null>(null);
  const [ingKey, setIngKey] = useState<string | null>(null);

  const db = DB();
  const foods = useMemo(() => db.foods.filter((f) =>
    foodMatchesQuery(f, q) &&
    (!country || f.country === country) &&
    (!cat || f.cats.includes(cat)) &&
    (!diff || f.diff === diff) &&
    (!meat || f.meats.includes(meat as Food["meats"][number])) &&
    (spice < 0 || f.spice === spice) &&
    (!vegOnly || f.veg) &&
    (!veganOnly || f.vegan)
  ), [db, q, country, cat, diff, meat, spice, vegOnly, veganOnly]);

  const pages = Math.max(1, Math.ceil(foods.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const slice = foods.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = q || country || cat || diff || meat || spice >= 0 || vegOnly || veganOnly;

  const sel = "bg-panel border border-line rounded-xl px-3 py-2.5 text-sm text-ink focus:outline-2 focus:outline-saffron w-full";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionHead kicker={`${db.foods.length} ${t("foodsLbl")}`} title={t("library")} />

      {/* search + filters */}
      <div className="bg-panel border border-line rounded-3xl p-4 sm:p-5 mb-6">
        <div className="relative mb-4">
          <Icon name="search" className="w-5 h-5 absolute top-1/2 -translate-y-1/2 start-4 text-dim" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder={`${t("searchPh")} · ${t("searchHint")}`}
            className="w-full bg-bg2 border border-line rounded-2xl ps-12 pe-4 py-3.5 text-ink placeholder:text-dim focus:outline-2 focus:outline-saffron" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select className={sel} value={country} onChange={(e) => { setCountry(e.target.value); setPage(0); }}>
            <option value="">{t("filterCountry")}: {t("all")}</option>
            {db.countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en}</option>)}
          </select>
          <select className={sel} value={cat} onChange={(e) => { setCat(e.target.value); setPage(0); }}>
            <option value="">{t("filterCategory")}: {t("all")}</option>
            {Object.keys(CATEGORIES).map((k) => <option key={k} value={k}>{categoryName(k, lang)}</option>)}
          </select>
          <select className={sel} value={diff} onChange={(e) => { setDiff(e.target.value); setPage(0); }}>
            <option value="">{t("filterDiff")}: {t("all")}</option>
            {["easy", "medium", "hard", "extreme", "impossible"].map((d) => <option key={d} value={d}>{t(d)}</option>)}
          </select>
          <select className={sel} value={meat} onChange={(e) => { setMeat(e.target.value); setPage(0); }}>
            <option value="">{t("filterMeat")}: {t("all")}</option>
            {Object.keys(MEATS).map((k) => <option key={k} value={k}>{meatName(k, lang)}</option>)}
          </select>
          <select className={sel} value={spice} onChange={(e) => { setSpice(parseInt(e.target.value, 10)); setPage(0); }}>
            <option value={-1}>{t("filterSpice")}: {t("all")}</option>
            {SPICE_LEVELS.map((s) => <option key={s.key} value={s.key}>{lang === "fa" ? s.fa : lang === "ar" ? s.ar : s.en} {"🌶".repeat(s.key)}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={() => { setVegOnly(!vegOnly); setPage(0); }} className={`btn-press flex-1 rounded-xl border text-xs font-bold py-2 ${vegOnly ? "border-herb bg-herb/10 text-herb" : "border-line bg-bg2 text-mut"}`}>{t("vegOnly")}</button>
            <button onClick={() => { setVeganOnly(!veganOnly); setPage(0); }} className={`btn-press flex-1 rounded-xl border text-xs font-bold py-2 ${veganOnly ? "border-teal bg-teal/10 text-teal" : "border-line bg-bg2 text-mut"}`}>{t("veganOnly")}</button>
          </div>
        </div>
        {hasFilters && (
          <button onClick={() => { setQ(""); setCountry(""); setCat(""); setDiff(""); setMeat(""); setSpice(-1); setVegOnly(false); setVeganOnly(false); setPage(0); }}
            className="mt-3 text-xs font-bold text-chili hover:underline">✕ {t("clear") || "Clear filters"}</button>
        )}
      </div>

      <div className="text-sm text-mut mb-4">{t("showing", { a: foods.length ? cur * PAGE_SIZE + 1 : 0, b: Math.min(foods.length, (cur + 1) * PAGE_SIZE), c: foods.length })}</div>

      {slice.length === 0 ? (
        <EmptyState text={t("noResults")} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {slice.map((f, i) => (
            <Reveal key={f.id} delay={(i % 8) * 40}>
              <button onClick={() => setDetail(f)} className="card-hover w-full text-start bg-panel border border-line rounded-2xl p-3.5 group">
                <FoodTile food={f} size="md" className="w-full h-28 text-5xl mb-2.5 group-hover:scale-[1.02]" />
                <div className="font-semibold text-sm leading-snug">{lang === "fa" ? f.fa : lang === "ar" ? f.ar : f.en}</div>
                <div className="text-xs text-mut mt-1 flex items-center gap-1.5">
                  {getCountry(f.country)?.flag} {countryName(f.country, lang)}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Chip tone={f.diff === "easy" ? "herb" : f.diff === "impossible" ? "chili" : "line"} className="text-[10px]">{t(f.diff)}</Chip>
                  {f.ings.slice(0, 2).map((ing) => <Chip key={ing} className="text-[10px]">{ingredientName(ing, lang)}</Chip>)}
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="btn-press border border-line rounded-xl px-4 py-2 text-sm disabled:opacity-30">{t("prev")}</button>
          <span className="text-sm text-mut font-bold">{t("page")} {cur + 1} / {pages}</span>
          <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn-press border border-line rounded-xl px-4 py-2 text-sm disabled:opacity-30">{t("next")}</button>
        </div>
      )}

      {/* food detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? (lang === "fa" ? detail.fa : lang === "ar" ? detail.ar : detail.en) : ""} wide>
        {detail && (
          <div className="grid lg:grid-cols-[auto_1fr] gap-6">
            <div className="flex flex-col items-center gap-3">
              <FoodTile food={detail} size="hero" className="w-56 h-48 text-8xl" />
              <Chip tone="saffron">{t(detail.diff)}</Chip>
            </div>
            <div>
              <FoodInfoCard food={detail} />
              <div className="mt-4">
                <div className="text-dim text-xs font-bold uppercase tracking-widest mb-2">{t("ingredientsLbl")} — {t("usedIn", { n: "" }).replace(": ", "")}</div>
                <div className="flex flex-wrap gap-2">
                  {detail.ings.map((k) => (
                    <button key={k} onClick={() => setIngKey(k)} className="btn-press text-sm bg-saffron/10 border border-saffron/40 text-saffron rounded-xl px-3 py-1.5 font-medium">
                      {ingredientName(k, lang)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => nav({ page: "country", param: detail.country })} className="btn-press text-sm border border-line rounded-xl px-3 py-1.5 text-mut hover:text-ink">
                  {getCountry(detail.country)?.flag} {t("exploreFoods", { c: countryName(detail.country, lang) })}
                </button>
                <button onClick={() => nav({ page: "setup", param: `country:${detail.country}` })} className="btn-press text-sm bg-herb/10 border border-herb/40 text-herb rounded-xl px-3 py-1.5 font-bold">
                  ▶ {t("startChallenge", { c: countryName(detail.country, lang) })}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ingredient detail */}
      <Modal open={!!ingKey} onClose={() => setIngKey(null)} title={ingKey ? ingredientName(ingKey, lang) : ""}>
        {ingKey && (() => {
          const info = INGREDIENTS[ingKey];
          const used = foodsOfIngredient(ingKey);
          return (
            <div>
              <div className="bg-bg2 border border-line rounded-2xl p-4 mb-4">
                <div className="font-display font-bold text-xl">{info?.en}</div>
                {info?.fa && <div className="text-mut text-sm mt-0.5" dir="rtl">{info.fa}</div>}
                {info?.ar && <div className="text-mut text-sm mt-0.5" dir="rtl">{info.ar}</div>}
                <div className="text-xs text-dim mt-2">{t("usedIn", { n: used.length })}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pe-1">
                {used.map((f) => (
                  <button key={f.id} onClick={() => { setDetail(f); setIngKey(null); }} className="btn-press flex items-center gap-2.5 bg-panel border border-line rounded-xl px-3 py-2 text-start text-sm">
                    <span className="text-xl" aria-hidden="true">{f.emoji}</span>
                    <span className="truncate font-medium">{lang === "fa" ? f.fa : lang === "ar" ? f.ar : f.en}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
