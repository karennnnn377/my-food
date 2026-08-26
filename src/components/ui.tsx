import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import type { Food } from "../data/types";
import { CATEGORIES } from "../data/ingredients";
import { getCountry } from "../lib/data";

/* ---------------- Icons (inline SVG) ---------------- */
const PATHS: Record<string, ReactNode> = {
  play: <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none" />,
  flame: <path d="M12 2c1 4-3 5.5-3 9a3.5 3.5 0 0 0 7 .3c1.8 1 3 3 3 5.2A6.5 6.5 0 0 1 5.5 16C5.5 9 12 7 12 2z" />,
  heart: <path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.6 4.5 6.2 4.5c2.2 0 3.8 1.2 5.8 3.4 2-2.2 3.6-3.4 5.8-3.4 3.6 0 5.6 3.5 4.2 7.2-2.5 4.7-10 9.3-10 9.3z" />,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z" /><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14 0 18-3-4-3-14.5 0-18z" /></>,
  book: <><path d="M4 19V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M15.5 4.9a3.5 3.5 0 0 1 0 6.2M17.5 14.9c2 .8 3.5 2.6 4 5.1" /></>,
  star: <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8l1.2 2.6 2.8-.6 1 2.7 2.8.7-.6 2.8 2 2-2 2 .6 2.8-2.8.7-1 2.7-2.8-.6L12 21.2l-1.2-2.6-2.8.6-1-2.7-2.8-.7.6-2.8-2-2 2-2-.6-2.8 2.8-.7 1-2.7 2.8.6z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  x: <path d="M5 5l14 14M19 5L5 19" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6.5V12l3.5 2.5" /></>,
  chevL: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  chevR: <path d="M9.5 5.5L16 12l-6.5 6.5" />,
  volume: <><path d="M4 9v6h4l6 5V4L8 9H4z" fill="currentColor" stroke="none" /><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  sun: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  edit: <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" />,
  trash: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  spark: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8zM19 16l.9 3.1L23 20l-3.1.9L19 24l-.9-3.1L15 20l3.1-.9z" />,
  home: <path d="M3.5 11L12 3.5 20.5 11V21h-6v-6h-5v6h-6z" />,
  medal: <><circle cx="12" cy="14.5" r="5.5" /><path d="M12 11.8l.9 1.9 2.1.3-1.5 1.5.3 2.1-1.8-1-1.8 1 .3-2.1-1.5-1.5 2.1-.3zM8.5 9L6 3M15.5 9L18 3M9.5 3h5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 2.5V7M16 2.5V7" /></>,
  pause: <path d="M8 5v14M16 5v14" />,
  bolt: <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.5" /></>,
};

export function Icon({ name, className = "w-5 h-5", strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}

/* ---------------- Buttons ---------------- */
export function Btn({ children, onClick, variant = "primary", size = "md", className = "", disabled, ariaLabel }: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "chili" | "herb" | "ghost" | "dark" | "teal";
  size?: "sm" | "md" | "lg" | "xl"; className?: string; disabled?: boolean; ariaLabel?: string;
}) {
  const base = "btn-press inline-flex items-center justify-center gap-2 font-semibold rounded-xl select-none focus-visible:outline-2 focus-visible:outline-saffron";
  const sizes = { sm: "text-sm px-3.5 py-2", md: "text-[15px] px-5 py-2.5", lg: "text-base px-7 py-3.5", xl: "text-lg px-9 py-4" };
  const variants = {
    primary: "bg-saffron text-[#231203] shadow-[0_8px_24px_-8px_rgba(255,138,0,0.55)]",
    chili: "bg-chili text-white shadow-[0_8px_24px_-8px_rgba(255,82,51,0.5)]",
    herb: "bg-herb text-[#10240a] shadow-[0_8px_24px_-8px_rgba(142,208,82,0.45)]",
    teal: "bg-teal text-[#03211e] shadow-[0_8px_24px_-8px_rgba(63,208,196,0.45)]",
    ghost: "border border-line2 text-ink hover:bg-panel2",
    dark: "bg-panel2 border border-line text-ink hover:border-line2",
  };
  return (
    <button aria-label={ariaLabel} disabled={disabled} onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`}>
      {children}
    </button>
  );
}

export function Chip({ children, tone = "line", className = "" }: { children: ReactNode; tone?: "line" | "saffron" | "herb" | "chili" | "teal"; className?: string }) {
  const tones = {
    line: "border-line text-mut",
    saffron: "border-saffron/40 text-saffron bg-saffron/10",
    herb: "border-herb/40 text-herb bg-herb/10",
    chili: "border-chili/40 text-chili bg-chili/10",
    teal: "border-teal/40 text-teal bg-teal/10",
  };
  return <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${tones[tone]} ${className}`}>{children}</span>;
}

