import { useState, useMemo } from "react";

// ── Stats ─────────────────────────────────────────────────────────────────────

function analyze(text: string) {
  const words       = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const chars       = text.length;
  const charsNoSpace= text.replace(/\s/g, "").length;
  const sentences   = text.trim() === "" ? 0 : (text.match(/[^.!?]*[.!?]+/g) ?? []).length;
  const paragraphs  = text.trim() === "" ? 0 : text.trim().split(/\n\s*\n+/).filter(p => p.trim()).length;
  const pages       = Math.ceil(words / 250) || 0;

  return { words, chars, charsNoSpace, sentences, paragraphs, pages };
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-end justify-between border-b border-outline-variant/10 pb-3 sm:pb-4 last:border-0 last:pb-0">
      <span className="font-label text-[0.65rem] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </span>
      <span className={`font-headline text-2xl sm:text-3xl font-bold ${highlight ? "text-primary dark:text-[#a9c7ff]" : "text-on-surface dark:text-[#f8f9fb]"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => analyze(text), [text]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
      {/* ── Left: Textarea ── */}
      <div className="lg:col-span-8 space-y-3">
        <div className="bg-surface-container dark:bg-[#2e3133] rounded-xl overflow-hidden border border-outline-variant/10 shadow-lg focus-within:ring-1 focus-within:ring-primary transition-all">
          <label className="block px-4 sm:px-6 pt-3 sm:pt-4 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant/60">
            Your Text
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start typing or paste your content here..."
            className="w-full h-64 sm:h-80 lg:h-[500px] bg-transparent !border-0 !ring-0 !shadow-none !outline-none focus:!border-0 focus:!ring-0 focus:!shadow-none text-sm sm:text-base lg:text-lg leading-relaxed font-body text-on-surface dark:text-[#f8f9fb] p-4 sm:p-6 pt-2 resize-none placeholder:text-outline/40"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setText("")}
            className="text-primary hover:text-primary/70 font-label font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Clear
          </button>
        </div>
      </div>

      {/* ── Right: Stats ── */}
      <div className="lg:col-span-4 space-y-4 sm:space-y-6">
        {/* Main stats card */}
        <div className="bg-surface-container dark:bg-[#2e3133] rounded-xl p-5 sm:p-8 border border-outline-variant/10 shadow-lg">
          <div className="space-y-4 sm:space-y-6">
            <StatRow label="Words"               value={stats.words} />
            <StatRow label="Characters"          value={stats.chars} />
            <StatRow label="Chars (no spaces)"   value={stats.charsNoSpace} />
            <StatRow label="Sentences"           value={stats.sentences} />
            <StatRow label="Paragraphs"          value={stats.paragraphs} />
            <StatRow label="Pages"               value={stats.pages} />
          </div>
        </div>

{/* Info card */}
        <div className="bg-surface-container dark:bg-[#2e3133]/60 rounded-xl p-4 sm:p-6 border border-outline-variant/10">
          <div className="flex items-start gap-3 sm:gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
            <p className="text-[0.65rem] sm:text-xs leading-relaxed">
              Page count is estimated at 250 words per page (standard manuscript format).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
