import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnswerLog, Difficulty, Food, GameConfig, GameResult, Question } from "../data/types";
import { useI18n } from "../lib/i18n";
import { getFood, countryName, cuisineOf, ingredientName, meatName, categoryName, getCountry, cityNameOf, cityOf } from "../lib/data";
import { cityName } from "../data/cities";
import { comboFor, pointsFor, nextLiveQuestion, markSeen, getScoring, levelFromXp, HINTS } from "../lib/engine";
import { getRecipe, recipeStepText } from "../lib/recipes";
import { sfx } from "../lib/sound";
import { Bar, Btn, Chip, ComboBadge, CountUp, FoodTile, Hearts, Icon, Reveal } from "./ui";

const PROMPT_KEYS: Record<string, string> = {
  country: "qCountry", cuisine: "qCuisine", ingredient: "qIngredient",
  meat: "qMeat", region: "qRegion", notingredient: "qNotIngredient", foodname: "qFoodName",
  ingfood: "qIngFood", recipe: "qRecipe", city: "qCity",
};

function optionLabel(q: Question, key: string, lang: "en" | "fa" | "ar"): string {
  if (q.custom) {
    const idx = parseInt(key.replace("o", ""), 10);
    const o = q.custom.options[idx];
    return lang === "fa" ? (o.fa ?? o.en) : lang === "ar" ? (o.ar ?? o.en) : o.en;
  }
  switch (q.type) {
    case "country": return countryName(key, lang);
    case "cuisine": return cuisineOf(key, lang);
    case "ingredient": case "notingredient": return ingredientName(key, lang);
    case "meat": return meatName(key, lang);
    case "city": return cityName(key, lang);
    case "foodname": case "ingfood": case "recipe": { const f = getFood(key); return f ? (lang === "fa" ? f.fa : lang === "ar" ? f.ar : f.en) : key; }
    default: return key;
  }
}