/* ---------------- Progress / lives / combo ---------------- */
export function Bar({ pct, tone = "saffron", striped = false, className = "" }: { pct: number; tone?: "saffron" | "herb" | "chili" | "teal"; striped?: boolean; className?: string }) {
  const colors = { saffron: "bg-saffron", herb: "bg-herb", chili: "bg-chili", teal: "bg-teal" };
  return (
    <div className={`h-2 rounded-full bg-black/30 overflow-hidden border border-line/60 ${className}`}>
      <div className={`h-full rounded-full ${colors[tone]} ${striped ? "stripe-bar" : ""} transition-all duration-500 ease-out`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Hearts({ lives, max, justLost }: { lives: number; max: number; justLost: boolean }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`${lives} lives`}>
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < lives;
        const losing = justLost && i === lives;
        return (
          <span key={i} className={`text-xl leading-none ${alive ? "text-chili" : "text-line2"} ${losing ? "anim-heart" : ""} ${!alive && !losing ? "opacity-40" : ""}`}>
            <Icon name="heart" className="w-5 h-5 inline-block" strokeWidth={2.2} />
          </span>
        );
      })}
    </div>
  );
}

export function ComboBadge({ combo, streak }: { combo: number; streak: number }) {
  if (combo <= 1) return <span className="text-xs text-dim font-medium">—</span>;
  return (
    <span key={`${combo}-${streak}`} className="anim-flash inline-flex items-center gap-1 font-display font-extrabold text-saffron text-lg">
      <Icon name="flame" className={`w-5 h-5 ${streak >= 3 ? "anim-fire text-chili" : ""}`} />
      ×{combo}
    </span>
  );
}

/* ---------------- Food tile (image system with safe placeholder) ---------------- */
export function FoodTile({ food, size = "md", className = "", flag = true }: { food?: Food | null; size?: "sm" | "md" | "lg" | "hero"; className?: string; flag?: boolean }) {
  const dims = { sm: "w-14 h-14 text-2xl rounded-xl", md: "w-24 h-24 text-5xl rounded-2xl", lg: "w-40 h-40 text-7xl rounded-3xl", hero: "w-full aspect-[5/4] text-[92px] sm:text-[120px] rounded-3xl" };
  let hue = 30;
  if (food) {
    const cat = CATEGORIES[food.cats[0]];
    if (cat) hue = cat.hue;
  }
  const country = food ? getCountry(food.country) : undefined;
  return (
    <div className={`tile-shine relative shrink-0 flex items-center justify-center overflow-hidden border border-white/10 ${dims[size]} ${className}`}
      style={{ background: `linear-gradient(145deg, hsl(${hue} 55% 26%), hsl(${(hue + 34) % 360} 60% 14%))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), var(--shadow)" }}
      role="img" aria-label={food ? food.en : "Food placeholder"}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(80% 60% at 30% 20%, hsl(${hue} 70% 40% / 0.45), transparent 60%)` }} />
      <span className="relative drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]" aria-hidden="true">{food?.emoji ?? "🍽️"}</span>
      {flag && country && (
        <span className="absolute bottom-1.5 end-1.5 text-base sm:text-xl leading-none rounded-md bg-black/40 px-1 py-0.5 backdrop-blur-sm" aria-hidden="true">{country.flag}</span>
      )}
    </div>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 anim-fade" onClick={onClose} />
      <div className={`relative anim-rise w-full ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[92vh] overflow-y-auto bg-panel border border-line2 rounded-t-3xl sm:rounded-3xl shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-panel/95 backdrop-blur border-b border-line">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="btn-press p-2 rounded-lg border border-line text-mut hover:text-ink" aria-label="Close">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Scroll reveal ---------------- */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { el.classList.add("on"); obs.disconnect(); } });
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` } as CSSProperties}>{children}</div>;
}

/* ---------------- Animated counter ---------------- */
export function CountUp({ to, duration = 900, className = "", suffix = "" }: { to: number; duration?: number; className?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const from = fromRef.current;
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(to); fromRef.current = to; return; }
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = to; };
  }, [to, duration]);
  return <span className={className}>{val.toLocaleString()}{suffix}</span>;
}

