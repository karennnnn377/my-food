import { useMemo, useState } from "react";
import type { Profile } from "../data/types";
import { useI18n } from "../lib/i18n";
import { getLeaderboard } from "../lib/storage";
import { ACHIEVEMENTS, levelFromXp, xpForLevel } from "../lib/engine";
import { DB, countryName, getFood, foodName } from "../lib/data";
import { todayKey } from "../lib/calendar";
import { Bar, Btn, Chip, CountUp, FoodTile, Icon, Reveal, SectionHead, StatBox } from "../components/ui";
import { saveProfile } from "../lib/storage";
import { sfx } from "../lib/sound";
import type { Route } from "./home";

type Tab = "global" | "daily" | "weekly" | "monthly" | "country";

export function LeaderboardPage({ profile }: { profile: Profile }) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("global");
  const [country, setCountry] = useState("iran");
  const db = DB();

  const entries = useMemo(
    () => getLeaderboard(tab, { country: tab === "country" ? country : undefined, playerName: profile.name, dateKey: todayKey() }),
    [tab, country, profile.name]);

  const tabs: { k: Tab; icon: string }[] = [
    { k: "global", icon: "globe" }, { k: "daily", icon: "calendar" }, { k: "weekly", icon: "clock" },
    { k: "monthly", icon: "star" }, { k: "country", icon: "medal" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SectionHead kicker={t("demoNote")} title={t("leaderboard")} />

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map(({ k, icon }) => (
          <button key={k} onClick={() => setTab(k)}
            className={`btn-press flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${tab === k ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-panel text-mut"}`}>
            <Icon name={icon} className="w-4 h-4" /> {t(k === "country" ? "lbCountry" : k === "global" ? "lbGlobal" : k === "daily" ? "lbDaily" : k === "weekly" ? "lbWeekly" : "lbMonthly")}
          </button>
        ))}
      </div>

      {tab === "country" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {db.countries.filter((c) => (db.byCountry.get(c.id)?.length ?? 0) > 0).slice(0, 40).map((c) => (
            <button key={c.id} onClick={() => setCountry(c.id)}
              className={`btn-press shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold ${country === c.id ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-panel text-mut"}`}>
              <span aria-hidden="true">{c.flag}</span> {lang === "fa" ? c.fa : lang === "ar" ? c.ar : c.en}
            </button>
          ))}
        </div>
      )}

      <div className="bg-panel border border-line rounded-3xl overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_80px] sm:grid-cols-[56px_1fr_90px_70px_80px_80px] gap-2 px-4 py-3 border-b border-line text-[11px] font-bold uppercase tracking-wider text-dim">
          <span>{t("rank")}</span><span>{t("player")}</span><span className="text-end">{t("score")}</span>
          <span className="hidden sm:block text-end">{t("level")}</span>
          <span className="hidden sm:block text-end">{t("streakCol")}</span>
          <span className="hidden sm:block text-end">{t("correctCol")}</span>
        </div>
        {entries.map((e) => (
          <div key={`${e.name}-${e.rank}`} className={`grid grid-cols-[44px_1fr_80px] sm:grid-cols-[56px_1fr_90px_70px_80px_80px] gap-2 items-center px-4 py-3 border-b border-line/50 last:border-0 ${e.you ? "bg-saffron/10 border-s-2 border-s-saffron" : ""}`}>
            <span className={`font-display font-extrabold text-lg ${e.rank === 1 ? "text-saffron" : e.rank === 2 ? "text-ink" : e.rank === 3 ? "text-chili" : "text-dim"}`}>
              {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}
            </span>
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0" aria-hidden="true">{e.flag}</span>
              <span className="truncate font-semibold">{e.name}</span>
              {e.you && <Chip tone="saffron" className="shrink-0">{t("you")}</Chip>}
            </span>
            <span className="text-end font-display font-extrabold text-saffron">{e.score.toLocaleString()}</span>
            <span className="hidden sm:block text-end text-mut font-bold">{e.level}</span>
            <span className="hidden sm:block text-end text-mut font-bold">🔥{e.streak}</span>
            <span className="hidden sm:block text-end text-mut font-bold">{e.correct}</span>
          </div>
        ))}
      </div>
      {tab === "country" && <p className="text-sm text-mut mt-4">{t("chooseCountryLb")}</p>}
    </div>
  );
}

