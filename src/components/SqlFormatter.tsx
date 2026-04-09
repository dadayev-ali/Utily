import { useState, useCallback, useRef } from "react";

// ── SQL Processing ────────────────────────────────────────────────────────────

const KEYWORDS = [
  "SELECT","DISTINCT","FROM","WHERE","AND","OR","NOT","IN","BETWEEN","LIKE","IS","NULL",
  "EXISTS","CASE","WHEN","THEN","ELSE","END","AS","ASC","DESC","WITH",
  "INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL JOIN","CROSS JOIN","JOIN","ON",
  "GROUP BY","ORDER BY","HAVING","LIMIT","OFFSET",
  "UNION ALL","UNION","INTERSECT","EXCEPT",
  "INSERT INTO","INSERT","INTO","VALUES","UPDATE","SET",
  "DELETE FROM","DELETE","CREATE TABLE","ALTER TABLE","DROP TABLE",
  "CREATE INDEX","CREATE VIEW","CREATE","TABLE","ALTER","DROP","INDEX","VIEW",
  "PRIMARY KEY","FOREIGN KEY","REFERENCES","CONSTRAINT","DEFAULT","NOT NULL",
  "UNIQUE","CHECK","AUTO_INCREMENT","SERIAL",
];

// Sort longest first so multi-word keywords match before single-word ones
const SORTED_KW = [...KEYWORDS].sort((a, b) => b.length - a.length);

function extractStrings(sql: string): { sql: string; strings: string[] } {
  const strings: string[] = [];
  const out = sql.replace(/'(?:[^'\\]|\\.)*'/g, (m) => {
    strings.push(m);
    return `\x00STR${strings.length - 1}\x00`;
  });
  return { sql: out, strings };
}

function restoreStrings(sql: string, strings: string[]): string {
  return sql.replace(/\x00STR(\d+)\x00/g, (_, i) => strings[+i]);
}

function removeComments(sql: string): string {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  sql = sql.replace(/--[^\n]*/g, "");
  return sql;
}

function uppercaseKeywords(sql: string): string {
  for (const kw of SORTED_KW) {
    const escaped = kw.replace(/\s+/g, "\\s+");
    sql = sql.replace(new RegExp(`\\b${escaped}\\b`, "gi"), kw);
  }
  return sql;
}

const NEWLINE_CLAUSES = [
  "INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL JOIN","CROSS JOIN","JOIN",
  "GROUP BY","ORDER BY","HAVING","LIMIT","OFFSET",
  "UNION ALL","UNION","INTERSECT","EXCEPT",
  "WHERE","FROM","SELECT","DISTINCT","ON",
  "INSERT INTO","VALUES","UPDATE","SET","DELETE FROM",
  "WHEN","THEN","ELSE","END",
].sort((a, b) => b.length - a.length);

function beautify(sql: string): string {
  const { sql: noStr, strings } = extractStrings(sql);
  let s = noStr.replace(/\s+/g, " ").trim();
  s = uppercaseKeywords(s);

  for (const kw of NEWLINE_CLAUSES) {
    const esc = kw.replace(/\s+/g, "\\s+");
    s = s.replace(new RegExp(`\\b(${esc})\\b`, "g"), "\n$1");
  }

  // Indent AND / OR under WHERE / HAVING / ON
  s = s.replace(/\n(AND|OR)\b/g, "\n    $1");

  // Indent SELECT columns (comma-separated after SELECT)
  s = s.replace(/\bSELECT\n?(.+?)(?=\nFROM)/gs, (_, cols) => {
    const formatted = cols.split(",").map((c: string, i: number) =>
      i === 0 ? `SELECT ${c.trim()}` : `    , ${c.trim()}`
    ).join("\n");
    return formatted;
  });

  s = restoreStrings(s, strings);
  return s.trim();
}

function minify(sql: string): string {
  const { sql: noStr, strings } = extractStrings(removeComments(sql));
  const s = noStr.replace(/\s+/g, " ").trim();
  return restoreStrings(s, strings);
}

function stripComments(sql: string): string {
  return removeComments(sql).replace(/^\s*\n/gm, "").trim();
}

// ── Syntax Highlighting ───────────────────────────────────────────────────────