/* ---------------- Scramble-decode title ---------------- */
export function Scramble({ text, className = "" }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setOut(text); return; }
    const glyphs = "🍜🍕🌮🍣🥘🍲#%&+=*";
    let frame = 0;
    const total = 26;
    const id = setInterval(() => {
      frame++;
      const reveal = Math.floor((frame / total) * text.length);
      setOut(text.split("").map((c, i) => (i < reveal ? c : glyphs[Math.floor(Math.random() * glyphs.length)])).join(""));
      if (frame >= total) { setOut(text); clearInterval(id); }
    }, 42);
    return () => clearInterval(id);
  }, [text]);
  return <span className={className}>{out}</span>;
}

/* ---------------- Marquee ---------------- */
export function Marquee({ children, speed = 42, reverse = false }: { children: ReactNode; speed?: number; reverse?: boolean }) {
  return (
    <div className="overflow-hidden pause-hover" dir="ltr">
      <div className="marquee-track" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : undefined }}>
        <div className="flex items-center shrink-0 anim-marquee" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : undefined }}>{children}</div>
        <div className="flex items-center shrink-0 anim-marquee" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : undefined }} aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Orbiting food ring ---------------- */
export function OrbitRing({ emojis, size = 340, dur = 46 }: { emojis: string[]; size?: number; dur?: number }) {
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-dashed border-line2 opacity-60" />
      <div className={`absolute inset-6 rounded-full border border-line opacity-40 ${reduced ? "" : "anim-orbit-back"}`} style={{ ["--dur" as string]: `${dur * 1.4}s` }}>
        <span className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-teal shadow-[0_0_12px_rgba(63,208,196,0.8)]" />
      </div>
      <div className={`absolute inset-0 ${reduced ? "" : "anim-orbit"}`} style={{ ["--dur" as string]: `${dur}s` }}>
        {emojis.map((e, i) => {
          const ang = (i / emojis.length) * Math.PI * 2;
          const x = 50 + 47 * Math.cos(ang);
          const y = 50 + 47 * Math.sin(ang);
          return (
            <span key={i} className={`absolute text-2xl sm:text-3xl drop-shadow-lg ${reduced ? "" : "anim-orbit-back"}`}
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", ["--dur" as string]: `${dur}s` }}>
              {e}
            </span>
          );
        })}
      </div>
      <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-saffron/25 to-chili/20 border border-saffron/30 flex items-center justify-center backdrop-blur-[2px]">
        <span className="text-5xl sm:text-6xl anim-wiggle" style={{ animationDuration: "3s" }}>🍲</span>
      </div>
    </div>
  );
}

/* ---------------- Floating ambient emojis ---------------- */
export function FloatingField({ emojis, count = 14 }: { emojis: string[]; count?: number }) {
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = Array.from({ length: count }).map((_, i) => ({
    e: emojis[i % emojis.length],
    left: (i * 71) % 100,
    top: (i * 37 + 13) % 100,
    dur: 6 + (i % 5) * 1.7,
    rot: (i % 3 - 1) * 10,
    size: 18 + (i % 4) * 8,
  }));
  if (reduced) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {items.map((it, i) => (
        <span key={i} className="absolute anim-floaty opacity-[0.13]"
          style={{ left: `${it.left}%`, top: `${it.top}%`, fontSize: it.size, ["--dur" as string]: `${it.dur}s`, ["--rot" as string]: `${it.rot}deg`, animationDelay: `${(i % 7) * 0.8}s` }}>
          {it.e}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Section header ---------------- */
export function SectionHead({ kicker, title, action }: { kicker?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {kicker && <div className="text-xs font-bold uppercase tracking-[0.2em] text-saffron mb-1.5">{kicker}</div>}
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <span className="text-5xl" aria-hidden="true">🍽️</span>
      <p className="text-mut max-w-xs">{text}</p>
    </div>
  );
}

export function StatBox({ label, value, icon, tone = "saffron" }: { label: string; value: ReactNode; icon: string; tone?: "saffron" | "herb" | "chili" | "teal" }) {
  const tones = { saffron: "text-saffron", herb: "text-herb", chili: "text-chili", teal: "text-teal" };
  return (
    <div className="bg-panel border border-line rounded-2xl p-4 card-hover">
      <div className={`mb-2 ${tones[tone]}`}><Icon name={icon} className="w-5 h-5" /></div>
      <div className="font-display font-extrabold text-xl leading-none">{value}</div>
      <div className="text-xs text-mut mt-1.5">{label}</div>
    </div>
  );
}
