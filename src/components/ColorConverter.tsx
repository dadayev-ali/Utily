import { useState, useEffect, useCallback } from "react";

// ── Conversion helpers ──────────────────────────────────────────────────────

interface ParsedHex {
  r: number;
  g: number;
  b: number;
  a: number | null;
}

// Used during live typing: always left-pads, never expands shorthand.
// This prevents jarring color jumps when typing through 3 or 4 chars.
function normalizeForLive(hex: string): string | null {
  const clean = hex.replace("#", "").trim().toLowerCase();
  if (clean.length === 0 || !/^[0-9a-f]+$/.test(clean)) return null;
  if (clean.length <= 6) return clean.padStart(6, "0");
  return clean.padStart(8, "0");
}

// Used on blur/commit: expands 3-char shorthand only, left-pads everything else.
// 4-char is NOT treated as RGBA shorthand — it left-pads like live typing.
function normalizeForCommit(hex: string): string | null {
  const clean = hex.replace("#", "").trim().toLowerCase();
  if (clean.length === 0 || !/^[0-9a-f]+$/.test(clean)) return null;
  if (clean.length === 3) {
    return clean.split("").map((c) => c + c).join("");
  }
  if (clean.length === 6 || clean.length === 8) return clean;
  if (clean.length <= 6) return clean.padStart(6, "0");
  return clean.padStart(8, "0");
}

function parseComponents(normalized: string): ParsedHex | null {
  if (normalized.length !== 6 && normalized.length !== 8) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: normalized.length === 8
      ? parseFloat((parseInt(normalized.slice(6, 8), 16) / 255).toFixed(2))
      : null,
  };
}

function parseHexLive(hex: string): ParsedHex | null {
  const normalized = normalizeForLive(hex);
  if (!normalized) return null;
  return parseComponents(normalized);
}

function parseHexCommit(hex: string): ParsedHex | null {
  const normalized = normalizeForCommit(hex);
  if (!normalized) return null;
  return parseComponents(normalized);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn)      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else                 h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return [0, 0, 0, 100];
  return [
    Math.round(((1 - rn - k) / (1 - k)) * 100),
    Math.round(((1 - gn - k) / (1 - k)) * 100),
    Math.round(((1 - bn - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ];
}

// Returns a CSS-valid color string from the raw hex input for the swatch only.
// Browsers natively support #RGB, #RGBA, #RRGGBB, #RRGGBBAA.
// Partial lengths (1,2,5,7) are invalid CSS — swatch keeps its last valid color.
function hexToSwatchColor(hex: string): string | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]+$/.test(clean)) return null;
  if ([3, 4, 6, 8].includes(clean.length)) return "#" + clean;
  return null;
}

function randomHex(): string {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()
  );
}

// ── Derive all formats from parsed components ───────────────────────────────

interface ColorState {
  hex: string;
  rgb: string;
  rgba: string | null;
  hsl: string;
  cmyk: string;
}

