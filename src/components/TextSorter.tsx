import { useState, useCallback, useEffect, useRef } from "react";

type SortMode = "az" | "za" | "len-asc" | "len-desc" | "reverse" | "shuffle";

interface SortOption {
  id: SortMode;
  icon: string;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { id: "az",       icon: "sort_by_alpha",  label: "A → Z"         },
  { id: "za",       icon: "sort_by_alpha",  label: "Z → A"         },
  { id: "len-asc",  icon: "height",         label: "Shortest first" },
  { id: "len-desc", icon: "height",         label: "Longest first"  },
  { id: "reverse",  icon: "swap_vert",      label: "Reverse order"  },
  { id: "shuffle",  icon: "shuffle",        label: "Shuffle"        },
];

const SAMPLE = `Banana
apple
Cherry
date
Elderberry
fig
Grape
avocado
Mango
blueberry`;

interface Stats {
  lines: number;
  words: number;
  unique: number;
}

function sortLines(
  text: string,
  mode: SortMode,
  caseSensitive: boolean,
  trimWhitespace: boolean,
  removeEmpty: boolean,
): { result: string; stats: Stats } {
  let lines = text.split("\n");

  if (trimWhitespace) lines = lines.map(l => l.trim());
  if (removeEmpty) lines = lines.filter(l => l !== "");

  const compare = (a: string, b: string) => {
    const ka = caseSensitive ? a : a.toLowerCase();
    const kb = caseSensitive ? b : b.toLowerCase();
    return ka.localeCompare(kb, undefined, { numeric: true });
  };

  let sorted: string[];
  switch (mode) {
    case "az":       sorted = [...lines].sort(compare); break;
    case "za":       sorted = [...lines].sort((a, b) => compare(b, a)); break;
    case "len-asc":  sorted = [...lines].sort((a, b) => a.length - b.length || compare(a, b)); break;
    case "len-desc": sorted = [...lines].sort((a, b) => b.length - a.length || compare(a, b)); break;
    case "reverse":  sorted = [...lines].reverse(); break;
    case "shuffle":  sorted = [...lines].sort(() => Math.random() - 0.5); break;
    default:         sorted = lines;
  }

  const result = sorted.join("\n");
  const words = result.split(/\s+/).filter(Boolean).length;
  const unique = new Set(sorted.map(l => caseSensitive ? l : l.toLowerCase())).size;

  return { result, stats: { lines: sorted.length, words, unique } };
}

export default function TextSorter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [mode, setMode] = useState<SortMode>("az");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setInput(e.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const runSort = useCallback((text: string, m: SortMode, cs: boolean, tr: boolean, re: boolean) => {
    if (!text.trim()) { setOutput(""); setStats(null); return; }
    const { result, stats } = sortLines(text, m, cs, tr, re);
    setOutput(result);
    setStats(stats);
  }, []);

  // Auto re-sort after first manual sort
  useEffect(() => {
    if (!hasProcessed) return;
    runSort(input, mode, caseSensitive, trimWhitespace, removeEmpty);
  }, [input, mode, caseSensitive, trimWhitespace, removeEmpty, hasProcessed, runSort]);

  const handleSort = () => {
    runSort(input, mode, caseSensitive, trimWhitespace, removeEmpty);
    setHasProcessed(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sorted.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => { setInput(""); setOutput(""); setStats(null); setHasProcessed(false); };

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors select-none">{label}</span>
      <div
        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 shrink-0 ${checked ? "bg-primary" : "bg-outline-variant"}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </label>
  );

  const OptionsPanel = () => (
    <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-primary text-xl">settings</span>
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Options</span>
      </div>
      <div className="p-5 space-y-4">
        <Toggle label="Case Sensitive"    checked={caseSensitive}  onChange={setCaseSensitive}  />
        <Toggle label="Trim Whitespace"   checked={trimWhitespace} onChange={setTrimWhitespace} />
        <Toggle label="Remove Empty Lines" checked={removeEmpty}   onChange={setRemoveEmpty}    />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Options — mobile only (top) */}
      <div className="lg:hidden">
        <OptionsPanel />
      </div>

      {/* ── Main grid: Input | Controls | Output ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Input */}
        <div
          className={`lg:col-span-5 flex flex-col bg-surface-container border rounded-xl overflow-hidden transition-colors ${dragging ? "border-primary bg-primary/5" : "border-outline-variant/30"}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) loadFile(file); }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Input</span>
            <div className="flex items-center gap-2">
              <button onClick={async () => setInput(await navigator.clipboard.readText())} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                <span className="material-symbols-outlined text-sm">content_paste</span>Paste
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`${CHIP} bg-surface-container-high text-on-surface-variant`}>
                <span className="material-symbols-outlined text-sm">upload_file</span>Import
              </button>
              <button onClick={handleClear} className={`${CHIP} bg-error-container/40 text-error`}>
                <span className="material-symbols-outlined text-sm">delete</span>Clear
              </button>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".txt,.csv,.log,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={dragging ? "Drop your file here…" : "Paste your lines here or drop a file…"}
              spellCheck={false}
              className="w-full h-72 lg:h-full min-h-72 bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none placeholder:text-on-surface-variant/40"
              style={{ outline: "none", boxShadow: "none" }}
            />
            <span className="absolute bottom-3 right-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/30">
              {input ? `${input.split("\n").length} lines` : "empty"}
            </span>
          </div>
        </div>

        {/* Center controls */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Sort mode buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  mode === opt.id
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg leading-none shrink-0"
                  style={opt.id === "za" ? { transform: "scaleX(-1)" } : undefined}
                >
                  {opt.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{opt.label}</span>
              </button>
            ))}
          </div>
          {/* Sort button */}
          <button
            onClick={handleSort}
            className="flex items-center justify-center gap-1.5 w-full px-4 py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">sort</span>
            Sort
          </button>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 flex flex-col bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Output</span>
            {output && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                  <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={handleDownload} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                  <span className="material-symbols-outlined text-sm">download</span>Download
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              placeholder="Sorted output will appear here…"
              className="w-full h-72 lg:h-full min-h-72 bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none placeholder:text-on-surface-variant/25"
              style={{ outline: "none", boxShadow: "none" }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom row: Stats + Options ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Stats */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">analytics</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Stats</span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-outline-variant/10">
            {[
              { label: "Lines",   value: stats?.lines  ?? "—" },
              { label: "Words",   value: stats?.words  ?? "—" },
              { label: "Unique",  value: stats?.unique ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center justify-center py-5 gap-1">
                <span className="text-2xl font-extrabold text-on-surface font-headline">{value}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Options — desktop only */}
        <div className="hidden lg:block">
          <OptionsPanel />
        </div>
      </div>
    </div>
  );
}