export function FoodInfoCard({ food, compact = false }: { food: Food | undefined; compact?: boolean }) {
  const { lang, t, L } = useI18n();
  if (!food) return null;
  const country = getCountry(food.country);
  const name = lang === "fa" ? food.fa : lang === "ar" ? food.ar : food.en;
  const spiceIcons = "🌶️".repeat(food.spice) || "·";
  return (
    <div className={`bg-bg2 border border-line rounded-2xl overflow-hidden ${compact ? "" : ""}`}>
      <div className="flex items-center gap-4 p-4 pb-0">
        <FoodTile food={food} size="md" />
        <div className="min-w-0">
          <div className="font-display font-extrabold text-lg leading-tight truncate">{name}</div>
          <div className="text-sm text-mut mt-0.5">{country?.flag} {countryName(food.country, lang)} · {cuisineOf(food.country, lang)}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {food.cats.slice(0, 3).map((c) => <Chip key={c}>{categoryName(c, lang)}</Chip>)}
            {food.veg && <Chip tone="herb">{t("vegLbl")}</Chip>}
            {food.vegan && <Chip tone="teal">{t("veganLbl")}</Chip>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <div><span className="text-dim text-xs block">{t("regionLbl")}</span><span className="font-medium">{food.region}</span></div>
        <div><span className="text-dim text-xs block">{t("meatLbl")}</span><span className="font-medium">{food.meats.map((m) => meatName(m, lang)).join(", ")}</span></div>
        <div><span className="text-dim text-xs block">{t("spiceLbl")}</span><span className="font-medium">{food.spice === 0 ? "—" : spiceIcons}</span></div>
      </div>
      {!compact && (
        <div className="px-4 pb-4">
          <div className="text-dim text-xs mb-1.5">{t("ingredientsLbl")}</div>
          <div className="flex flex-wrap gap-1.5">
            {food.ings.map((i) => <Chip key={i} tone="saffron">{ingredientName(i, lang)}</Chip>)}
          </div>
          <div className="mt-3 text-sm text-mut leading-relaxed border-s-2 border-saffron/50 ps-3">{food.desc}</div>
        </div>
      )}
    </div>
  );
}

/* ================= GAME SCREEN ================= */
export function GameScreen({ cfg, initial, onDone, onQuit, coins, onSpendCoins, onUseFreeHint, freeHints }: {
  cfg: GameConfig; initial?: Question[]; onDone: (r: GameResult) => void; onQuit: () => void;
  coins: number; onSpendCoins: (n: number) => boolean; onUseFreeHint: () => boolean; freeHints: number;
}) {
  const { lang, t, L } = useI18n();
  const live = cfg.mode === "endless" || cfg.mode === "timeattack";
  const isMystery = cfg.mode === "mystery";
  const [qs, setQs] = useState<Question[]>(initial ?? []);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"play" | "feedback" | "over">("play");
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(cfg.lives);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboNow, setComboNow] = useState(1);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [floatPts, setFloatPts] = useState<{ v: number; k: number } | null>(null);
  const [comboPop, setComboPop] = useState(0);
  const [lostLife, setLostLife] = useState(false);
  const [timeLeft, setTimeLeft] = useState(cfg.seconds ?? 60);
  const [secondsOnQ, setSecondsOnQ] = useState(0);
  // mystery reveals + hints (per question)
  const [reveals, setReveals] = useState(0);
  const [hintCountry, setHintCountry] = useState(false);
  const [hintCategory, setHintCategory] = useState(false);
  const [hintRegion, setHintRegion] = useState(false);
  const [removedOption, setRemovedOption] = useState<number | null>(null);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const hintsThisGame = useRef(0);

  const usedRef = useRef<Set<string>>(new Set());
  const qStartRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const answersRef = useRef<AnswerLog[]>([]);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const comboRef = useRef(1);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const livesRef = useRef(lives);
  livesRef.current = lives;

  const q: Question | null = qs[idx] ?? null;
  const food = q ? getFood(q.foodId) : undefined;
  const total = live ? 0 : qs.length;

  // seed live mode
  useEffect(() => {
    if (live && qs.length === 0) {
      const first = nextLiveQuestion(0, usedRef.current);
      if (first) { usedRef.current.add(first.foodId || first.id); setQs([first]); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const ans = answersRef.current;
    const correct = ans.filter((a) => a.correct);
    const xpCfg = getScoring().xp;
    let xp = correct.reduce((s, a) => {
      const f = getFood(a.foodId);
      const d: Difficulty = a.qid.startsWith("tr-") ? "impossible" : f?.diff ?? "easy";
      return s + (xpCfg[d] ?? 10);
    }, 0);
    if (ans.length >= 10 && correct.length === ans.length) xp += 100; // perfect bonus
    if (correct.length > 0) xp += 25; // completion bonus
    const r: GameResult = {
      mode: cfg.mode, diff: cfg.diff, country: cfg.country, city: cfg.city,
      score: scoreRef.current, total: ans.length, correct: correct.length, wrong: ans.length - correct.length,
      accuracy: ans.length ? Math.round((correct.length / ans.length) * 100) : 0,
      hintsUsed: hintsThisGame.current,
      bestCombo: comboRef.current >= 1 ? Math.max(comboRef.current, bestComboFromStreak(bestStreakRef.current)) : bestComboFromStreak(bestStreakRef.current),
      bestStreak: bestStreakRef.current,
      xp, answers: ans, completed: true,
      impossibleCorrect: ans.filter((a) => a.correct && (a.qid.startsWith("tr-") || getFood(a.foodId)?.diff === "impossible")).length,
    };
    markSeen(ans.map((a) => a.qid));
    setPhase("over");
    setTimeout(() => onDone(r), 350);
  }, [cfg, onDone]);

  // time attack countdown
  useEffect(() => {
    if (cfg.mode !== "timeattack" || phase === "over") return;
    const id = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) { clearInterval(id); finish(); return 0; }
        if (v <= 6) sfx.play("tick");
        return v - 1;
      });
      setSecondsOnQ((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [cfg.mode, phase, idx, finish]);

  const pick = useCallback((i: number) => {
    if (phaseRef.current !== "play" || !qs[idx]) return;
    const cur = qs[idx];
    const isCorrect = cur.options[i] === cur.correct;
    setSelected(i);
    if (isCorrect) {
      const ns = streakRef.current + 1;
      streakRef.current = ns;
      bestStreakRef.current = Math.max(bestStreakRef.current, ns);
      const combo = comboFor(ns);
      const prevCombo = comboRef.current;
      comboRef.current = combo;
      setStreak(ns); setBestStreak(bestStreakRef.current); setComboNow(combo);
      let bonus = 0;
      if (cfg.mode === "timeattack") bonus = Math.max(0, 5 - Math.min(5, secondsOnQ)) * 20;
      let pts = pointsFor(cur.diff, ns, bonus);
      // mystery: fewer image reveals = bigger reward
      if (isMystery) pts = Math.round(pts * [1.5, 1.2, 1.0, 0.8][Math.min(3, reveals)]);
      scoreRef.current += pts;
      setScore(scoreRef.current);
      setFloatPts({ v: pts, k: Date.now() });
      answersRef.current = [...answersRef.current, { qid: cur.id, foodId: cur.foodId, correct: true, points: pts }];
      setAnswers(answersRef.current);
      sfx.play("correct");
      if (combo > prevCombo) {
        sfx.play("combo"); setComboPop(Date.now());
        setTimeout(() => setComboPop(0), 1100);
      }
    } else {
      streakRef.current = 0;
      comboRef.current = 1;
      setStreak(0); setComboNow(1);
      const nl = livesRef.current - 1;
      livesRef.current = nl;
      setLives(nl);
      setLostLife(true);
      answersRef.current = [...answersRef.current, { qid: cur.id, foodId: cur.foodId, correct: false, points: 0 }];
      setAnswers(answersRef.current);
      sfx.play("wrong");
      if (nl > 0) setTimeout(() => sfx.play("heart"), 200);
    }
    setPhase("feedback");
  }, [qs, idx, cfg.mode, secondsOnQ]);

  const next = useCallback(() => {
    if (phaseRef.current !== "feedback") return;
    setSelected(null); setLostLife(false); setSecondsOnQ(0);
    setReveals(0); setHintCountry(false); setHintCategory(false); setHintRegion(false); setRemovedOption(null);
    if (livesRef.current <= 0) { finish(); return; }
    if (live) {
      const nq = nextLiveQuestion(usedRef.current.size, usedRef.current);
      if (!nq) { finish(); return; }
      usedRef.current.add(nq.foodId || nq.id);
      setQs((old) => [...old, nq]);
      setIdx((i) => i + 1);
      qStartRef.current = Date.now();
      setPhase("play");
    } else {
      if (idx + 1 >= qs.length) { finish(); return; }
      setIdx((i) => i + 1);
      qStartRef.current = Date.now();
      setPhase("play");
    }
  }, [live, idx, qs.length, finish]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "play" && ["1", "2", "3", "4"].includes(e.key)) pick(parseInt(e.key, 10) - 1);
      else if (phase === "feedback" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, pick, next]);

  // ---- hints / reveals: prefer the daily free allowance, then coins ----
  const payForHint = useCallback((): boolean => {
    if (onUseFreeHint()) { hintsThisGame.current += 1; return true; }
    return false;
  }, [onUseFreeHint]);
  const payCoins = useCallback((n: number): boolean => {
    if (onSpendCoins(n)) { hintsThisGame.current += 1; return true; }
    setHintToast(t("notEnoughCoins"));
    setTimeout(() => setHintToast(null), 1600);
    return false;
  }, [onSpendCoins, t]);

  const useHint = useCallback((id: string) => {
    if (phaseRef.current !== "play") return;
    const def = HINTS.find((h) => h.id === id);
    if (!def) return;
    const ok = payForHint() || payCoins(def.cost);
    if (!ok) return;
    sfx.play("click");
    const cur = qs[idx];
    switch (id) {
      case "reveal-country": setHintCountry(true); break;
      case "reveal-category": setHintCategory(true); break;
      case "reveal-region": setHintRegion(true); break;
      case "remove-wrong": {
        if (cur) {
          const wrongs = cur.options.map((o, i) => (o !== cur.correct ? i : -1)).filter((i) => i >= 0 && i !== removedOption);
          if (wrongs.length) setRemovedOption(wrongs[Math.floor(Math.random() * wrongs.length)]);
        }
        break;
      }
      default: break;
    }
  }, [qs, idx, removedOption, payForHint, payCoins]);

  const diffLabel = t(cfg.diff === "mixed" ? "mixed" : cfg.diff);
  const modeLabel = t(cfg.mode === "country" ? "countryMode" : cfg.mode === "timeattack" ? "timeattack" : cfg.mode === "endless" ? "endless" : cfg.mode === "world" ? "worldMode" : cfg.mode === "classic" ? "classic" : "dailyChallenge");
  const lastWrong = phase === "feedback" && selected !== null && q ? q.options[selected] !== q.correct : false;
  const correctKeyIdx = q ? q.options.indexOf(q.correct) : -1;

  const prompt = useMemo(() => {
    if (!q) return "";
    if (q.custom) return L(q.custom.prompt);
    const fname = food ? (lang === "fa" ? food.fa : lang === "ar" ? food.ar : food.en) : "";
    // ingredient & recipe challenges must NOT reveal the dish name in the prompt
    if (q.type === "ingfood" || q.type === "recipe") return t(PROMPT_KEYS[q.type]);
    return t(PROMPT_KEYS[q.type], { food: `«${fname}»` });
  }, [q, food, lang, t, L]);

  // recipe steps preview for recipe challenges
  const recipePreview = useMemo(() => {
    if (!q || q.type !== "recipe" || !food) return null;
    const r = getRecipe(food, lang);
    return r.steps.slice(0, 2).map((s, i) => ({ n: i + 1, text: recipeStepText(s, lang) }));
  }, [q, food, lang]);

  if (phase === "over") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center anim-pop">
          <div className="text-6xl mb-4" aria-hidden="true">🏁</div>
          <p className="font-display font-bold text-xl">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8">
      {/* HUD */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        <button onClick={onQuit} className="btn-press flex items-center gap-1.5 text-sm text-mut hover:text-ink border border-line rounded-lg px-3 py-1.5">
          <Icon name="chevL" className="w-4 h-4 rtl:rotate-180" /> {t("quit")}
        </button>
        <Chip tone="saffron">{modeLabel}{cfg.mode === "country" && cfg.country ? ` · ${countryName(cfg.country, lang)}` : ""}</Chip>
        <Chip>{diffLabel}</Chip>
        <div className="ms-auto flex items-center gap-4">
          {cfg.mode === "timeattack"
            ? <span className="font-display font-extrabold text-teal text-xl" title={t("lives")}>∞</span>
            : <Hearts lives={lives} max={cfg.lives} justLost={lostLife} />}
          <div className="text-end">
            <div className="text-[10px] uppercase tracking-wider text-dim font-bold">{t("score")}</div>
            <div className="font-display font-extrabold text-xl text-saffron leading-none relative">
              <CountUp to={score} duration={500} />
              {floatPts && (
                <span key={floatPts.k} className="absolute -top-5 end-0 text-herb text-sm font-bold whitespace-nowrap" style={{ animation: "floatScore 1s ease both" }}>
                  +{floatPts.v.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-end hidden sm:block">
            <div className="text-[10px] uppercase tracking-wider text-dim font-bold">{t("combo")}</div>
            <ComboBadge combo={comboNow} streak={streak} />
          </div>
        </div>
      </div>

      {/* progress / timer */}
      {cfg.mode === "timeattack" ? (
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className={timeLeft <= 10 ? "text-chili anim-blink" : "text-mut"}><Icon name="clock" className="w-3.5 h-3.5 inline-block me-1" />{t("timeLeft")}: {timeLeft}s</span>
            <span className="text-mut">{t("streak")}: {streak}</span>
          </div>
          <Bar pct={(timeLeft / (cfg.seconds ?? 60)) * 100} tone={timeLeft <= 10 ? "chili" : "teal"} striped />
        </div>
      ) : (
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-mut">{live ? `${t("question")} ${idx + 1}` : t("questionOf", { a: idx + 1, b: total })}</span>
            <span className="text-mut">{t("streak")}: {streak}</span>
          </div>
          <Bar pct={live ? Math.min(100, ((idx + 1) / Math.max(idx + 12, 20)) * 100) : ((idx + (phase === "feedback" ? 1 : 0)) / total) * 100} tone="saffron" />
        </div>
      )}

      {q && (
        <div key={q.id} className="anim-rise">
          {/* visual clue */}
          {isMystery && food ? (
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <div
                  className="transition-all duration-500"
                  style={{ filter: reveals === 0 ? "blur(26px) saturate(0.2)" : reveals === 1 ? "blur(14px) saturate(0.6)" : reveals === 2 ? "blur(6px)" : "none" }}
                >
                  <FoodTile food={food} size="hero" className="max-w-md w-full" />
                </div>
                {reveals === 0 && (
                  <span className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden="true">❓</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                {reveals < 3 && phase === "play" && (
                  <Btn size="sm" variant="teal" onClick={() => { if (payForHint() || payCoins(12)) { setReveals((r) => r + 1); sfx.play("flip"); } }}>
                    <Icon name="search" className="w-4 h-4" /> {t("revealImage")} · {t("coinsLbl")} 12
                  </Btn>
                )}
                <Chip tone={reveals === 0 ? "herb" : "chili"}>{t("revealCost", { n: reveals })}</Chip>
              </div>
            </div>
          ) : q.type === "ingfood" && food ? (
            <div className="bg-panel border border-line rounded-3xl p-5 mb-5">
              <div className="text-dim text-xs font-bold uppercase tracking-widest mb-3 text-center">{t("ingredientsLbl")}</div>
              <div className="flex flex-wrap justify-center gap-2">
                {food.ings.slice(0, 6).map((i) => (
                  <Chip key={i} tone="saffron" className="text-sm px-3 py-1.5">{ingredientName(i, lang)}</Chip>
                ))}
              </div>
            </div>
          ) : q.type === "recipe" && recipePreview ? (
            <div className="bg-panel border border-line rounded-3xl p-5 mb-5 max-w-xl mx-auto">
              <div className="text-dim text-xs font-bold uppercase tracking-widest mb-3 text-center">{t("recipeLbl")} · {t("generatedRecipe")}</div>
              <ol className="space-y-2.5">
                {recipePreview.map((s) => (
                  <li key={s.n} className="flex gap-3 text-sm text-mut leading-relaxed">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-saffron/15 text-saffron font-display font-bold flex items-center justify-center text-xs">{s.n}</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : q.type === "foodname" && !q.custom ? (
            <div className="bg-panel border border-line rounded-3xl p-5 mb-5 flex flex-col sm:flex-row items-center gap-5">
              <FoodTile food={food} size="lg" className="anim-pop" />
              <div>
                <div className="text-dim text-xs font-bold uppercase tracking-widest mb-1.5">{t("foodFact")}</div>
                <p className="text-mut leading-relaxed">{food?.desc}</p>
              </div>
            </div>
          ) : !q.custom ? (
            <div className="flex justify-center mb-5">
              <FoodTile food={food} size="hero" className={`max-w-md w-full ${phase === "feedback" && lastWrong ? "anim-shake" : ""}`} />
            </div>
          ) : (
            <div className="flex justify-center mb-5">
              <div className="w-full max-w-md aspect-[5/3] rounded-3xl border border-teal/30 bg-gradient-to-br from-teal/15 via-panel to-chili/10 flex items-center justify-center">
                <span className="text-[80px] sm:text-[100px] anim-wiggle" style={{ animationDuration: "4s" }} aria-hidden="true">🧠</span>
              </div>
            </div>
          )}

          <h2 className="font-display font-bold text-xl sm:text-2xl text-center leading-snug mb-5 min-h-[3.5rem]">{prompt}</h2>

          {/* revealed hints */}
          {(hintCountry || hintCategory || hintRegion) && food && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {hintCountry && <Chip tone="teal">🌍 {countryName(food.country, lang)}</Chip>}
              {hintCategory && food.cats[0] && <Chip tone="herb">🗂️ {categoryName(food.cats[0], lang)}</Chip>}
              {hintRegion && <Chip tone="saffron">📍 {cityNameOf(food, lang)}</Chip>}
            </div>
          )}

          {/* options */}
          <div className="grid sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isSel = selected === i;
              const isCorrect = i === correctKeyIdx;
              const isRemoved = removedOption === i && phase === "play";
              let cls = "bg-panel border-line hover:border-saffron/70 hover:bg-panel2 card-hover";
              if (isRemoved) cls = "bg-panel border-line opacity-25 line-through";
              if (phase === "feedback") {
                if (isCorrect) cls = "bg-herb/15 border-herb text-ink";
                else if (isSel) cls = "bg-chili/15 border-chili anim-shake";
                else cls = "bg-panel border-line opacity-45";
              }
              return (
                <button key={opt + i} onClick={() => pick(i)} disabled={phase !== "play" || isRemoved}
                  className={`relative flex items-center gap-3 text-start px-4 py-4 rounded-2xl border-2 font-medium text-[15px] sm:text-base transition-colors ${cls}`}
                  aria-label={`Answer ${i + 1}`}>
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-black/25 border border-line2 flex items-center justify-center font-display font-bold text-sm text-saffron">
                    {"ABCD"[i]}
                  </span>
                  <span className="flex-1">{optionLabel(q, opt, lang)}</span>
                  {phase === "feedback" && isCorrect && (
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-herb shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12.5l5 5L20 6.5" className="check-draw" />
                    </svg>
                  )}
                  {phase === "feedback" && isSel && !isCorrect && <Icon name="x" className="w-5 h-5 text-chili shrink-0" strokeWidth={2.6} />}
                </button>
              );
            })}
          </div>

          {/* hint toolbar */}
          {phase === "play" && !q.custom && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs text-dim font-bold flex items-center gap-1">
                  💰 {coins.toLocaleString()} · {freeHints > 0 ? t("freeHintsLeft", { n: freeHints }) : t("useHint")}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap mt-2">
                {HINTS.filter((h) => h.id !== "reveal-image").map((h) => {
                  const used =
                    (h.id === "reveal-country" && hintCountry) ||
                    (h.id === "reveal-category" && hintCategory) ||
                    (h.id === "reveal-region" && hintRegion);
                  return (
                    <button key={h.id} onClick={() => useHint(h.id)} disabled={used || (q.type !== "foodname" && q.type !== "ingfood" && q.type !== "recipe" && h.id !== "remove-wrong")}
                      className="btn-press flex items-center gap-1.5 text-xs font-semibold border border-line bg-panel rounded-full px-3 py-1.5 hover:border-teal/60 disabled:opacity-30"
                      title={t(h.label)}>
                      <span aria-hidden="true">{h.icon}</span> {t(h.label)} <span className="text-teal">{h.cost}💰</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* feedback */}
          {phase === "feedback" && q && (
            <div className="mt-5 anim-rise">
              <div className={`rounded-2xl border p-4 mb-3 ${lastWrong ? "border-chili/40 bg-chili/10" : "border-herb/40 bg-herb/10"}`}>
                <div className="flex items-center gap-2 font-display font-bold text-lg">
                  {lastWrong ? <Icon name="x" className="w-5 h-5 text-chili" strokeWidth={2.6} /> : <Icon name="check" className="w-5 h-5 text-herb" strokeWidth={2.6} />}
                  <span className={lastWrong ? "text-chili" : "text-herb"}>{lastWrong ? t("wrongLbl") : t("correctLbl")}</span>
                  {!lastWrong && answers[answers.length - 1] && (
                    <span className="ms-auto text-saffron font-extrabold">+{answers[answers.length - 1].points.toLocaleString()} {t("points")}</span>
                  )}
                  {streak >= 3 && !lastWrong && <Chip tone="saffron" className="ms-auto rtl:ms-0">{t("comboBonus", { n: comboNow })}</Chip>}
                </div>
                {lastWrong && (
                  <p className="text-sm text-mut mt-2">
                    {t("correctWas")}: <span className="text-ink font-semibold">{optionLabel(q, q.correct, lang)}</span>
                  </p>
                )}
                <p className="text-sm text-mut mt-2 leading-relaxed border-s-2 border-line2 ps-3">
                  <span className="text-saffron font-semibold">{t("foodFact")}: </span>
                  {q.custom?.fact ?? food?.desc}
                </p>
              </div>
              <FoodInfoCard food={food} compact />
              <div className="flex justify-center mt-4">
                <Btn size="lg" onClick={next} variant={lives <= 0 ? "chili" : "primary"}>
                  {lives <= 0 ? t("gameOver") : idx + 1 >= total && !live ? t("gameComplete") : t("next")}
                  <Icon name="chevR" className="w-4 h-4 rtl:rotate-180" />
                </Btn>
              </div>
              <p className="text-center text-xs text-dim mt-2 hidden sm:block">{t("keyboardHint")}</p>
            </div>
          )}
        </div>
      )}

      {/* combo flash */}
      {comboPop > 0 && comboNow >= 2 && (
        <div key={comboPop} className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
          <div className="anim-flash font-display font-extrabold text-6xl sm:text-7xl text-saffron drop-shadow-[0_0_30px_rgba(255,138,0,0.6)]">
            {t("comboBonus", { n: comboNow })} 🔥
          </div>
        </div>
      )}
    </div>
  );
}

function bestComboFromStreak(streak: number): number {
  let m = 1;
  for (const c of getScoring().combo) if (streak >= c.threshold) m = c.mult;
  return m;
}

/* ================= RESULT SCREEN ================= */
export function ResultScreen({ result, onPlayAgain, onHome, unlocked, levelNow }: {
  result: GameResult; onPlayAgain: () => void; onHome: () => void; unlocked: { icon: string; name: string }[]; levelNow: number;
}) {
  const { t } = useI18n();
  const lvl = levelFromXp(levelNow === 0 ? result.xp : 0);
  void lvl;
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Reveal>
        <div className="text-center mb-8">
          <div className="text-6xl mb-3" aria-hidden="true">{result.accuracy >= 80 ? "🏆" : result.accuracy >= 50 ? "🍽️" : "🍳"}</div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl mb-2">
            {result.completed ? t("gameComplete") : t("gameOver")}
          </h1>
          <p className="text-mut">{t("finalScore")}</p>
          <div className="font-display font-extrabold text-6xl sm:text-7xl text-saffron mt-1">
            <CountUp to={result.score} duration={1200} />
          </div>
          {result.score > 0 && result.mode !== "country" && (
            <Chip tone="herb" className="mt-3">{t("newRecord")}</Chip>
          )}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { l: t("correctAnswers"), v: `${result.correct}/${result.total}`, i: "check" },
            { l: t("accuracy"), v: `${result.accuracy}%`, i: "spark" },
            { l: t("bestComboLbl"), v: `×${result.bestCombo}`, i: "flame" },
            { l: t("highestStreakLbl"), v: String(result.bestStreak), i: "bolt" },
            { l: t("xpEarned"), v: `+${result.xp}`, i: "star" },
            { l: t("coinsEarned"), v: `+${result.coinsEarned ?? 0} 💰`, i: "medal" },
            { l: t("foodsDiscovered"), v: `+${result.discoveries ?? 0}`, i: "book" },
            { l: t("level"), v: String(levelNow), i: "medal" },
          ].map((s, i) => (
            <div key={i} className="bg-panel border border-line rounded-2xl p-4 text-center card-hover">
              <Icon name={s.i} className="w-5 h-5 mx-auto mb-2 text-saffron" />
              <div className="font-display font-extrabold text-2xl">{s.v}</div>
              <div className="text-xs text-mut mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {unlocked.length > 0 && (
        <Reveal delay={220}>
          <div className="bg-panel border border-saffron/40 rounded-2xl p-4 mb-6">
            <div className="font-display font-bold text-saffron mb-3 flex items-center gap-2">
              <Icon name="trophy" className="w-5 h-5" /> {t("newAchievements")}
            </div>
            <div className="flex flex-wrap gap-2">
              {unlocked.map((u) => (
                <span key={u.name} className="anim-pop inline-flex items-center gap-2 bg-saffron/10 border border-saffron/40 rounded-xl px-3 py-2 text-sm font-semibold">
                  <span aria-hidden="true">{u.icon}</span> {u.name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={300}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Btn size="lg" onClick={onPlayAgain}><Icon name="play" className="w-4 h-4" /> {t("playAgain")}</Btn>
          <Btn size="lg" variant="dark" onClick={onHome}><Icon name="home" className="w-4 h-4" /> {t("backHome")}</Btn>
        </div>
      </Reveal>
    </div>
  );
}
