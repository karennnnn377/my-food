import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameConfig, GameResult, Profile, Settings } from "./data/types";
import { I18nProvider, useI18n } from "./lib/i18n";
import { loadProfile, saveProfile, loadSettings, saveSettings, recordResult, getLeaderboard } from "./lib/storage";
import { applyResult, buildSession, dailySession, levelFromXp, ACHIEVEMENTS } from "./lib/engine";
import { todayKey, formatPersian, formatGregorian, formatPersianLong, toFaDigits } from "./lib/calendar";
import { sfx } from "./lib/sound";
import { GameScreen, ResultScreen } from "./components/game";
import { HomePage, SetupPage } from "./pages/home";
import type { Route } from "./pages/home";
import { LibraryPage } from "./pages/library";
import { CountriesPage, CountryPage } from "./pages/countries";
import { LeaderboardPage, ProfilePage } from "./pages/boards";
import { SettingsPage, AdminPage } from "./pages/settings-admin";
import { Btn, Chip, CountUp, Icon, Reveal, SectionHead } from "./components/ui";
import { STATS } from "./lib/data";

export default function App() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  return (
    <I18nProvider initialLang={settings.lang}>
      <Shell settings={settings} setSettings={setSettings} />
    </I18nProvider>
  );
}

function Shell({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) {
  const { t, lang, setLang, L } = useI18n();
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [unlockedMeta, setUnlockedMeta] = useState<{ icon: string; name: string }[]>([]);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [gameId, setGameId] = useState(0);
  const toastId = useRef(0);

  const nav = useCallback((r: Route) => { setRoute(r); window.scrollTo({ top: 0 }); }, []);
  const toast = useCallback((msg: string) => {
    const id = ++toastId.current;
    setToasts((old) => [...old.slice(-2), { id, msg }]);
    setTimeout(() => setToasts((old) => old.filter((x) => x.id !== id)), 3800);
  }, []);

  // persist settings + apply theme / sound / animation prefs
  useEffect(() => {
    saveSettings(settings);
    document.documentElement.classList.toggle("light", settings.theme === "light");
    document.documentElement.classList.toggle("reduce-anim", !settings.animations);
    sfx.enabled = settings.sound;
    sfx.setMusic(settings.music);
    setLang(settings.lang);
  }, [settings, setLang]);

  // offline awareness
  useEffect(() => {
    const off = () => { setOnline(false); toast(t("offlineMsg")); };
    const on = () => setOnline(true);
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on); };
  }, [toast, t]);

  const updateSettings = (s: Settings) => setSettings(s);
  const saveProf = (p: Profile) => { setProfile(p); saveProfile(p); };

  // ---- coins + free hints ----
  const spendCoins = useCallback((n: number): boolean => {
    let ok = false;
    setProfile((p) => {
      if (p.coins < n) return p;
      ok = true;
      const np = { ...p, coins: p.coins - n };
      saveProfile(np);
      return np;
    });
    return ok;
  }, []);
  const useFreeHint = useCallback((): boolean => {
    let ok = false;
    setProfile((p) => {
      if (p.freeHintsLeft <= 0) return p;
      ok = true;
      const np = { ...p, freeHintsLeft: p.freeHintsLeft - 1 };
      saveProfile(np);
      return np;
    });
    return ok;
  }, []);
  // reset the 3 daily free hints each new day
  useEffect(() => {
    const k = todayKey();
    setProfile((p) => {
      if (p.freeHintsDate === k) return p;
      const np = { ...p, freeHintsDate: k, freeHintsLeft: 3 };
      saveProfile(np);
      return np;
    });
  }, []);

  const startGame = useCallback((c: GameConfig) => {
    setCfg(c); setResult(null);
    setGameId((g) => g + 1);
    setRoute({ page: "game" }); window.scrollTo({ top: 0 });
  }, []);

  const onGameDone = useCallback((r: GameResult) => {
    const { profile: np, newUnlocked, levelBefore, coinsEarned, newlyDiscovered } = applyResult(profile, r, r.hintsUsed ?? 0);
    if (r.mode === "daily") {
      np.dailyCompleted += 1;
      np.dailyDone[todayKey()] = { score: r.score, correct: r.correct, total: r.total };
    }
    saveProfile(np); setProfile(np);
    recordResult(r, todayKey());
    const newLevel = levelFromXp(np.xp).level;
    if (newLevel > levelBefore) { sfx.play("level"); toast(`${t("levelUpMsg")} ${t("level")} ${newLevel} ⭐`); }
    if (newlyDiscovered.length > 0) toast(`${t("newDiscovery")} (+${newlyDiscovered.length})`);
    if (newUnlocked.length) {
      sfx.play("achieve");
      setUnlockedMeta(newUnlocked.map((id) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        return { icon: a?.icon ?? "🏆", name: a ? L(a.name) : id };
      }));
    } else setUnlockedMeta([]);
    setResult({ ...r, discoveries: newlyDiscovered.length, coinsEarned });
    setRoute({ page: "results" }); window.scrollTo({ top: 0 });
  }, [profile, toast, t, L]);

  const page = renderPage();

  function renderPage() {
    switch (route.page) {
      case "home": return <HomePage nav={nav} profile={profile} />;
      case "setup": return <SetupPage mode={route.param ?? "classic"} nav={nav} onStart={startGame} profile={profile} />;
      case "game":
        if (!cfg) { setTimeout(() => nav({ page: "home" }), 0); return null; }
        return <GameView key={gameId} cfg={cfg} onDone={onGameDone} onQuit={() => nav({ page: "home" })}
          coins={profile.coins} onSpendCoins={spendCoins} onUseFreeHint={useFreeHint} freeHints={profile.freeHintsLeft} />;
      case "results":
        if (!result) { setTimeout(() => nav({ page: "home" }), 0); return null; }
        return <ResultScreen result={result} unlocked={unlockedMeta} levelNow={levelFromXp(profile.xp).level}
          onPlayAgain={() => cfg && startGame(cfg)} onHome={() => nav({ page: "home" })} />;
      case "daily": return <DailyPage profile={profile} nav={nav} onStart={() => startGame({ mode: "daily", diff: "mixed", questions: 10, lives: 3 })} calendar={settings.calendar} />;
      case "library": return <LibraryPage nav={nav} initialQuery={route.param ?? ""} />;
      case "countries": return <CountriesPage nav={nav} />;
      case "country": return <CountryPage id={route.param ?? "iran"} nav={nav} />;
      case "leaderboard": return <LeaderboardPage profile={profile} />;
      case "profile": return <ProfilePage profile={profile} onUpdate={saveProf} nav={nav} />;
      case "settings": return <SettingsPage settings={settings} onChange={updateSettings} profile={profile} onSaveProfile={saveProf} />;
      case "admin": return <AdminPage notify={toast} />;
      default: return <HomePage nav={nav} profile={profile} />;
    }
  }

  const links: { page: string; label: string; icon: string }[] = [
    { page: "setup:classic", label: t("play"), icon: "play" },
    { page: "daily", label: t("dailyNav"), icon: "calendar" },
    { page: "library", label: t("collection"), icon: "book" },
    { page: "countries", label: t("countries"), icon: "globe" },
    { page: "leaderboard", label: t("leaderboard"), icon: "trophy" },
    { page: "profile", label: t("profile"), icon: "users" },
    { page: "settings", label: t("settings"), icon: "gear" },
    { page: "admin", label: t("admin"), icon: "lock" },
  ];
  const active = route.page === "setup" ? "setup:classic" : route.page;

  return (
    <div className="app-bg grain min-h-screen text-ink">
      {/* top nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => nav({ page: "home" })} className="btn-press flex items-center gap-2.5 shrink-0" aria-label={t("brand")}>
            <span className="w-10 h-10 rounded-xl bg-saffron flex items-center justify-center text-xl shadow-[0_6px_18px_-6px_rgba(255,138,0,0.7)]" aria-hidden="true">🍽️</span>
            <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight hidden sm:block whitespace-nowrap">
              <span className="text-saffron">{t("brand").split(" ")[0]}</span> {t("brand").split(" ").slice(1).join(" ")}
            </span>
          </button>
          <span className="hidden lg:flex items-center gap-1 text-saffron/80 font-bold text-sm shrink-0" title={t("coinsLbl")}>
            💰 {profile.coins.toLocaleString()}
          </span>

          <nav className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-none px-1" aria-label="Main">
            {links.map((l) => {
              const p = l.page.split(":")[0];
              const isAct = active === l.page || (p !== "setup" && active === p);
              return (
                <button key={l.page} onClick={() => nav({ page: p, param: l.page.includes(":") ? l.page.split(":")[1] : undefined })}
                  className={`btn-press shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${isAct ? "bg-saffron/15 text-saffron" : "text-mut hover:text-ink"}`}>
                  <Icon name={l.icon} className="w-4 h-4" /><span className="hidden md:inline">{l.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:block relative">
              <Icon name="search" className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-dim" />
              <input
                onKeyDown={(e) => { if (e.key === "Enter") nav({ page: "library", param: (e.target as HTMLInputElement).value }); }}
                placeholder={t("searchPh")}
                className="w-52 bg-panel border border-line rounded-xl ps-9 pe-3 py-2 text-sm text-ink placeholder:text-dim focus:outline-2 focus:outline-saffron" />
            </div>
            <div className="flex rounded-xl border border-line overflow-hidden">
              {(["en", "fa", "ar"] as const).map((c) => (
                <button key={c} onClick={() => updateSettings({ ...settings, lang: c })}
                  className={`px-2.5 py-2 text-xs font-bold ${settings.lang === c ? "bg-saffron text-[#231203]" : "text-mut hover:text-ink"}`}>
                  {c === "en" ? "EN" : c === "fa" ? "فا" : "ع"}
                </button>
              ))}
            </div>
            <button onClick={() => updateSettings({ ...settings, theme: settings.theme === "dark" ? "light" : "dark" })}
              className="btn-press p-2 rounded-xl border border-line text-mut hover:text-ink" aria-label={t("themeLbl")}>
              <Icon name={settings.theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {!online && (
        <div className="bg-chili/15 border-b border-chili/40 text-chili text-sm text-center py-2 px-4 font-semibold">
          ⚡ {t("offlineMsg")}
        </div>
      )}

      <main className="page-enter" key={route.page + (route.param ?? "")}>{page}</main>

      {/* footer */}
      <footer className="border-t border-line mt-10">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-extrabold text-xl">🍲 Food<span className="text-saffron">Guess</span></div>
            <p className="text-mut text-sm mt-2 leading-relaxed">{t("tagline")}</p>
            <p className="text-dim text-xs mt-2" dir="rtl">غذا را حدس بزن؛ دنیا را کشف کن. · خمّن الطعام، اكتشف العالم</p>
          </div>
          <div className="text-sm">
            <div className="font-bold mb-2.5">{t("library")}</div>
            <div className="grid grid-cols-2 gap-1.5 text-mut">
              <button onClick={() => nav({ page: "library" })} className="text-start hover:text-saffron btn-press">{t("foodDetails")}</button>
              <button onClick={() => nav({ page: "countries" })} className="text-start hover:text-saffron btn-press">{t("countries")}</button>
              <button onClick={() => nav({ page: "country", param: "iran" })} className="text-start hover:text-saffron btn-press">🇮🇷 {t("iranianFoods")}</button>
              <button onClick={() => nav({ page: "leaderboard" })} className="text-start hover:text-saffron btn-press">{t("leaderboard")}</button>
              <button onClick={() => nav({ page: "profile" })} className="text-start hover:text-saffron btn-press">{t("profile")}</button>
              <button onClick={() => nav({ page: "admin" })} className="text-start hover:text-saffron btn-press">{t("admin")}</button>
            </div>
          </div>
          <div className="text-sm text-mut">
            <div className="font-bold text-ink mb-2.5">FoodGuess DB</div>
            <div className="flex flex-wrap gap-2">
              <Chip>{STATS().foods} {t("foodsLbl")}</Chip>
              <Chip>{STATS().countries} {t("countriesLbl")}</Chip>
              <Chip>{STATS().iranFoods}+ 🇮🇷</Chip>
            </div>
            <p className="text-xs text-dim mt-3 leading-relaxed">{t("adminNote")}</p>
          </div>
        </div>
      </footer>

      {/* mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-bg/95 backdrop-blur-md flex justify-around py-2" aria-label="Mobile">
        {[
          { p: "home", i: "home" }, { p: "setup", i: "play" }, { p: "daily", i: "calendar" },
          { p: "library", i: "book" }, { p: "profile", i: "users" },
        ].map((b) => (
          <button key={b.p} onClick={() => nav({ page: b.p, param: b.p === "setup" ? "classic" : undefined })}
            className={`btn-press flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-bold ${active === b.p || (b.p === "setup" && active === "setup") ? "text-saffron" : "text-mut"}`}>
            <Icon name={b.i} className="w-5 h-5" />
          </button>
        ))}
      </nav>
      <div className="h-16 sm:hidden" />

      {/* toasts */}
      <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-[95] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((x) => (
          <div key={x.id} className="anim-pop bg-panel2 border border-saffron/50 text-ink text-sm font-semibold rounded-2xl px-5 py-3 shadow-2xl max-w-md text-center">
            {x.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

interface GameViewProps {
  cfg: GameConfig; onDone: (r: GameResult) => void; onQuit: () => void;
  coins: number; onSpendCoins: (n: number) => boolean; onUseFreeHint: () => boolean; freeHints: number;
}
function GameView({ cfg, onDone, onQuit, coins, onSpendCoins, onUseFreeHint, freeHints }: GameViewProps) {
  const initial = useMemo(() => {
    if (cfg.mode === "daily") return dailySession(todayKey());
    if (cfg.mode === "timeattack" || cfg.mode === "endless") return undefined;
    if (cfg.mode === "mystery") return buildSession({ diff: cfg.diff, country: cfg.country, onlyType: "foodname", count: cfg.questions });
    return buildSession({ diff: cfg.diff, country: cfg.country, city: cfg.city, count: cfg.questions });
  }, [cfg]);
  return <GameScreen cfg={cfg} initial={initial} onDone={onDone} onQuit={onQuit}
    coins={coins} onSpendCoins={onSpendCoins} onUseFreeHint={onUseFreeHint} freeHints={freeHints} />;
}

/* ================= DAILY CHALLENGE ================= */
function DailyPage({ profile, nav, onStart, calendar }: {
  profile: Profile; nav: (r: Route) => void; onStart: () => void; calendar: "gregorian" | "persian";
}) {
  const { t, lang } = useI18n();
  const now = new Date();
  const key = todayKey();
  const done = profile.dailyDone[key];
  const dailyLb = useMemo(() => getLeaderboard("daily", { playerName: profile.name, dateKey: key }).slice(0, 8), [profile.name, key]);

  const primaryDate = calendar === "persian"
    ? (lang === "fa" ? toFaDigits(formatPersian(now)) : formatPersian(now))
    : formatGregorian(now, lang);
  const secondaryDate = calendar === "persian"
    ? formatGregorian(now, lang)
    : formatPersianLong(now, lang === "ar" ? "en" : lang);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => nav({ page: "home" })} className="btn-press flex items-center gap-1.5 text-sm text-mut hover:text-ink mb-6 border border-line rounded-lg px-3 py-1.5">
        <Icon name="chevL" className="w-4 h-4 rtl:rotate-180" /> {t("back")}
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-teal/40 bg-gradient-to-br from-teal/15 via-panel to-panel p-6 sm:p-9 mb-8">
        <span className="absolute -top-8 -end-4 text-[170px] opacity-[0.07] rotate-12" aria-hidden="true">📅</span>
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <Chip tone="teal" className="mb-3"><Icon name="calendar" className="w-3.5 h-3.5" /> {t("dailyChallenge")}</Chip>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight">{t("dailyChallenge")}</h1>
            <p className="text-mut mt-2.5 max-w-lg">{t("dailyD")}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-4 text-sm">
              <span className="flex items-center gap-2"><Icon name="clock" className="w-4 h-4 text-teal" /><span className="font-display font-bold text-lg">{primaryDate}</span></span>
              <span className="text-mut" dir={calendar === "persian" && lang !== "fa" ? "ltr" : undefined}>{secondaryDate}</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-5">
              <div><div className="font-display font-extrabold text-2xl text-saffron">10</div><div className="text-xs text-mut">{t("questionsCount")}</div></div>
              <div><div className="font-display font-extrabold text-2xl text-herb">{done ? `${done.correct}/${done.total}` : "—"}</div><div className="text-xs text-mut">{t("correctAns")}</div></div>
              <div><div className="font-display font-extrabold text-2xl text-teal">{done ? done.score.toLocaleString() : "—"}</div><div className="text-xs text-mut">{t("score")}</div></div>
              <div><div className="font-display font-extrabold text-2xl">{profile.dailyCompleted}</div><div className="text-xs text-mut">{t("dailyStreakLbl")}</div></div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {done ? (
                <>
                  <Chip tone="herb"><Icon name="check" className="w-3.5 h-3.5" strokeWidth={2.6} /> {t("completedLbl")}</Chip>
                  <span className="text-sm text-mut">{t("dailyDoneMsg")}</span>
                </>
              ) : (
                <Btn size="lg" variant="teal" onClick={() => { sfx.play("start"); onStart(); }}>
                  <Icon name="play" className="w-4 h-4" /> {t("playDaily")}
                </Btn>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center gap-2">
            <span className="font-display font-extrabold text-6xl text-teal/90" dir="ltr">{calendar === "persian" ? formatPersian(now) : now.getDate()}</span>
            <span className="text-mut text-sm">{calendar === "persian" ? t("persianDate") : t("gregorianDate")}</span>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="bg-panel border border-line rounded-3xl p-5">
          <SectionHead title={`${t("lbDaily")} — ${t("today")}`} />
          <div className="space-y-2">
            {dailyLb.map((e) => (
              <div key={e.rank} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${e.you ? "bg-saffron/10 border border-saffron/40" : "bg-bg2 border border-line/60"}`}>
                <span className="font-display font-extrabold w-8 text-center">{e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}</span>
                <span aria-hidden="true">{e.flag}</span>
                <span className="font-semibold flex-1 truncate">{e.name}{e.you && <Chip tone="saffron" className="ms-2">{t("you")}</Chip>}</span>
                <span className="font-display font-extrabold text-saffron">{e.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