interface Token { type: "keyword"|"string"|"number"|"comment"|"text"; value: string }

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    // Block comment
    if (sql.startsWith("/*", i)) {
      const end = sql.indexOf("*/", i + 2);
      const v = end === -1 ? sql.slice(i) : sql.slice(i, end + 2);
      tokens.push({ type: "comment", value: v });
      i += v.length; continue;
    }
    // Line comment
    if (sql.startsWith("--", i)) {
      const nl = sql.indexOf("\n", i);
      const v = nl === -1 ? sql.slice(i) : sql.slice(i, nl);
      tokens.push({ type: "comment", value: v });
      i += v.length; continue;
    }
    // String
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === "'" && sql[j-1] !== "\\")) j++;
      const v = sql.slice(i, j + 1);
      tokens.push({ type: "string", value: v });
      i += v.length; continue;
    }
    // Number
    if (/\d/.test(sql[i]) && (i === 0 || /\W/.test(sql[i-1]))) {
      let j = i;
      while (j < sql.length && /[\d.]/.test(sql[j])) j++;
      tokens.push({ type: "number", value: sql.slice(i, j) });
      i = j; continue;
    }
    // Keyword (try longest first)
    let matched = false;
    for (const kw of SORTED_KW) {
      if (sql.slice(i, i + kw.length).toUpperCase() === kw) {
        const after = sql[i + kw.length];
        if (!after || /\W/.test(after)) {
          tokens.push({ type: "keyword", value: sql.slice(i, i + kw.length) });
          i += kw.length; matched = true; break;
        }
      }
    }
    if (matched) continue;
    // Text
    const last = tokens[tokens.length - 1];
    if (last?.type === "text") last.value += sql[i];
    else tokens.push({ type: "text", value: sql[i] });
    i++;
  }
  return tokens;
}

const TOKEN_CLASS: Record<string, string> = {
  keyword: "text-sky-400 font-bold",
  string:  "text-emerald-400",
  number:  "text-orange-400",
  comment: "text-on-surface-variant/40 italic",
  text:    "text-on-surface",
};

function HighlightedSQL({ sql }: { sql: string }) {
  const tokens = tokenize(sql);
  return (
    <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-all">
      {tokens.map((t, i) => (
        <span key={i} className={TOKEN_CLASS[t.type]}>{t.value}</span>
      ))}
    </pre>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SqlFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setInput(e.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  const run = useCallback((action: "beautify" | "minify" | "strip") => {
    if (!input.trim()) return;
    setActiveAction(action);
    if (action === "beautify") setOutput(beautify(input));
    else if (action === "minify") setOutput(minify(input));
    else setOutput(stripComments(input));
  }, [input]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "formatted.sql"; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = output ? {
    lines: output.split("\n").length,
    chars: output.length,
    keywords: (output.match(/\b(SELECT|FROM|WHERE|JOIN|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT)\b/gi) ?? []).length,
  } : null;

  return (
    <div className="space-y-5">
      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Input */}
        <div
          className={`lg:col-span-5 flex flex-col bg-surface-container border rounded-xl overflow-hidden transition-colors ${dragging ? "border-primary bg-primary/5" : "border-outline-variant/30"}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        >
          <input ref={fileInputRef} type="file" accept=".sql,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Raw SQL Input</span>
            <div className="flex items-center gap-2">
              <button onClick={async () => setInput(await navigator.clipboard.readText())} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                <span className="material-symbols-outlined text-sm">content_paste</span>Paste
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`${CHIP} bg-surface-container-high text-on-surface-variant`}>
                <span className="material-symbols-outlined text-sm">upload_file</span>Import
              </button>
              <button onClick={() => { setInput(""); setOutput(""); setActiveAction(null); }} className={`${CHIP} bg-error-container/40 text-error`}>
                <span className="material-symbols-outlined text-sm">delete</span>Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"-- Paste your unformatted SQL here...\nSELECT * FROM users WHERE active = 1;"}
            spellCheck={false}
            className="flex-1 w-full min-h-80 bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-6 resize-none placeholder:text-on-surface-variant/30"
            style={{ outline: "none", boxShadow: "none" }}
          />
        </div>

        {/* Center Controls */}
        <div className="lg:col-span-2 flex lg:flex-col items-center justify-start lg:pt-10 gap-3">
          <button
            onClick={() => run("beautify")}
            className={`w-full flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
              activeAction === "beautify"
                ? "bg-primary text-on-primary border-primary shadow-lg"
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-xl">auto_fix_high</span>
            Beautify
          </button>
          <button
            onClick={() => run("minify")}
            className={`w-full flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
              activeAction === "minify"
                ? "bg-primary text-on-primary border-primary shadow-lg"
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-xl">compress</span>
            Minify
          </button>
          <button
            onClick={() => run("strip")}
            className={`w-full flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border whitespace-nowrap ${
              activeAction === "strip"
                ? "bg-primary text-on-primary border-primary shadow-lg"
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-xl">comments_disabled</span>
            Strip Comments
          </button>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 flex flex-col bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/20 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Formatted Output</span>
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
          <div className="flex-1 p-5 min-h-80 overflow-auto">
            {output
              ? <HighlightedSQL sql={output} />
              : <p className="text-on-surface-variant/30 italic text-sm font-mono">Formatted SQL will appear here…</p>
            }
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden divide-x divide-outline-variant/10">
          {[
            { label: "Lines",    value: stats.lines    },
            { label: "Characters", value: stats.chars  },
            { label: "Keywords", value: stats.keywords },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center justify-center py-5 gap-1">
              <span className="text-2xl font-extrabold text-on-surface font-headline">{value}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