function fromParsed({ r, g, b, a }: ParsedHex): ColorState {
  const [h, s, l] = rgbToHsl(r, g, b);
  const [c, m, y, k] = rgbToCmyk(r, g, b);
  return {
    hex: rgbToHex(r, g, b),
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: a !== null ? `rgba(${r}, ${g}, ${b}, ${a})` : null,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`,
  };
}

// ── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ value, large }: { value: string; large?: boolean }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (large) {
    return (
      <button
        onClick={copy}
        className="p-3 sm:p-4 bg-primary-container hover:brightness-110 text-on-primary rounded-lg transition-all active:scale-95 border border-outline-variant/10 flex items-center justify-center"
        aria-label="Copy"
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {copied ? "check" : "content_copy"}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className="p-3 bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant rounded-lg transition-all active:scale-95 border border-outline-variant/10"
      aria-label="Copy"
    >
      <span className="material-symbols-outlined text-sm">
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ColorConverter() {
  const [color, setColor] = useState<ColorState>(() =>
    fromParsed({ r: 0, g: 71, b: 141, a: null })
  );
  const [hexInput, setHexInput] = useState(color.hex);
  const [swatchColor, setSwatchColor] = useState<string>(color.hex);

  function applyColor(next: ColorState) {
    setColor(next);
    setHexInput(next.hex);
    setSwatchColor(next.hex);
  }

  const randomize = useCallback(() => {
    const parsed = parseHexCommit(randomHex());
    if (parsed) applyColor(fromParsed(parsed));
  }, []);

  // Spacebar → random color
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.code === "Space" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        randomize();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomize]);

  // Live conversion as the user types in the HEX field
  function onHexChange(value: string) {
    setHexInput(value);
    let v = value.trim();
    if (!v.startsWith("#")) v = "#" + v;
    const clean = v.replace("#", "");
    if (clean.length === 0) return;
    const css = hexToSwatchColor(v);
    if (css) setSwatchColor(css);
    const parsed = parseHexLive(v);
    if (parsed) setColor(fromParsed(parsed));
  }

  // On blur: only commit the color state, never touch hexInput
  function onHexBlur() {
    let v = hexInput.trim();
    if (!v.startsWith("#")) v = "#" + v;
    const parsed = parseHexCommit(v);
    if (parsed) setColor(fromParsed(parsed));
    // invalid or partial input: leave hexInput as-is, color state unchanged
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-10 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.12)] border border-outline-variant/10">

      {/* Active Color + HEX input — combined row */}
      <div className="mb-8 sm:mb-10 bg-surface-container-low p-5 sm:p-8 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

          {/* Swatch + Active Color label */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Active Color
            </span>
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg shadow-xl"
              style={{ backgroundColor: swatchColor }}
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px self-stretch bg-outline-variant/20" />

          {/* HEX input */}
          <div className="w-full flex flex-col gap-2">
            <label className="block text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Hexadecimal
            </label>
            <div className="flex items-center gap-3">
              <input
                className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 sm:py-4 sm:px-6 text-base sm:text-xl font-headline font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                spellCheck={false}
                value={hexInput}
                onChange={(e) => onHexChange(e.target.value)}
                onBlur={onHexBlur}
              />
              <CopyButton value={color.hex} large />
            </div>
          </div>

        </div>
      </div>

      {/* Conversion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">

        {/* RGB — read-only */}
        <div className="md:col-span-6 bg-surface-container-low p-5 sm:p-8 rounded-xl border border-outline-variant/10 transition-all">
          <div className="mb-4 sm:mb-6">
            <label className="block text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
              RGB
            </label>
            <p className="text-[10px] text-on-surface-variant/60 font-label uppercase">
              Red, Green, Blue channels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              readOnly
              className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 font-mono text-sm text-on-surface outline-none cursor-default select-all"
              value={color.rgb}
            />
            <CopyButton value={color.rgb} />
          </div>
        </div>

        {/* RGBA — read-only, shown only when alpha is present */}
        {color.rgba && (
          <div className="md:col-span-6 bg-surface-container-low p-5 sm:p-8 rounded-xl border border-outline-variant/10 transition-all">
            <div className="mb-4 sm:mb-6">
              <label className="block text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                RGBA
              </label>
              <p className="text-[10px] text-on-surface-variant/60 font-label uppercase">
                Red, Green, Blue, Alpha
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                readOnly
                className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 font-mono text-sm text-on-surface outline-none cursor-default select-all"
                value={color.rgba}
              />
              <CopyButton value={color.rgba} />
            </div>
          </div>
        )}

        {/* HSL — read-only */}
        <div className="md:col-span-6 bg-surface-container-low p-5 sm:p-8 rounded-xl border border-outline-variant/10 transition-all">
          <div className="mb-4 sm:mb-6">
            <label className="block text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
              HSL
            </label>
            <p className="text-[10px] text-on-surface-variant/60 font-label uppercase">
              Hue, Saturation, Lightness
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              readOnly
              className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 font-mono text-sm text-on-surface outline-none cursor-default select-all"
              value={color.hsl}
            />
            <CopyButton value={color.hsl} />
          </div>
        </div>

        {/* CMYK — read-only, full width */}
        <div className="md:col-span-12 bg-surface-container-low p-5 sm:p-8 rounded-xl border border-outline-variant/10 transition-all">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="w-full md:w-1/3">
              <label className="block text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                CMYK
              </label>
              <p className="text-[10px] text-on-surface-variant/60 font-label uppercase">
                Cyan, Magenta, Yellow, Key
              </p>
            </div>
            <div className="w-full md:w-2/3 flex items-center gap-3">
              <input
                readOnly
                className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg py-3 px-4 font-mono text-sm text-on-surface outline-none cursor-default select-all"
                value={color.cmyk}
              />
              <CopyButton value={color.cmyk} />
            </div>
          </div>
        </div>
      </div>

      {/* Spacebar hint / Random button */}
      <div className="mt-10 sm:mt-12 flex flex-col items-center gap-6">
        <div className="h-px w-24 bg-outline-variant/20" />

        {/* Mobile & tablet: clickable button */}
        <button
          onClick={randomize}
          className="lg:hidden flex items-center gap-2 px-6 py-3 bg-surface-container-high border border-outline-variant/10 rounded-lg text-on-surface hover:text-primary hover:border-primary text-xs font-bold uppercase tracking-widest transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-base">shuffle</span>
          Random Color
        </button>

        {/* Desktop: spacebar hint */}
        <p className="hidden lg:flex font-label text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60 items-center gap-4">
          <span className="px-4 py-2 bg-surface-container-high border border-outline-variant/10 rounded-md text-on-surface font-black shadow-sm">
            SPACE
          </span>
          Hit spacebar to convert a random color
        </p>
      </div>
    </div>
  );
}
