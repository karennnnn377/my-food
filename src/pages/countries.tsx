import { useMemo, useState } from "react";
import { useI18n } from "../lib/i18n";
import { DB, foodsOfCountry, countryName, cuisineOf, ingredientName } from "../lib/data";
import { CONTINENTS } from "../data/countries";
import { Chip, EmptyState, FoodTile, Icon, Reveal, SectionHead } from "../components/ui";
import type { Route } from "./home";

export function CountriesPage({ nav }: { nav: (r: Route) => void }) {
  const { t, lang, L } = useI18n();
  const [q, setQ] = useState("");
  const [cont, setCont] = useState("");
  const db = DB();

  const list = useMemo(() => db.countries
    .map((c) => ({ c, foods: foodsOfCountry(c.id) }))
    .filter(({ c }) => !cont || c.continent === cont)
    .filter(({ c }) => !q.trim() || [c.en, c.fa, c.ar, c.cuisine.en].join(" ").toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.foods.length - a.foods.length), [db, q, cont]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionHead kicker={`${db.countries.length} ${t("countriesLbl")}`} title={t("countries")} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Icon name="search" className="w-5 h-5 absolute top-1/2 -translate-y-1/2 start-4 text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPh")}
            className="w-full bg-panel border border-line rounded-2xl ps-12 pe-4 py-3 text-ink placeholder:text-dim focus:outline-2 focus:outline-saffron" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCont("")} className={`btn-press rounded-xl border px-3.5 py-2 text-sm font-bold ${!cont ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-panel text-mut"}`}>{t("all")}</button>
          {Object.entries(CONTINENTS).map(([k, v]) => (
            <button key={k} onClick={() => setCont(k)} className={`btn-press rounded-xl border px-3.5 py-2 text-sm font-bold ${cont === k ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-panel text-mut"}`}>
              {lang === "fa" ? v.fa : lang === "ar" ? v.ar : v.en}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? <EmptyState text={t("noResults")} /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map(({ c, foods }, i) => (
            <Reveal key={c.id} delay={(i % 8) * 40}>
              <button onClick={() => nav({ page: "country", param: c.id })}
                className="card-hover w-full text-start bg-panel border border-line rounded-2xl p-4 group relative overflow-hidden">
                <span className="absolute -top-5 -end-3 text-[76px] opacity-[0.08] group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-300" aria-hidden="true">{c.flag}</span>
                <div className="text-4xl mb-3" aria-hidden="true">{c.flag}</div>
                <div className="font-display font-bold text-lg leading-tight">{lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en}</div>
                <div className="text-xs text-saffron font-semibold mt-1">{lang === "fa" ? c.cuisine.fa : lang === "ar" ? c.cuisine.ar : c.cuisine.en}</div>
                <div className="flex items-center justify-between mt-3">
                  <Chip tone={c.id === "iran" ? "saffron" : "line"}>{t("foodsCount", { n: foods.length })}</Chip>
                  <Icon name="chevR" className="w-4 h-4 text-dim rtl:rotate-180" />
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function CountryPage({ id, nav }: { id: string; nav: (r: Route) => void }) {
  const { t, lang, L } = useI18n();
  const db = DB();
  const country = db.countryById.get(id);
  const foods = foodsOfCountry(id);
  const [page, setPage] = useState(0);
  const PAGE = 18;
  const pages = Math.max(1, Math.ceil(foods.length / PAGE));
  const cur = Math.min(page, pages - 1);

  if (!country) return <div className="max-w-3xl mx-auto px-4 py-16"><EmptyState text={t("noResults")} /></div>;

  const famous = foods.filter((f) => f.diff === "easy");
  const traditional = foods.filter((f) => f.cats.includes("traditional"));
  const regional = foods.filter((f) => f.region && f.region !== "Nationwide");
  const name = lang === "fa" ? country.fa : lang === "ar" ? country.ar : country.en;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <button onClick={() => nav({ page: "countries" })} className="btn-press flex items-center gap-1.5 text-sm text-mut hover:text-ink mb-6 border border-line rounded-lg px-3 py-1.5">
        <Icon name="chevL" className="w-4 h-4 rtl:rotate-180" /> {t("countries")}
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel to-bg2 p-6 sm:p-8 mb-8">
        <span className="absolute -top-8 -end-4 text-[190px] opacity-[0.07] rotate-12 select-none" aria-hidden="true">{country.flag}</span>
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="text-7xl" aria-hidden="true">{country.flag}</span>
          <div className="flex-1 min-w-[220px]">
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl">{name}</h1>
            <div className="text-saffron font-bold mt-1.5">{lang === "fa" ? country.cuisine.fa : lang === "ar" ? country.cuisine.ar : country.cuisine.en}</div>
            {country.note && <p className="text-mut mt-3 max-w-2xl leading-relaxed">{country.note}</p>}
          </div>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => nav({ page: "setup", param: `country:${id}` })}
              className="btn-press bg-saffron text-[#231203] font-bold rounded-xl px-6 py-3.5 flex items-center gap-2 shadow-[0_8px_24px_-8px_rgba(255,138,0,0.55)]">
              <Icon name="play" className="w-4 h-4" /> {t("startChallenge", { c: name })}
            </button>
            <div className="text-center text-xs text-mut">{t("foodsCount", { n: foods.length })} · {lang === "fa" ? CONTINENTS[country.continent].fa : lang === "ar" ? CONTINENTS[country.continent].ar : CONTINENTS[country.continent].en}</div>
          </div>
        </div>
        {(famous.length > 0 || traditional.length > 0 || regional.length > 0) && (
          <div className="relative grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { l: t("famousFoods"), n: famous.length, e: "⭐" },
              { l: t("traditionalFoods"), n: traditional.length, e: "🏺" },
              { l: t("regionalFoods"), n: regional.length, e: "📍" },
            ].map((s, i) => (
              <div key={i} className="bg-black/20 border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{s.e}</span>
                <div><div className="font-display font-extrabold text-xl leading-none">{s.n}</div><div className="text-xs text-mut mt-1">{s.l}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {foods.length === 0 ? (
        <EmptyState text={t("noFoodsYet")} />
      ) : (
        <>
          <SectionHead title={t("foodsCount", { n: foods.length })} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {foods.slice(cur * PAGE, cur * PAGE + PAGE).map((f, i) => (
              <Reveal key={f.id} delay={(i % 6) * 40}>
                <button onClick={() => nav({ page: "library", param: f.en })} className="card-hover w-full text-start bg-panel border border-line rounded-2xl p-3 group">
                  <FoodTile food={f} size="md" className="w-full h-20 text-4xl mb-2" flag={false} />
                  <div className="font-semibold text-xs leading-snug truncate">{lang === "fa" ? f.fa : lang === "ar" ? f.ar : f.en}</div>
                  <div className="text-[10px] text-mut mt-0.5 truncate">{f.region}</div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {f.ings.slice(0, 1).map((k) => <Chip key={k} className="text-[9px] px-1.5 py-0.5">{ingredientName(k, lang)}</Chip>)}
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="btn-press border border-line rounded-xl px-4 py-2 text-sm disabled:opacity-30">{t("prev")}</button>
              <span className="text-sm text-mut font-bold">{t("page")} {cur + 1} / {pages}</span>
              <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="btn-press border border-line rounded-xl px-4 py-2 text-sm disabled:opacity-30">{t("next")}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
