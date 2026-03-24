import { useState, useEffect } from "react";

// ── Character sets ──────────────────────────────────────────────────────────

const CHARSET_UPPER   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARSET_LOWER   = "abcdefghijklmnopqrstuvwxyz";
const CHARSET_NUMBERS = "0123456789";
const CHARSET_SYMBOLS = "!@#$%^&*_+-=|;:,.?";

const SIMILAR_RE = /[0Ol1I]/g;

// ── Types ───────────────────────────────────────────────────────────────────

interface CharOpts {
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildCharset(opts: CharOpts, excludeSimilar: boolean): string {
  let s = "";
  if (opts.upper)   s += CHARSET_UPPER;
  if (opts.lower)   s += CHARSET_LOWER;
  if (opts.numbers) s += CHARSET_NUMBERS;
  if (opts.symbols) s += CHARSET_SYMBOLS;
  if (excludeSimilar) s = s.replace(SIMILAR_RE, "");
  return [...new Set(s)].join("");
}

function generatePassword(length: number, opts: CharOpts, excludeSimilar: boolean): string {
  const charset = buildCharset(opts, excludeSimilar);
  if (!charset) return "";
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => charset[n % charset.length]).join("");
}

function calcEntropy(length: number, opts: CharOpts, excludeSimilar: boolean): number {
  const size = buildCharset(opts, excludeSimilar).length;
  if (size === 0) return 0;
  return length * Math.log2(size);
}

function entropyToStrength(bits: number): number {
  return Math.min(100, Math.round((bits / 128) * 100));
}

function strengthLabel(pct: number): string {
  if (pct < 20) return "Very Weak";
  if (pct < 40) return "Weak";
  if (pct < 60) return "Moderate";
  if (pct < 80) return "Strong";
  if (pct < 95) return "Very Strong";
  return "Maximum Strength";
}

function strengthClasses(pct: number): { text: string; badge: string } {
  if (pct < 40)
    return { text: "text-error", badge: "bg-error/15 text-error" };
  if (pct < 70)
    return {
      text: "text-on-surface-variant",
      badge: "bg-outline-variant/30 text-on-surface-variant",
    };
  return { text: "text-primary", badge: "bg-primary/15 text-primary" };
}

// ── Sub-component: CharCard ──────────────────────────────────────────────────

interface CharCardProps {
  icon: string;
  label: string;
  sub: string;
  active: boolean;
  onToggle: () => void;
}

function CharCard({ icon, label, sub, active, onToggle }: CharCardProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer select-none
        ${
          active
            ? "border-primary bg-primary/10 text-primary"
            : "border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-outline-variant"
        }`}
    >
      <span
        className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center transition-all
          ${active ? "bg-primary" : "border border-outline-variant/40"}`}
      >
        {active && (
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-on-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6.5 4.5,9.5 10.5,2.5" />
          </svg>
        )}
      </span>
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-wide">{label}</p>
        <p className="text-[0.55rem] opacity-60 font-mono mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

const DEFAULT_OPTS: CharOpts = { upper: true, lower: true, numbers: true, symbols: true };
const DEFAULT_LEN  = 32;
const MAX_LEN      = 48;

export default function PasswordGenerator() {
  const [length,         setLength]         = useState(DEFAULT_LEN);
  const [opts,           setOpts]           = useState<CharOpts>(DEFAULT_OPTS);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password,       setPassword]       = useState(() =>
    generatePassword(DEFAULT_LEN, DEFAULT_OPTS, false),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPassword(generatePassword(length, opts, excludeSimilar));
  }, [length, opts, excludeSimilar]);

  function regen() {
    setPassword(generatePassword(length, opts, excludeSimilar));
  }

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const entropy  = calcEntropy(length, opts, excludeSimilar);
  const strength = entropyToStrength(entropy);
  const label    = strengthLabel(strength);
  const sc       = strengthClasses(strength);

  const charCards = [
    { key: "upper"   as const, icon: "title",       label: "Uppercase", sub: "A – Z" },
    { key: "lower"   as const, icon: "text_fields", label: "Lowercase", sub: "a – z" },
    { key: "numbers" as const, icon: "pin",          label: "Numbers",   sub: "0 – 9" },
    { key: "symbols" as const, icon: "tag",          label: "Symbols",   sub: "!@#$…" },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-10 shadow-[0_12px_40px_-10px_rgba(25,28,30,0.08)]">

      {/* ── Password display ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-surface-container-low rounded-xl px-4 sm:px-5 py-4 mb-8 border border-outline-variant/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-primary text-2xl shrink-0">
            shield
          </span>
          <p className="flex-1 font-mono text-sm text-on-surface whitespace-nowrap overflow-x-auto min-w-0">
            {password || (
              <span className="text-on-surface-variant italic text-xs">
                Select at least one character type
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={regen}
            aria-label="Regenerate password"
            className="flex items-center justify-center p-2.5 bg-surface-container-high text-on-surface-variant rounded hover:bg-surface-container-highest hover:text-primary active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-sm leading-none">refresh</span>
          </button>
          <button
            onClick={copy}
            className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm leading-none">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* ── Length slider ────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            Password Length
          </span>
          <span className="text-3xl font-headline font-black text-primary tabular-nums leading-none">
            {length}
          </span>
        </div>
        <input
          type="range"
          min={8}
          max={MAX_LEN}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-container-high
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[0.6rem] text-on-surface-variant/50 font-medium">8</span>
          <span className="text-[0.6rem] text-on-surface-variant/50 font-medium">{MAX_LEN}</span>
        </div>
      </div>

      {/* ── Character types + Strength ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* 2×2 char cards */}
        <div className="grid grid-cols-2 gap-3">
          {charCards.map(({ key, icon, label, sub }) => (
            <CharCard
              key={key}
              icon={icon}
              label={label}
              sub={sub}
              active={opts[key]}
              onToggle={() => setOpts((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          ))}
        </div>

        {/* Strength panel */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-1 text-center">
            Strength
          </span>
          <div className={`text-5xl font-headline font-black tracking-tighter leading-none my-2 ${sc.text}`}>
            {strength}%
          </div>
          <span className={`text-[0.58rem] font-bold uppercase tracking-[0.08em] px-2.5 py-0.5 rounded-full text-center ${sc.badge}`}>
            {label}
          </span>
          <p className="text-[0.58rem] text-on-surface-variant/50 mt-1.5 font-mono text-center">
            ~{Math.round(entropy)} bits
          </p>
        </div>
      </div>

      {/* ── Exclusions ───────────────────────────────────────────── */}
      <div className="pt-6 border-t border-outline-variant/15">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant mb-4 block">
          Easy Exclusions
        </span>
        <label className="flex items-start gap-3 cursor-pointer group" onClick={() => setExcludeSimilar((prev) => !prev)}>
          <div
            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
              ${
                excludeSimilar
                  ? "bg-primary border-primary"
                  : "border-outline-variant/50 group-hover:border-primary"
              }`}
          >
              {excludeSimilar && (
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-on-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1.5,6.5 4.5,9.5 10.5,2.5" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface leading-none mb-1">
                Similar-looking characters
              </p>
              <p className="text-[0.65rem] text-on-surface-variant font-mono">Removes 0, O, l, 1, I</p>
            </div>
          </label>
      </div>

    </div>
  );
}
