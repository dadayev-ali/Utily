import { useState, useMemo } from "react";

interface Match {
  value: string;
  index: number;
  end: number;
  groups: string[];
}

const PRESETS: { label: string; icon: string; pattern: string; flags: string; sample: string }[] = [
  {
    label: "Email",
    icon: "alternate_email",
    pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    sample: "hello@example.com\nnot-an-email\nsupport@company.org\nfoo@bar",
  },
  {
    label: "URL",
    icon: "link",
    pattern: "https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z]{2,6}\\b([-a-zA-Z0-9@:%_+.~#?&/=]*)",
    flags: "g",
    sample: "Visit https://example.com or http://www.test.org/path?q=1\nNot a URL: ftp://old.com",
  },
  {
    label: "IP Address",
    icon: "router",
    pattern: "\\b((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
    flags: "g",
    sample: "Server: 192.168.1.1\nGateway: 10.0.0.1\nInvalid: 999.999.0.1\nLoopback: 127.0.0.1",
  },
  {
    label: "Date (ISO)",
    icon: "calendar_today",
    pattern: "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])",
    flags: "g",
    sample: "Event on 2024-01-15\nAnother on 2023-12-31\nInvalid: 2024-13-01 or 99-99-99",
  },
  {
    label: "Password",
    icon: "password",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$",
    flags: "m",
    sample: "StrongP@ss1\nweakpassword\nNoSpecial1\nAl1!abcd",
  },
];

const FLAG_DEFS = [
  { key: "g", label: "g", title: "Global — find all matches" },
  { key: "i", label: "i", title: "Case-insensitive" },
  { key: "m", label: "m", title: "Multiline anchors" },
  { key: "s", label: "s", title: "Dot matches newline" },
];

const FLAG_REFERENCE = [
  { flag: "g", desc: "Global — find all matches, not just first" },
  { flag: "i", desc: "Case-insensitive matching" },
  { flag: "m", desc: "^ and $ match start/end of each line" },
  { flag: "s", desc: "Dot (.) matches newline characters" },
  { flag: "u", desc: "Unicode mode for full Unicode support" },
];

// Highlight colors cycling
const HIGHLIGHT_COLORS = [
  "bg-yellow-400/30 text-yellow-200 outline outline-1 outline-yellow-400/50",
  "bg-sky-400/30 text-sky-200 outline outline-1 outline-sky-400/50",
  "bg-emerald-400/30 text-emerald-200 outline outline-1 outline-emerald-400/50",
  "bg-violet-400/30 text-violet-200 outline outline-1 outline-violet-400/50",
  "bg-rose-400/30 text-rose-200 outline outline-1 outline-rose-400/50",
];

function getMatches(pattern: string, flagStr: string, testStr: string): { matches: Match[]; error: string | null } {
  if (!pattern) return { matches: [], error: null };
  try {
    const flags = flagStr.includes("g") ? flagStr : flagStr + "g";
    const regex = new RegExp(pattern, flags);
    const matches: Match[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(testStr)) !== null) {
      matches.push({
        value: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: m.slice(1),
      });
      if (m[0].length === 0) regex.lastIndex++;
      if (matches.length > 500) break;
    }
    return { matches, error: null };
  } catch (e: unknown) {
    return { matches: [], error: e instanceof Error ? e.message : "Invalid regex" };
  }
}

