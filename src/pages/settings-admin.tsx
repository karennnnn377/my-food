import { useState } from "react";
import type { Profile, Settings, Difficulty, Food } from "../data/types";
import { useI18n } from "../lib/i18n";
import { DB, refreshDB, loadOverlay, saveOverlay, countryName, STATS } from "../lib/data";
import { DEFAULT_SCORING, getScoring, setScoring } from "../lib/engine";
import { formatGregorian, formatPersian } from "../lib/calendar";
import { Btn, Chip, Icon, Reveal, SectionHead } from "../components/ui";
import { sfx } from "../lib/sound";
import type { Route } from "./home";

function Toggle({ on, onChange, label, desc, icon }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string; icon: string }) {
  return (
    <button onClick={() => { onChange(!on); sfx.play("click"); }} className="w-full flex items-center gap-4 bg-panel border border-line rounded-2xl p-4 card-hover text-start" role="switch" aria-checked={on}>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? "bg-saffron/15 text-saffron" : "bg-bg2 text-dim"}`}>
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <span className="flex-1">
        <span className="font-semibold block">{label}</span>
        {desc && <span className="text-xs text-mut block mt-0.5">{desc}</span>}
      </span>
      <span className={`w-12 h-7 rounded-full border transition-colors relative shrink-0 ${on ? "bg-saffron border-saffron" : "bg-bg2 border-line2"}`}>
        <span className={`absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white shadow transition-all ${on ? "start-6" : "start-0.5"}`} style={{ width: 22, height: 22 }} />
      </span>
    </button>
  );
}

export function SettingsPage({ settings, onChange, profile, onSaveProfile }: {
  settings: Settings; onChange: (s: Settings) => void; profile: Profile; onSaveProfile: (p: Profile) => void;
}) {
  const { t, lang, setLang } = useI18n();
  const now = new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SectionHead kicker="FoodGuess" title={t("settings")} />

      <div className="bg-panel border border-line rounded-2xl p-4 mb-4">
        <div className="font-semibold mb-3 flex items-center gap-2"><Icon name="globe" className="w-4 h-4 text-saffron" /> {t("language")}</div>
        <div className="grid grid-cols-3 gap-2">
          {([["en", "English", "🇬🇧"], ["fa", "فارسی", "🇮🇷"], ["ar", "العربية", "🇸🇦"]] as const).map(([code, label, flag]) => (
            <button key={code} onClick={() => { setLang(code); onChange({ ...settings, lang: code }); sfx.play("flip"); }}
              className={`btn-press rounded-xl border-2 py-3 font-bold ${settings.lang === code ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-bg2 text-mut"}`}>
              <span className="text-xl block mb-1" aria-hidden="true">{flag}</span>{label}
            </button>
          ))}
        </div>
        <p className="text-xs text-mut mt-3">RTL: {lang === "en" ? "LTR ⇢" : "RTL ⇠"} · {t("gregorianDate")}: {formatGregorian(now, lang)} · {t("persianDate")}: <span dir="ltr">{formatPersian(now)}</span></p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Toggle on={settings.sound} onChange={(v) => onChange({ ...settings, sound: v })} label={t("soundFx")} icon="volume" />
        <Toggle on={settings.music} onChange={(v) => onChange({ ...settings, music: v })} label={t("musicLbl")} icon="play" />
        <Toggle on={settings.notifications} onChange={(v) => {
          if (v && typeof Notification !== "undefined" && Notification.permission === "default") { try { void Notification.requestPermission(); } catch { /* noop */ } }
          onChange({ ...settings, notifications: v });
        }} label={t("notifications")} icon="info" />
        <Toggle on={settings.animations} onChange={(v) => onChange({ ...settings, animations: v })} label={t("animationsLbl")} icon="spark" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-panel border border-line rounded-2xl p-4">
          <div className="font-semibold mb-3 flex items-center gap-2"><Icon name={settings.theme === "dark" ? "moon" : "sun"} className="w-4 h-4 text-saffron" /> {t("themeLbl")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onChange({ ...settings, theme: "dark" })} className={`btn-press rounded-xl border-2 py-2.5 font-bold ${settings.theme === "dark" ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-bg2 text-mut"}`}>🌙 {t("dark")}</button>
            <button onClick={() => onChange({ ...settings, theme: "light" })} className={`btn-press rounded-xl border-2 py-2.5 font-bold ${settings.theme === "light" ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-bg2 text-mut"}`}>☀️ {t("light")}</button>
          </div>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-4">
          <div className="font-semibold mb-3 flex items-center gap-2"><Icon name="calendar" className="w-4 h-4 text-saffron" /> {t("calendarType")}</div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onChange({ ...settings, calendar: "gregorian" })} className={`btn-press rounded-xl border-2 py-2.5 font-bold text-sm ${settings.calendar === "gregorian" ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-bg2 text-mut"}`}>{t("gregorianCal")}</button>
            <button onClick={() => onChange({ ...settings, calendar: "persian" })} className={`btn-press rounded-xl border-2 py-2.5 font-bold text-sm ${settings.calendar === "persian" ? "border-saffron bg-saffron/10 text-saffron" : "border-line bg-bg2 text-mut"}`}>🇮🇷 {t("persianCal")}</button>
          </div>
          <div className="text-sm text-mut mt-3">
            {settings.calendar === "persian"
              ? <><span className="font-bold text-ink" dir="ltr">{formatPersian(now)}</span> · <span className="text-xs">{formatGregorian(now, lang)}</span></>
              : <><span className="font-bold text-ink">{formatGregorian(now, lang)}</span> · <span className="text-xs" dir="ltr">{formatPersian(now)}</span></>}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded-2xl p-4">
        <div className="font-semibold mb-2">{t("username")}</div>
        <div className="flex gap-2">
          <input value={profile.name} onChange={(e) => onSaveProfile({ ...profile, name: e.target.value })}
            className="flex-1 bg-bg2 border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-2 focus:outline-saffron" />
          <Btn onClick={() => { onSaveProfile(profile); sfx.play("correct"); }}>{t("save")}</Btn>
        </div>
      </div>
    </div>
  );
}

