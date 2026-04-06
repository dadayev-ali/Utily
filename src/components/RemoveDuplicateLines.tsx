import { useState, useCallback, useEffect } from "react";

interface Stats {
  total: number;
  unique: number;
  duplicates: number;
  reduction: number;
}

function processLines(
  text: string,
  caseSensitive: boolean,
  trimWhitespace: boolean,
  sortAlpha: boolean,
): { result: string; stats: Stats } {
  const lines = text.split("\n");
  const total = lines.length;

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const line of lines) {
    const processed = trimWhitespace ? line.trim() : line;
    const key = caseSensitive ? processed : processed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(processed);
    }
  }

  let result = sortAlpha
    ? [...unique].sort((a, b) => a.localeCompare(b))
    : unique;
  const resultText = result.join("\n");

  return {
    result: resultText,
    stats: {
      total,
      unique: unique.length,
      duplicates: total - unique.length,
      reduction:
        total > 0 ? Math.round(((total - unique.length) / total) * 100) : 0,
    },
  };
}

export default function RemoveDuplicateLines() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  const lineCount = input ? input.split("\n").length : 0;

  const handleRemove = useCallback(() => {
    if (!input.trim()) return;
    const { result, stats } = processLines(
      input,
      caseSensitive,
      trimWhitespace,
      sortAlpha,
    );
    setOutput(result);
    setStats(stats);
    setHasProcessed(true);
  }, [input, caseSensitive, trimWhitespace, sortAlpha]);

  useEffect(() => {
    if (!hasProcessed) return;
    if (!input.trim()) {
      setOutput("");
      setStats(null);
      return;
    }
    const { result, stats } = processLines(
      input,
      caseSensitive,
      trimWhitespace,
      sortAlpha,
    );
    setOutput(result);
    setStats(stats);
  }, [input, caseSensitive, trimWhitespace, sortAlpha, hasProcessed]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setStats(null);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deduplicated.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const CHIP =
    "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors select-none">
        {label}
      </span>
      <div
        className={`w-10 h-5.5 rounded-full flex items-center px-0.5 transition-colors duration-200 shrink-0 ${
          checked ? "bg-primary" : "bg-outline-variant"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Input + Output */}
      <div className="lg:col-span-8 space-y-5">
        {/* Input */}
        <div className="relative bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
          <div className="absolute top-3 right-5 flex items-center gap-2 z-10">
            <button
              onClick={handlePaste}
              className={`${CHIP} bg-secondary-container text-on-secondary-container`}
            >
              <span className="material-symbols-outlined text-sm">
                content_paste
              </span>
              Paste
            </button>
            <button
              onClick={handleClear}
              className={`${CHIP} bg-error-container/40 text-error`}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Paste your list here..."}
            spellCheck={false}
            className="w-full h-72 bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none placeholder:text-on-surface-variant/40 focus:shadow-none"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <div className="absolute bottom-3 right-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/30">
              {lineCount > 0
                ? `${lineCount} ${lineCount === 1 ? "line" : "lines"}`
                : "empty buffer"}
            </span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRemove}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-base">
              filter_list
            </span>
            Remove Duplicates
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="relative bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={handleCopy}
                className={`${CHIP} bg-secondary-container text-on-secondary-container`}
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                className={`${CHIP} bg-secondary-container text-on-secondary-container`}
              >
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
                Download
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              className="w-full h-64 bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        )}
      </div>

      {/* Right: Stats + Settings */}
      <div className="lg:col-span-4 space-y-5">
        {/* Stats */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">
              analytics
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Results
            </span>
          </div>
          <div className="p-5 space-y-3">
            {[
              {
                label: "Total Lines",
                value: stats ? String(stats.total) : "—",
              },
              {
                label: "Unique Lines",
                value: stats ? String(stats.unique) : "—",
              },
              {
                label: "Duplicates Found",
                value: stats ? String(stats.duplicates) : "—",
              },
              {
                label: "Data Reduction",
                value: stats ? `${stats.reduction}%` : "—",
                accent: true,
              },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="flex justify-between items-center py-2.5 border-b border-outline-variant/10 last:border-0"
              >
                <span className="text-sm text-on-surface-variant">{label}</span>
                <span
                  className={`text-sm font-bold ${
                    accent && stats && stats.reduction > 0
                      ? "text-primary"
                      : "text-on-surface"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">
              settings
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Options
            </span>
          </div>
          <div className="p-5 space-y-4">
            <Toggle
              label="Case Sensitive"
              checked={caseSensitive}
              onChange={setCaseSensitive}
            />
            <Toggle
              label="Trim Whitespace"
              checked={trimWhitespace}
              onChange={setTrimWhitespace}
            />
            <Toggle
              label="Alphabetical Sort"
              checked={sortAlpha}
              onChange={setSortAlpha}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