export function ProfilePage({ profile, onUpdate, nav }: { profile: Profile; onUpdate: (p: Profile) => void; nav: (r: Route) => void }) {
  const { t, lang, L } = useI18n();
  const [name, setName] = useState(profile.name);
  const lvl = levelFromXp(profile.xp);
  const pct = Math.round((lvl.into / lvl.need) * 100);

  const favCountry = useMemo(() => {
    const entries = Object.entries(profile.countryWins).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0][0] : null;
  }, [profile.countryWins]);
  const favFood = useMemo(() => {
    const entries = Object.entries(profile.foodWins).sort((a, b) => b[1] - a[1]);
    return entries.length ? getFood(entries[0][0]) : null;
  }, [profile.foodWins]);
  const totalAns = profile.correct + profile.wrong;
  const acc = totalAns ? Math.round((profile.correct / totalAns) * 100) : 0;
  const dailyStreakDays = Object.keys(profile.dailyDone).length;

  const saveName = () => {
    const p = { ...profile, name: name.trim() || "Traveler" };
    onUpdate(p); saveProfile(p); sfx.play("correct");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SectionHead kicker={`${t("achievementsUnlocked", { a: profile.unlocked.length, b: ACHIEVEMENTS.length })}`} title={t("playerProfile")} />

      {/* identity card */}
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-panel to-bg2 p-6 mb-6">
          <span className="absolute -top-6 -end-2 text-[150px] opacity-[0.06]" aria-hidden="true">👨‍🍳</span>
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-saffron/15 border border-saffron/40 flex items-center justify-center text-4xl" aria-hidden="true">
              {lvl.level >= 25 ? "👑" : lvl.level >= 10 ? "🧑‍🍳" : "🍳"}
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} aria-label={t("username")}
                  className="bg-transparent font-display font-extrabold text-2xl focus:outline-none border-b border-transparent focus:border-saffron max-w-[240px]" />
                <button onClick={saveName} className="btn-press border border-line rounded-lg p-1.5 text-mut hover:text-ink" aria-label={t("saveName")}>
                  <Icon name="edit" className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Chip tone="saffron">{t("level")} {lvl.level}</Chip>
                <Chip>{t("totalXp")}: {profile.xp.toLocaleString()}</Chip>
                <Chip tone="teal">{t("dailyStreakLbl")}: {t("daysPlayed", { n: dailyStreakDays })}</Chip>
              </div>
              <div className="mt-3">
                <Bar pct={pct} tone="saffron" striped />
                <div className="text-xs text-mut mt-1.5">{t("toNext", { n: (lvl.need - lvl.into).toLocaleString() })}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-4xl text-saffron"><CountUp to={profile.bestScore} /></div>
              <div className="text-xs text-mut mt-1">{t("best")} {t("score")}</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatBox label={t("gamesPlayed")} value={profile.games} icon="play" tone="saffron" />
        <StatBox label={t("correctAns")} value={profile.correct} icon="check" tone="herb" />
        <StatBox label={t("accuracy")} value={`${acc}%`} icon="spark" tone="teal" />
        <StatBox label={t("highestStreakLbl")} value={`🔥 ${profile.bestStreak}`} icon="bolt" tone="chili" />
        <StatBox label={t("bestComboLbl")} value={`×${profile.bestCombo}`} icon="flame" tone="chili" />
        <StatBox label={t("timeattack")} value={profile.timeAttackBest.toLocaleString()} icon="clock" tone="teal" />
        <StatBox label={t("dailyChallenge")} value={profile.dailyCompleted} icon="calendar" tone="saffron" />
        <StatBox label={t("impossible")} value={profile.impossibleCorrect} icon="skull" tone="chili" />
      </div>

      {/* favorites */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-panel border border-line rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-dim mb-3">{t("favoriteCountry")}</div>
          {favCountry ? (
            <button onClick={() => nav({ page: "country", param: favCountry })} className="btn-press flex items-center gap-4 w-full text-start">
              <span className="text-5xl" aria-hidden="true">{DB().countryById.get(favCountry)?.flag}</span>
              <div>
                <div className="font-display font-bold text-xl">{countryName(favCountry, lang)}</div>
                <div className="text-sm text-mut">{t("correctAns")}: {profile.countryWins[favCountry]}</div>
              </div>
            </button>
          ) : <p className="text-mut text-sm">{t("notYet")}</p>}
        </div>
        <div className="bg-panel border border-line rounded-2xl p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-dim mb-3">{t("favoriteFood")}</div>
          {favFood ? (
            <div className="flex items-center gap-4">
              <FoodTile food={favFood} size="md" />
              <div>
                <div className="font-display font-bold text-xl">{foodName(favFood, lang)}</div>
                <div className="text-sm text-mut">{countryName(favFood.country, lang)} · {t("correctAns")}: {profile.foodWins[favFood.id]}</div>
              </div>
            </div>
          ) : <p className="text-mut text-sm">{t("notYet")}</p>}
        </div>
      </div>

      {/* achievements */}
      <SectionHead title={t("badges")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a, i) => {
          const got = profile.unlocked.includes(a.id);
          return (
            <Reveal key={a.id} delay={(i % 6) * 50}>
              <div className={`rounded-2xl border p-4 h-full card-hover relative overflow-hidden ${got ? "border-saffron/50 bg-saffron/5" : "border-line bg-panel opacity-70"}`}>
                {!got && <span className="absolute top-3 end-3 text-dim"><Icon name="lock" className="w-4 h-4" /></span>}
                <div className={`text-3xl mb-2 ${got ? "" : "grayscale opacity-50"}`} aria-hidden="true">{a.icon}</div>
                <div className={`font-display font-bold ${got ? "text-saffron" : ""}`}>{L(a.name)}</div>
                <div className="text-xs text-mut mt-1 leading-relaxed">{L(a.desc)}</div>
                {got && <Chip tone="herb" className="mt-2">✓</Chip>}
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