/* ================= ADMIN ================= */
const DIFFS: Difficulty[] = ["easy", "medium", "hard", "extreme", "impossible"];

export function AdminPage({ notify }: { notify: (m: string) => void }) {
  const { t, lang, L } = useI18n();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("fg_admin") === "1");
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [, force] = useState(0);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ en: "", fa: "", ar: "", country: "iran", region: "", cats: "traditional", ings: "onion", diff: "medium" as Difficulty, spice: 1, veg: false, vegan: false, emoji: "🍲", desc: "" });
  const [scoreCfg, setScoreCfg] = useState(getScoring());
  const db = DB();
  const stats = STATS();

  const tryLogin = () => {
    if (pin === "2024") { setAuthed(true); sessionStorage.setItem("fg_admin", "1"); sfx.play("level"); }
    else { setPinErr(true); sfx.play("wrong"); }
  };

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">🔐</div>
        <h1 className="font-display font-extrabold text-2xl mb-2">{t("adminPanel")}</h1>
        <p className="text-mut text-sm mb-6">{t("adminNote")}</p>
        <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setPinErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && tryLogin()}
          placeholder={t("enterPin")} dir="ltr"
          className={`w-full bg-panel border rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] text-ink focus:outline-2 focus:outline-saffron ${pinErr ? "border-chili anim-shake" : "border-line"}`} />
        {pinErr && <p className="text-chili text-sm mt-2">{t("wrongPin")}</p>}
        <Btn className="mt-4 w-full" size="lg" onClick={tryLogin}><Icon name="lock" className="w-4 h-4" /> {t("admin")}</Btn>
      </div>
    );
  }

  const addFood = () => {
    if (!form.en.trim()) return;
    const id = `adm-${form.en.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const food: Food = {
      id, en: form.en.trim(), fa: form.fa.trim() || form.en.trim(), ar: form.ar.trim() || form.en.trim(),
      country: form.country, region: form.region.trim() || "Nationwide",
      cats: form.cats.split(",").map((s) => s.trim()).filter(Boolean),
      ings: form.ings.split(",").map((s) => s.trim()).filter(Boolean),
      meats: form.veg ? ["none"] : ["beef"], veg: form.veg, vegan: form.vegan,
      spice: form.spice as Food["spice"], diff: form.diff, emoji: form.emoji || "🍲",
      desc: form.desc.trim() || `${form.en} — community-submitted dish.`,
    };
    const ov = loadOverlay();
    ov.foods = [...ov.foods.filter((f) => f.id !== id), food];
    saveOverlay(ov); refreshDB(); force((x) => x + 1);
    sfx.play("achieve"); notify(t("saved"));
    setForm({ ...form, en: "", fa: "", ar: "", desc: "" });
  };

  const deleteFood = (id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const ov = loadOverlay();
    ov.deleted = [...new Set([...ov.deleted, id])];
    saveOverlay(ov); refreshDB(); force((x) => x + 1);
    sfx.play("wrong"); notify(t("saved"));
  };

  const addCountry = () => {
    const id = `c-${Date.now()}`;
    const ov = loadOverlay();
    ov.countries = [...ov.countries, { id, en: "New Country", fa: "کشور جدید", ar: "دولة جديدة", flag: "🏳️", continent: "asia", cuisine: { en: "New Cuisine", fa: "آشپزی جدید", ar: "مطبخ جديد" } }];
    saveOverlay(ov); refreshDB(); force((x) => x + 1);
    notify(t("saved"));
  };

  const input = "w-full bg-bg2 border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-2 focus:outline-saffron";
  const shownFoods = db.foods.filter((f) => !q.trim() || [f.en, f.fa, f.id].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0, 40);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SectionHead kicker={t("adminNote")} title={t("adminPanel")} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { l: t("foodsAdmin"), v: stats.foods }, { l: t("countriesAdmin"), v: stats.countries },
          { l: t("ingredientsLbl2"), v: stats.ingredients }, { l: t("questionsAvail"), v: stats.questions },
        ].map((s, i) => (
          <div key={i} className="bg-panel border border-line rounded-2xl p-4 text-center">
            <div className="font-display font-extrabold text-3xl text-saffron">{s.v.toLocaleString()}</div>
            <div className="text-xs text-mut mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* add food */}
        <div className="bg-panel border border-line rounded-3xl p-5">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Icon name="plus" className="w-4 h-4 text-herb" /> {t("addFood")}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <input className={input} placeholder={t("nameEn")} value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })} />
            <input className={input} placeholder={t("nameFa")} dir="rtl" value={form.fa} onChange={(e) => setForm({ ...form, fa: e.target.value })} />
            <input className={input} placeholder={t("nameAr")} dir="rtl" value={form.ar} onChange={(e) => setForm({ ...form, ar: e.target.value })} />
            <input className={input} placeholder={t("emojiLbl")} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
            <select className={input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {db.countries.map((c) => <option key={c.id} value={c.id}>{c.flag} {countryName(c.id, lang)}</option>)}
            </select>
            <input className={input} placeholder={t("regionLbl")} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <select className={input} value={form.diff} onChange={(e) => setForm({ ...form, diff: e.target.value as Difficulty })}>
              {DIFFS.map((d) => <option key={d} value={d}>{t(d)}</option>)}
            </select>
            <select className={input} value={form.spice} onChange={(e) => setForm({ ...form, spice: parseInt(e.target.value, 10) })}>
              {[0, 1, 2, 3].map((s) => <option key={s} value={s}>{t("spiceLbl")} {s}</option>)}
            </select>
            <input className={`${input} col-span-2`} placeholder={t("ingredientsKey")} dir="ltr" value={form.ings} onChange={(e) => setForm({ ...form, ings: e.target.value })} />
            <input className={`${input} col-span-2`} placeholder={t("descEn")} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
          </div>
          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.veg} onChange={(e) => setForm({ ...form, veg: e.target.checked })} /> {t("vegOnly")}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.vegan} onChange={(e) => setForm({ ...form, vegan: e.target.checked })} /> {t("veganOnly")}</label>
            <Btn className="ms-auto" onClick={addFood}><Icon name="plus" className="w-4 h-4" /> {t("add")}</Btn>
          </div>
        </div>

        {/* scoring */}
        <div className="bg-panel border border-line rounded-3xl p-5">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Icon name="gear" className="w-4 h-4 text-teal" /> {t("scoringCfg")}</h3>
          {DIFFS.map((d) => (
            <div key={d} className="flex items-center gap-3 mb-2.5">
              <span className="w-28 text-sm font-semibold capitalize">{t(d)}</span>
              <input type="number" className={input} value={scoreCfg.base[d]}
                onChange={(e) => setScoreCfg({ ...scoreCfg, base: { ...scoreCfg.base, [d]: parseInt(e.target.value, 10) || 0 } })} />
              <span className="text-xs text-dim">{t("points")}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 mb-2.5">
            <span className="w-28 text-sm font-semibold">{t("livesCount")}</span>
            <input type="number" className={input} value={scoreCfg.lives} onChange={(e) => setScoreCfg({ ...scoreCfg, lives: Math.max(1, parseInt(e.target.value, 10) || 1) })} />
          </div>
          <div className="flex gap-2 mt-4">
            <Btn onClick={() => { setScoring(scoreCfg); sfx.play("achieve"); notify(t("saved")); }}>{t("save")}</Btn>
            <Btn variant="dark" onClick={() => { setScoring(DEFAULT_SCORING); setScoreCfg(DEFAULT_SCORING); }}>{t("reset") || "Reset"}</Btn>
            <Btn variant="dark" className="ms-auto" onClick={addCountry}><Icon name="plus" className="w-4 h-4" /> {t("countriesAdmin")}</Btn>
          </div>
        </div>
      </div>

      {/* foods table */}
      <div className="bg-panel border border-line rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-display font-bold text-lg">{t("foodsAdmin")}</h3>
          <input className={`${input} max-w-xs ms-auto`} placeholder={t("searchPh")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {shownFoods.map((f) => (
            <div key={f.id} className="flex items-center gap-3 py-2 border-b border-line/50 last:border-0 text-sm">
              <span className="text-xl" aria-hidden="true">{f.emoji}</span>
              <span className="font-semibold flex-1 truncate">{f.en}</span>
              <Chip className="hidden sm:inline-flex">{countryName(f.country, lang)}</Chip>
              <Chip tone={f.diff === "easy" ? "herb" : f.diff === "impossible" ? "chili" : "line"} className="hidden sm:inline-flex">{t(f.diff)}</Chip>
              <button onClick={() => deleteFood(f.id)} className="btn-press text-chili border border-chili/40 rounded-lg p-1.5" aria-label={t("delete")}>
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
