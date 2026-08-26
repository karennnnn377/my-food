import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Difficulty, GameConfig, GameMode, Profile } from "../data/types";
import { useI18n } from "../lib/i18n";
import { DB, STATS, foodsOfCountry, foodName, countryName, foodMatchesQuery } from "../lib/data";
import { levelFromXp, getScoring } from "../lib/engine";
import { todayKey, formatPersian, formatGregorian, formatPersianLong } from "../lib/calendar";
import { Btn, Chip, CountUp, FloatingField, FoodTile, Icon, Marquee, OrbitRing, Reveal, Scramble, SectionHead } from "../components/ui";
import { sfx } from "../lib/sound";

export type Route = { page: string; param?: string };

const MODE_EMOJI: Record<string, string> = {
  classic: "🍽️", timeattack: "⏱️", endless: "♾️", country: "🏳️", world: "🌍", daily: "📅",
};

export function HomePage({ nav, profile }: { nav: (r: Route) => void; profile: Profile }) {
  const { t, lang, L } = useI18n();
  const db = DB();
  const stats = STATS();
  const lvl = levelFromXp(profile.xp);
  const dailyDone = profile.dailyDone[todayKey()];

  const marqueeItems = useMemo(() => {
    const foods = [...db.foods];
    const out: { emoji: string; name: string; flag: string }[] = [];
    for (let i = 0; i < foods.length && out.length < 36; i += Math.max(1, Math.floor(foods.length / 36))) {
      const f = foods[i];
      const c = db.countryById.get(f.country);
      out.push({ emoji: f.emoji, name: foodName(f, lang), flag: c?.flag ?? "" });
    }
    return out;
  }, [db, lang]);

  const iranFoods = foodsOfCountry("iran").slice(0, 8);
  const worldPick = useMemo(() => {
    const arr = [...db.foods].filter((f) => f.country !== "iran");
    return [...arr].sort((a, b) => b.en.length - a.en.length).slice(0, 0).length >= 0
      ? shuffleCopy(arr).slice(0, 12) : arr.slice(0, 12);
  }, [db]);

  const greg = formatGregorian(new Date(), lang);
  const pers = formatPersian(new Date());
  const persLong = formatPersianLong(new Date(), lang === "ar" ? "en" : lang);

  return (
    <div className="relative">
      <FloatingField emojis={["🍕", "🍣", "🌮", "🍜", "🥘", "🍲", "🧆", "🍢", "🥟", "🍛", "🫓", "🍨"]} count={16} />

      {/* opening — the game board, not a brochure */}
      <section className="relative max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Chip tone="saffron"><Icon name="globe" className="w-3.5 h-3.5" /> {stats.countries} {t("countriesLbl")}</Chip>
            <Chip tone="teal">{stats.foods} {t("foodsLbl")}</Chip>
            {profile.games > 0 && <Chip tone="herb">{t("welcomeBack", { n: profile.name })}</Chip>}
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight">
            <Scramble text="FoodGuess" />
            <span className="block text-2xl sm:text-4xl mt-3 text-saffron">{t("tagline")}</span>
          </h1>
          <p className="text-mut text-lg mt-5 max-w-xl leading-relaxed">
            {t("howTo1")} {t("howTo2")}
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Btn size="xl" onClick={() => { sfx.play("start"); nav({ page: "setup", param: "classic" }); }}>
              <Icon name="play" className="w-5 h-5" /> {t("play")}
            </Btn>
            <Btn size="xl" variant="dark" onClick={() => nav({ page: "daily" })}>
              <Icon name="calendar" className="w-5 h-5 text-teal" /> {t("dailyChallenge")}
              {dailyDone && <Icon name="check" className="w-4 h-4 text-herb" strokeWidth={2.6} />}
            </Btn>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 text-sm text-mut">
            <span className="flex items-center gap-2"><span className="font-display font-extrabold text-ink text-lg">{lvl.level}</span> {t("level")}</span>
            <span className="flex items-center gap-2"><span className="font-display font-extrabold text-ink text-lg">{profile.bestScore.toLocaleString()}</span> {t("best")} {t("score")}</span>
            <span className="flex items-center gap-2"><span className="font-display font-extrabold text-ink text-lg">🔥 {profile.bestStreak}</span> {t("streak")}</span>
          </div>
        </div>
        <div className="relative flex justify-center py-4 lg:py-0">
          <OrbitRing emojis={["🍕", "🍣", "🌮", "🥘", "🍜", "🫓", "🍢", "🧆", "🍛", "🍨"]} size={320} dur={44} />
        </div>
      </section>

      {/* dish ticker */}
      <div className="relative border-y border-line bg-panel/60 py-3 mb-10">
        <Marquee speed={50}>
          {marqueeItems.map((m, i) => (
            <span key={i} className="flex items-center gap-2 px-5 text-sm text-mut whitespace-nowrap">
              <span aria-hidden="true">{m.emoji}</span>
              <span className="font-medium text-ink/80">{m.name}</span>
              <span aria-hidden="true">{m.flag}</span>
              <span className="text-line2">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* taste the world — photo band */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <Reveal>
          <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden border border-line group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a0c] via-[#1d1207] to-[#0f0a05]" />
            <img
              src="https://image.qwenlm.ai/generated-images/4bd0fd0b-db23-46b8-9dbb-7af93a6b0b97/_result.png"
              alt={t("tasteWorld")}
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-[6000ms] ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17100a]/95 via-transparent to-[#17100a]/40" />
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-saffron mb-2">{stats.countries} {t("countriesLbl")} · {stats.foods} {t("foodsLbl")}</div>
                <h2 className="font-display font-extrabold text-3xl sm:text-5xl leading-none">{t("tasteWorld")}</h2>
              </div>
              <Btn variant="primary" onClick={() => { sfx.play("start"); nav({ page: "setup", param: "world" }); }}>
                <Icon name="globe" className="w-4 h-4" /> {t("worldMode")}
              </Btn>
            </div>
          </div>
        </Reveal>
      </section>

      {/* mode bento */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <SectionHead kicker={t("howTo")} title={t("play")} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(150px,auto)]">
          <ModeCard big title={t("classic")} desc={t("classicD")} emoji="🍽️" tone="saffron" onClick={() => nav({ page: "setup", param: "classic" })} cta={t("play")} />
          <ModeCard title={t("dailyChallenge")} desc={dailyDone ? `${t("completedLbl")} · ${dailyDone.score.toLocaleString()}` : t("dailyD")} emoji="📅" tone="teal" onClick={() => nav({ page: "daily" })} badge={<span className="text-[11px] font-bold text-teal" dir="ltr">{pers} · {greg}</span>} />
          <ModeCard title={t("timeattack")} desc={t("timeattackD")} emoji="⏱️" tone="chili" onClick={() => nav({ page: "setup", param: "timeattack" })} />
          <ModeCard title={t("endless")} desc={t("endlessD")} emoji="♾️" tone="herb" onClick={() => nav({ page: "setup", param: "endless" })} />
          <ModeCard title={t("countryMode")} desc={t("countryModeD")} emoji="🏳️" tone="saffron" onClick={() => nav({ page: "setup", param: "country" })} />
          <ModeCard title={t("worldMode")} desc={t("worldModeD")} emoji="🌍" tone="teal" onClick={() => nav({ page: "setup", param: "world" })} />
          <ModeCard title={t("library")} desc={`${stats.foods} ${t("foodsLbl")} · ${stats.ingredients} ${t("ingredientsLbl2")}`} emoji="📚" tone="herb" onClick={() => nav({ page: "library" })} />
          <ModeCard title={t("countries")} desc={`${stats.countries} · ${stats.iranFoods} 🇮🇷`} emoji="🗺️" tone="chili" onClick={() => nav({ page: "countries" })} />
        </div>
      </section>

      {/* Iran spotlight */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-saffron/30 bg-gradient-to-br from-panel via-panel to-saffron/10 p-6 sm:p-8">
            <div className="absolute -top-10 -end-10 text-[180px] opacity-[0.06] rotate-12" aria-hidden="true">🫖</div>
            <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-saffron mb-2">🇮🇷 {t("iranSpotlight")}</div>
                <h3 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">{t("iranianFoods")}</h3>
                <p className="text-mut mt-3 max-w-lg leading-relaxed">{t("iranSpotD")}</p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <Btn onClick={() => nav({ page: "setup", param: "country:iran" })}><Icon name="play" className="w-4 h-4" /> {t("playIran")}</Btn>
                  <Btn variant="dark" onClick={() => nav({ page: "country", param: "iran" })}><Icon name="book" className="w-4 h-4" /> {t("exploreFoods", { c: lang === "fa" ? "ایران" : lang === "ar" ? "إيران" : "Iran" })}</Btn>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {iranFoods.map((f, i) => (
                  <div key={f.id} className="anim-floaty" style={{ ["--dur" as string]: `${6 + (i % 3)}s`, animationDelay: `${i * 0.3}s` }}>
                    <FoodTile food={f} size="md" flag={false} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* taste the world rail */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <SectionHead kicker={t("tasteWorld")} title={t("worldFoods")} action={<Btn variant="ghost" size="sm" onClick={() => nav({ page: "library" })}>{t("viewAll")} →</Btn>} />
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x" dir="ltr">
          {worldPick.map((f, i) => (
            <Reveal key={f.id} delay={i * 40} className="snap-start shrink-0">
              <button onClick={() => nav({ page: "library", param: f.en })} className="card-hover bg-panel border border-line rounded-2xl p-3 text-start w-[168px]">
                <FoodTile food={f} size="md" className="w-full h-28 text-5xl mb-2.5" />
                <div className="font-semibold text-sm truncate">{foodName(f, lang)}</div>
                <div className="text-xs text-mut mt-0.5 flex items-center gap-1">
                  {DB().countryById.get(f.country)?.flag} {countryName(f.country, lang)}
                </div>
                <div className="mt-2"><Chip tone={f.diff === "easy" ? "herb" : f.diff === "impossible" ? "chili" : "line"}>{t(f.diff)}</Chip></div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* how to play — ticket stubs */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <SectionHead kicker="1 · 2 · 3" title={t("howTo")} />
        <div className="grid md:grid-cols-3 gap-4">
          {[t("howTo1"), t("howTo2"), t("howTo3")].map((step, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="relative bg-panel border border-line rounded-2xl p-5 h-full card-hover overflow-hidden">
                <span className="absolute -top-4 -start-2 font-display font-extrabold text-[90px] text-saffron/10 leading-none" aria-hidden="true">{i + 1}</span>
                <div className="relative">
                  <span className="inline-flex w-9 h-9 rounded-xl bg-saffron text-[#231203] font-display font-extrabold items-center justify-center mb-3">{i + 1}</span>
                  <p className="text-mut leading-relaxed">{step}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          {[
            { l: t("foodsLbl"), v: <CountUp to={stats.foods} />, i: "book" },
            { l: t("countriesLbl"), v: <CountUp to={stats.countries} />, i: "globe" },
            { l: t("questionsAvail"), v: <CountUp to={stats.questions} suffix="+" />, i: "spark" },
            { l: t("iranianFoods"), v: <CountUp to={stats.iranFoods} suffix="+" />, i: "star" },
          ].map((s, i) => (
            <div key={i} className="bg-panel2 border border-line rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <Icon name={s.i} className="w-5 h-5 text-saffron shrink-0" />
              <div><div className="font-display font-extrabold text-xl leading-none">{s.v}</div><div className="text-xs text-mut mt-0.5">{s.l}</div></div>
            </div>
          ))}
        </div>
      </section>
      {MODE_EMOJI && null}
    </div>
  );
}

function shuffleCopy<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function ModeCard({ title, desc, emoji, tone, onClick, cta, badge, big = false }: {
  title: string; desc: string; emoji: string; tone: "saffron" | "chili" | "herb" | "teal";
  onClick: () => void; cta?: string; badge?: ReactNode; big?: boolean;
}) {
  const tones = {
    saffron: "from-saffron/20 hover:border-saffron/60",
    chili: "from-chili/15 hover:border-chili/60",
    herb: "from-herb/15 hover:border-herb/60",
    teal: "from-teal/15 hover:border-teal/60",
  };
  return (
    <button onClick={onClick}
      className={`card-hover relative text-start bg-gradient-to-br to-panel border border-line rounded-3xl p-5 overflow-hidden group ${tones[tone]} ${big ? "sm:col-span-2 lg:row-span-2 flex flex-col justify-between" : ""}`}>
      <span className={`text-4xl inline-block transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${big ? "text-6xl" : ""}`} aria-hidden="true">{emoji}</span>
      <div className={big ? "mt-6" : "mt-3"}>
        <div className={`font-display font-extrabold ${big ? "text-3xl" : "text-xl"} leading-tight`}>{title}</div>
        <p className="text-sm text-mut mt-1.5 leading-relaxed">{desc}</p>
        {badge && <div className="mt-2">{badge}</div>}
        {cta && (
          <span className="inline-flex items-center gap-2 mt-4 font-bold text-saffron text-sm">
            {cta} <Icon name="chevR" className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </span>
        )}
      </div>
    </button>
  );
}

/* ================= SETUP ================= */
export function SetupPage({ mode, nav, onStart, profile }: {
  mode: string; nav: (r: Route) => void; onStart: (cfg: GameConfig) => void; profile: Profile;
}) {
  const { t, lang } = useI18n();
  const [diff, setDiff] = useState<Difficulty | "mixed">("easy");
  const [country, setCountry] = useState("iran");
  const [q, setQ] = useState("");
  const [count, setCount] = useState(20);
  const [lives, setLives] = useState(getScoring().lives);
  const baseMode = (mode.split(":")[0] ?? "classic") as GameMode;
  const presetCountry = mode.includes(":") ? mode.split(":")[1] : undefined;
  const lvl = levelFromXp(profile.xp).level;

  const diffs: { key: Difficulty | "mixed"; req: number; reqLabel: string }[] = [
    { key: "easy", req: 0, reqLabel: "" },
    { key: "medium", req: 0, reqLabel: "" },
    { key: "hard", req: 2, reqLabel: t("level") + " 2" },
    { key: "extreme", req: 3, reqLabel: t("level") + " 3" },
    { key: "impossible", req: 5, reqLabel: t("level") + " 5" },
  ];
  if (baseMode === "classic" || baseMode === "world") diffs.splice(1, 0, { key: "mixed", req: 0, reqLabel: "" });

  const countryList = DB().countries.filter((c) =>
    !q.trim() || [c.en, c.fa, c.ar].join(" ").toLowerCase().includes(q.trim().toLowerCase()));
  const modeKey = baseMode === "country" ? "countryMode" : baseMode === "timeattack" ? "timeattack" : baseMode === "endless" ? "endless" : baseMode === "world" ? "worldMode" : "classic";

  const canStart = baseMode !== "country" || countryList.length > 0;

  const start = () => {
    sfx.play("start");
    const cfg: GameConfig = {
      mode: baseMode,
      diff: baseMode === "endless" || baseMode === "timeattack" ? "mixed" : diff,
      country: baseMode === "country" ? (presetCountry ?? country) : undefined,
      questions: baseMode === "country" ? Math.min(count, 15) : count,
      lives: baseMode === "endless" ? lives : baseMode === "timeattack" ? 99 : lives,
      seconds: baseMode === "timeattack" ? 60 : undefined,
    };
    onStart(cfg);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => nav({ page: "home" })} className="btn-press flex items-center gap-1.5 text-sm text-mut hover:text-ink mb-6 border border-line rounded-lg px-3 py-1.5">
        <Icon name="chevL" className="w-4 h-4 rtl:rotate-180" /> {t("back")}
      </button>
      <h1 className="font-display font-extrabold text-4xl mb-1">{t(modeKey)}</h1>
      <p className="text-mut mb-8">{t(`${modeKey === "countryMode" ? "countryMode" : modeKey}D`)}</p>

      {presetCountry && (
        <div className="mb-6 flex items-center gap-3 bg-panel border border-saffron/40 rounded-2xl px-4 py-3">
          <span className="text-3xl" aria-hidden="true">{DB().countryById.get(presetCountry)?.flag}</span>
          <div>
            <div className="font-display font-bold text-lg">{countryName(presetCountry, lang)}</div>
            <div className="text-xs text-mut">{t("countryModeD")}</div>
          </div>
        </div>
      )}

      {baseMode === "country" && !presetCountry && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-3">{t("chooseCountry")}</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPh")}
            className="w-full bg-panel border border-line rounded-xl px-4 py-3 mb-4 text-ink placeholder:text-dim focus:outline-2 focus:outline-saffron" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pe-1">
            {countryList.map((c) => (
              <button key={c.id} onClick={() => setCountry(c.id)}
                className={`btn-press flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium text-start ${country === c.id ? "border-saffron bg-saffron/10" : "border-line bg-panel hover:border-line2"}`}>
                <span className="text-xl" aria-hidden="true">{c.flag}</span>
                <span className="truncate">{lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(baseMode === "classic") && (
        <div className="mb-8">
          <h2 className="font-display font-bold text-xl mb-3">{t("chooseDifficulty")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {diffs.map((d) => {
              const locked = lvl < d.req;
              const sel = diff === d.key;
              return (
                <button key={d.key} disabled={locked} onClick={() => { setDiff(d.key); sfx.play("click"); }}
                  className={`btn-press relative text-start rounded-2xl border-2 p-4 transition-colors ${sel ? "border-saffron bg-saffron/10" : "border-line bg-panel hover:border-line2"} ${locked ? "opacity-50" : ""}`}>
                  {locked && <span className="absolute top-3 end-3 text-mut"><Icon name="lock" className="w-4 h-4" /></span>}
                  <div className="font-display font-extrabold text-lg capitalize">{t(d.key)}</div>
                  <div className="text-xs text-mut mt-1 leading-relaxed">{locked ? t("unlockAt", { req: d.reqLabel }) : t(`${d.key}D`)}</div>
                  <div className="text-xs font-bold text-saffron mt-2">{getScoring().base[d.key === "mixed" ? "easy" : d.key].toLocaleString()}+ {t("points")}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {baseMode !== "timeattack" && baseMode !== "endless" && (
          <div>
            <h3 className="font-display font-bold mb-2">{t("questionsCount")}: <span className="text-saffron">{count}</span></h3>
            <div className="flex gap-2">
              {[10, 15, 20, 30].map((n) => (
                <button key={n} onClick={() => setCount(n)}
                  className={`btn-press flex-1 rounded-xl border py-2.5 font-bold ${count === n ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-panel text-mut"}`}>{n}</button>
              ))}
            </div>
          </div>
        )}
        {baseMode !== "timeattack" && (
          <div>
            <h3 className="font-display font-bold mb-2">{t("livesCount")}: <span className="text-chili">{"❤".repeat(lives)}</span></h3>
            <div className="flex gap-2">
              {[1, 3, 5].map((n) => (
                <button key={n} onClick={() => setLives(n)}
                  className={`btn-press flex-1 rounded-xl border py-2.5 font-bold ${lives === n ? "border-chili bg-chili/10 text-chili" : "border-line bg-panel text-mut"}`}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Btn size="xl" onClick={start} disabled={!canStart}><Icon name="play" className="w-5 h-5" /> {t("startGame")}</Btn>
        {baseMode === "timeattack" && <Chip tone="chili">60s · {t("timeattackD")}</Chip>}
        {baseMode === "endless" && <Chip tone="herb">{t("endlessD")}</Chip>}
      </div>
    </div>
  );
}

export { foodMatchesQuery };