function HighlightedText({ text, matches }: { text: string; matches: Match[] }) {
  if (!text) return <span className="text-on-surface-variant/30 italic text-sm">No test string…</span>;
  if (!matches.length) return <span className="font-mono text-sm text-on-surface whitespace-pre-wrap break-all">{text}</span>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) parts.push(<span key={`t${i}`} className="font-mono text-sm text-on-surface">{text.slice(cursor, m.index)}</span>);
    parts.push(
      <mark key={`m${i}`} className={`rounded px-0 font-mono text-sm ${HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]}`} style={{ background: "transparent" }}>
        {text.slice(m.index, m.end)}
      </mark>
    );
    cursor = m.end;
  });
  if (cursor < text.length) parts.push(<span key="tail" className="font-mono text-sm text-on-surface">{text.slice(cursor)}</span>);
  return <span className="whitespace-pre-wrap break-all">{parts}</span>;
}

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [testStr, setTestStr] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({ g: true, i: false, m: false, s: false });
  const [copied, setCopied] = useState(false);

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join("");

  const { matches, error } = useMemo(() => getMatches(pattern, flagStr, testStr), [pattern, flagStr, testStr]);

  const loadPreset = (p: typeof PRESETS[0]) => {
    setPattern(p.pattern);
    setTestStr(p.sample);
    const newFlags: Record<string, boolean> = { g: false, i: false, m: false, s: false };
    for (const f of p.flags) if (f in newFlags) newFlags[f] = true;
    setFlags(newFlags);
  };

  const toggleFlag = (key: string) => setFlags(f => ({ ...f, [key]: !f[key] }));

  const handleCopyMatches = () => {
    navigator.clipboard.writeText(matches.map(m => m.value).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ── Left Column ────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-5">

        {/* Presets */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Quick Presets</span>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => loadPreset(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/50 bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:border-primary/50 hover:text-primary cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-sm leading-none">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Input */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Pattern</span>
            <button
              onClick={async () => setPattern(await navigator.clipboard.readText())}
              className={`${CHIP} bg-secondary-container text-on-secondary-container`}
            >
              <span className="material-symbols-outlined text-sm">content_paste</span>
              Paste
            </button>
          </div>
          <div className="p-5 space-y-3">
            {/* Pattern row */}
            <div className="flex flex-col gap-2 bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold text-lg font-mono shrink-0">/</span>
                <input
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  placeholder="Enter your regex pattern…"
                  spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/40"
                  style={{ boxShadow: "none" }}
                />
                <span className="text-primary font-bold text-lg font-mono shrink-0">/</span>
              </div>
              {/* Flag toggles */}
              <div className="flex items-center gap-1">
                {FLAG_DEFS.map(({ key, label, title }) => (
                  <button
                    key={key}
                    title={title}
                    onClick={() => toggleFlag(key)}
                    className={`w-7 h-7 flex items-center justify-center rounded font-bold text-xs font-mono transition-colors cursor-pointer ${
                      flags[key]
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error-container/30 border border-error/30">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <span className="text-error text-xs font-mono">{error}</span>
              </div>
            )}

            {/* Match count badge */}
            {!error && pattern && (
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  matches.length > 0 ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {matches.length} {matches.length === 1 ? "match" : "matches"}
                </span>
                {matches.length > 0 && (
                  <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider font-bold">found</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test String */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Test String</span>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => setTestStr(await navigator.clipboard.readText())}
                className={`${CHIP} bg-secondary-container text-on-secondary-container`}
              >
                <span className="material-symbols-outlined text-sm">content_paste</span>
                Paste
              </button>
              <button
                onClick={() => setTestStr("")}
                className={`${CHIP} bg-error-container/40 text-error`}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={testStr}
            onChange={e => setTestStr(e.target.value)}
            placeholder="Paste your test string here…"
            spellCheck={false}
            rows={7}
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none placeholder:text-on-surface-variant/40"
            style={{ outline: "none", boxShadow: "none" }}
          />
        </div>

        {/* Highlighted Preview */}
        {testStr && (
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant/20">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Preview</span>
            </div>
            <div className="p-5 min-h-[80px]">
              <HighlightedText text={testStr} matches={matches} />
            </div>
          </div>
        )}
      </div>

      {/* ── Right Column ─────────────────────────────────────────────── */}
      <div className="lg:col-span-4 space-y-5">

        {/* Match Results */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">search</span>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Matches</span>
            </div>
            {matches.length > 0 && (
              <button onClick={handleCopyMatches} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied" : "Copy all"}
              </button>
            )}
          </div>
          <div className="p-5">
            {!pattern ? (
              <p className="text-on-surface-variant/40 text-xs italic">Enter a pattern to see matches…</p>
            ) : error ? (
              <p className="text-error text-xs italic">Fix the pattern error first.</p>
            ) : matches.length === 0 ? (
              <p className="text-on-surface-variant/40 text-xs italic">No matches found.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-surface-container-high border-l-2 border-primary/60"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                        Match {i + 1}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/50 font-mono">
                        {m.index}–{m.end}
                      </span>
                    </div>
                    <code className="text-xs text-on-surface break-all">{m.value}</code>
                    {m.groups.filter(Boolean).length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {m.groups.filter(Boolean).map((g, gi) => (
                          <div key={gi} className="flex items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/50 font-bold">G{gi + 1}</span>
                            <code className="text-[11px] text-on-surface-variant">{g}</code>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flag Reference */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Flag Reference</span>
          </div>
          <div className="p-5 space-y-3">
            {FLAG_REFERENCE.map(({ flag, desc }) => (
              <div key={flag} className="flex items-start gap-3">
                <code className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-surface-container-high text-primary text-xs font-bold font-mono">
                  {flag}
                </code>
                <span className="text-xs text-on-surface-variant leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
