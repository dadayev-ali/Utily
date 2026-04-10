import { useState, useRef, useCallback, useEffect } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

type IndentOption = "2" | "4" | "tab";

function getIndent(opt: IndentOption): string | number {
  if (opt === "tab") return "\t";
  return parseInt(opt);
}

function sortKeysDeep(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeysDeep);
  if (val !== null && typeof val === "object") {
    return Object.fromEntries(
      Object.keys(val as object)
        .sort()
        .map((k) => [k, sortKeysDeep((val as Record<string, unknown>)[k])])
    );
  }
  return val;
}

function jsonToTs(val: unknown, typeName = "Root", indent = 0): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);

  if (Array.isArray(val)) {
    if (val.length === 0) return "unknown[]";
    const itemType = jsonToTs(val[0], typeName + "Item", indent);
    return `${itemType}[]`;
  }

  if (val !== null && typeof val === "object") {
    const entries = Object.entries(val as object);
    if (entries.length === 0) return "Record<string, unknown>";
    const fields = entries
      .map(([k, v]) => `${inner}${k}: ${jsonToTs(v, k, indent + 1)};`)
      .join("\n");
    return `{\n${fields}\n${pad}}`;
  }

  if (val === null) return "null";
  if (typeof val === "boolean") return "boolean";
  if (typeof val === "number") return "number";
  if (typeof val === "string") return "string";
  return "unknown";
}

function buildTsInterfaces(val: unknown, rootName = "Root"): string {
  const interfaces: string[] = [];

  function collect(v: unknown, name: string) {
    if (Array.isArray(v)) {
      if (v.length > 0) collect(v[0], name + "Item");
      return;
    }
    if (v !== null && typeof v === "object") {
      const fields = Object.entries(v as object)
        .map(([k, child]) => {
          const typeName = k.charAt(0).toUpperCase() + k.slice(1);
          collect(child, typeName);
          return `  ${k}: ${jsonToTs(child, typeName)};`;
        })
        .join("\n");
      interfaces.push(`interface ${name} {\n${fields}\n}`);
    }
  }

  collect(val, rootName);
  return interfaces.join("\n\n");
}

// ── Syntax highlighting ──────────────────────────────────────────────────────

function highlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}\[\],])/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // key
          return `<span class="text-primary dark:text-primary-fixed">${escHtml(match)}</span>`;
        }
        // string value
        return `<span class="text-tertiary dark:text-tertiary-fixed-dim">${escHtml(match)}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span class="text-secondary dark:text-secondary-fixed">${escHtml(match)}</span>`;
      }
      if (/null/.test(match)) {
        return `<span class="text-outline">${escHtml(match)}</span>`;
      }
      if (/[{}\[\]]/.test(match)) {
        return `<span class="text-tertiary-container dark:text-tertiary-fixed">${escHtml(match)}</span>`;
      }
      // number
      return `<span class="text-error dark:text-error-container">${escHtml(match)}</span>`;
    }
  );
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Error position parser ─────────────────────────────────────────────────────

function parseErrorPos(
  msg: string,
  src: string
): { line: number; col: number } | null {
  const lcMatch = msg.match(/\(line (\d+) column (\d+)\)/);
  if (lcMatch) return { line: parseInt(lcMatch[1]), col: parseInt(lcMatch[2]) };

  const posMatch = msg.match(/at position (\d+)/);
  if (posMatch) {
    const pos = Math.min(parseInt(posMatch[1]), src.length);
    const before = src.slice(0, pos);
    const lines = before.split("\n");
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }
  return null;
}

// ── Sample data ──────────────────────────────────────────────────────────────

const SAMPLE = `{
  "project": "modernist_villa_v2",
  "architect": "The Digital Architect",
  "version": 3,
  "active": true,
  "coordinates": [40.7128, -74.006],
  "materials": {
    "primary": "reinforced_concrete",
    "secondary": "glass",
    "accent": null
  },
  "units": 12
}`;

// ── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ getValue }: { getValue: () => string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const val = getValue();
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-fixed hover:opacity-80 transition-opacity"
    >
      <span className="material-symbols-outlined text-sm">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type Mode = "format" | "minify" | "sort" | "ts";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputRaw, setOutputRaw] = useState("");
  const [indent, setIndent] = useState<IndentOption>("2");
  const [error, setError] = useState<string | null>(null);
  const [errorPos, setErrorPos] = useState<{ line: number; col: number } | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [mode, setMode] = useState<Mode>("format");
  const [indentOpen, setIndentOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const indentDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (indentDropdownRef.current && !indentDropdownRef.current.contains(e.target as Node)) {
        setIndentOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const process = useCallback(
    (src: string, m: Mode, ind: IndentOption) => {
      const trimmed = src.trim();
      if (!trimmed) {
        setOutput("");
        setOutputRaw("");
        setError(null);
        return;
      }
      try {
        const parsed = JSON.parse(trimmed);
        let result = "";

        if (m === "minify") {
          result = JSON.stringify(parsed);
        } else if (m === "sort") {
          result = JSON.stringify(sortKeysDeep(parsed), null, getIndent(ind));
        } else if (m === "ts") {
          result = buildTsInterfaces(parsed);
          setOutputRaw(result);
          setOutput(escHtml(result));
          setError(null);
          return;
        } else {
          result = JSON.stringify(parsed, null, getIndent(ind));
        }

        setOutputRaw(result);
        setOutput(highlight(result));
        setError(null);
        setErrorPos(null);
      } catch (e: unknown) {
        const msg = (e as Error).message;
        setError(msg);
        setErrorPos(parseErrorPos(msg, trimmed));
        setErrorDismissed(false);
        setOutputRaw("");
        setOutput("");
      }
    },
    []
  );

  function run(m: Mode) {
    setMode(m);
    process(input, m, indent);
  }

  function onIndentChange(val: IndentOption) {
    setIndent(val);
    process(input, mode, val);
  }

  function onInputChange(val: string) {
    setInput(val);
    process(val, mode, indent);
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      process(text, mode, indent);
    } catch {
      // clipboard access denied — no-op
    }
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(text);
      process(text, mode, indent);
    };
    reader.readAsText(file);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function jumpToError() {
    if (!errorPos || !textareaRef.current) return;
    const lines = input.split("\n");
    let offset = 0;
    for (let i = 0; i < errorPos.line - 1; i++) {
      offset += lines[i].length + 1;
    }
    offset += errorPos.col - 1;

    const ta = textareaRef.current;

    // Shadow clone: inherit exact styles, fill up to cursor, read scrollTop to get
    // the pixel position of the cursor line inside the full textarea.
    function getCaretScrollTop(): number {
      const shadow = ta.cloneNode(false) as HTMLTextAreaElement;
      shadow.style.position = "absolute";
      shadow.style.visibility = "hidden";
      shadow.style.top = "-9999px";
      shadow.style.left = "-9999px";
      shadow.style.width = ta.getBoundingClientRect().width + "px";
      shadow.style.height = ta.clientHeight + "px";
      shadow.value = ta.value.substring(0, offset);
      document.body.appendChild(shadow);
      shadow.scrollTop = shadow.scrollHeight;
      const target = Math.max(0, shadow.scrollTop - ta.clientHeight / 2 + 12);
      document.body.removeChild(shadow);
      return target;
    }

    const scrollTarget = getCaretScrollTop();

    // 1. Page: scroll so the textarea is visible on screen
    const rect = ta.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      window.scrollTo({
        top: window.scrollY + rect.top - window.innerHeight / 2 + ta.clientHeight / 2,
        behavior: "smooth",
      });
    }

    // 2. Place cursor at exact error offset
    ta.focus();
    ta.setSelectionRange(offset, offset);

    // 3. Scroll textarea so the cursor line is centred — done synchronously AND
    //    repeated in the next frame to override any deferred browser auto-scroll
    //    that setSelectionRange may have triggered.
    const applyScroll = () => {
      ta.scrollTop = scrollTarget;
      if (overlayRef.current) overlayRef.current.scrollTop = scrollTarget;
    };
    applyScroll();
    requestAnimationFrame(applyScroll);
  }

  function onTextareaScroll() {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  function clear() {
    setInput("");
    setOutput("");
    setOutputRaw("");
    setError(null);
    setErrorPos(null);
  }

  function loadSample() {
    setInput(SAMPLE);
    const m: Mode = "format";
    setMode(m);
    process(SAMPLE, m, indent);
  }

  // Line numbers derived from input
  const lineCount = input ? input.split("\n").length : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => run("format")}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              mode === "format"
                ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg hover:shadow-primary/20"
                : "bg-surface-container-high dark:bg-surface-variant text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            Format / Beautify
          </button>
          <button
            onClick={() => run("minify")}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
              mode === "minify"
                ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg"
                : "bg-surface-container-high dark:bg-surface-variant text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            Minify
          </button>
          <button
            onClick={() => run("sort")}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
              mode === "sort"
                ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg"
                : "bg-surface-container-high dark:bg-surface-variant text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            Sort Keys
          </button>
          <button
            onClick={() => run("ts")}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 ${
              mode === "ts"
                ? "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg"
                : "bg-surface-container-high dark:bg-surface-variant text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            JSON to TS
          </button>

          <div className="w-px h-6 bg-outline-variant/30 mx-1" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            Import File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={onFileInputChange}
          />
          <button
            onClick={clear}
            className="p-2.5 text-on-surface-variant hover:text-error transition-colors"
            title="Clear"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
          <button
            onClick={loadSample}
            className="px-4 py-2.5 text-tertiary font-semibold text-sm hover:bg-tertiary-fixed/10 rounded-xl transition-all"
          >
            Sample Data
          </button>
        </div>

        {/* Indent selector — hidden when in TS / minify mode */}
        {mode !== "ts" && mode !== "minify" && (
          <div ref={indentDropdownRef} className="relative">
            <button
              onClick={() => setIndentOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 w-44 bg-surface-container-low dark:bg-surface-variant/10 hover:bg-surface-container dark:hover:bg-surface-variant/20 rounded-xl transition-all"
            >
              <span className="font-label text-[0.65rem] uppercase tracking-widest text-on-surface-variant">
                Indent
              </span>
              <span className="flex-1 text-xs font-bold text-primary dark:text-primary-fixed">
                {indent === "2" ? "2 SPACES" : indent === "4" ? "4 SPACES" : "TAB"}
              </span>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                {indentOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>

            {indentOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-surface-container-low dark:bg-[#2d3133] border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden z-50">
                {(
                  [
                    ["2", "2 SPACES"],
                    ["4", "4 SPACES"],
                    ["tab", "TAB"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => {
                      onIndentChange(val);
                      setIndentOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                      indent === val
                        ? "bg-primary/10 text-primary dark:text-primary-fixed"
                        : "text-on-surface-variant hover:bg-surface-container dark:hover:bg-surface-variant/20 hover:text-on-surface"
                    }`}
                  >
                    {indent === val && (
                      <span className="material-symbols-outlined text-xs mr-1.5 align-middle">
                        check
                      </span>
                    )}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && !errorDismissed && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-error-container/30 border border-error/20 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-error text-base shrink-0">error</span>
            <span className="text-error font-mono text-xs truncate">{error}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {errorPos && (
              <button
                onClick={jumpToError}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-bold uppercase tracking-wide transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                Line {errorPos.line}:{errorPos.col}
              </button>
            )}
            <button
              onClick={() => setErrorDismissed(true)}
              className="text-error/50 hover:text-error transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dual-pane editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Left: Input */}
        <div className="flex flex-col bg-surface-container-low dark:bg-[#2d3133] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <span className="font-label text-[0.75rem] uppercase tracking-[0.1em] text-on-surface-variant font-semibold">
              Input JSON
            </span>
            <div className="flex items-center gap-3">
              <CopyButton getValue={() => input} />
              <div className="w-px h-4 bg-outline-variant/70" />
              <button
                onClick={paste}
                className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-fixed hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">content_paste</span>
                PASTE
              </button>
            </div>
          </div>
          <div
            className="flex flex-grow bg-surface-container-lowest dark:bg-[#191c1e] mx-2 mb-2 rounded-xl overflow-hidden relative"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {/* Line numbers */}
            <div className="w-12 bg-surface-container dark:bg-surface-variant/5 flex flex-col items-center pt-4 pb-4 font-mono text-[0.7rem] select-none overflow-hidden shrink-0">
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <span
                  key={i}
                  className={`leading-6 ${
                    errorPos && errorPos.line === i + 1
                      ? "text-error font-bold"
                      : "text-outline"
                  }`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            {/* Drag-and-drop overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-xl pointer-events-none">
                <span className="material-symbols-outlined text-primary text-6xl">add</span>
                <span className="text-primary text-xs font-bold uppercase tracking-widest mt-2">Drop file here</span>
              </div>
            )}

            {/* Textarea + error-highlight overlay */}
            <div className="relative grow overflow-hidden">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onScroll={onTextareaScroll}
                className="absolute inset-0 w-full h-full bg-transparent border-none focus:ring-0 p-4 font-mono text-sm resize-none text-on-surface dark:text-inverse-on-surface placeholder:text-outline/40 outline-none leading-6 overflow-auto"
                style={{ fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace" }}
                placeholder={'{ "key": "Paste your raw JSON here..." }'}
                spellCheck={false}
              />
              {errorPos && (
                <div
                  ref={overlayRef}
                  aria-hidden
                  className="absolute inset-0 p-4 font-mono text-sm leading-6 pointer-events-none overflow-hidden"
                  style={{
                    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "break-word",
                    wordBreak: "break-all",
                    color: "transparent",
                  }}
                >
                  {input.split("\n").map((line, li) => (
                    <span key={li}>
                      {li > 0 && "\n"}
                      {li === errorPos.line - 1 ? (
                        <>
                          {line.slice(0, errorPos.col - 1)}
                          <mark
                            style={{
                              background: "rgba(186,26,26,0.22)",
                              color: "transparent",
                              borderBottom: "2px solid #ba1a1a",
                              borderRadius: "2px",
                            }}
                          >
                            {line[errorPos.col - 1] ?? " "}
                          </mark>
                          {line.slice(errorPos.col)}
                        </>
                      ) : (
                        line
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex flex-col bg-surface-container-low dark:bg-[#2d3133] rounded-2xl overflow-hidden relative">
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <span className="font-label text-[0.75rem] uppercase tracking-[0.1em] text-on-surface-variant font-semibold">
              {mode === "ts" ? "TypeScript Interfaces" : "Formatted Output"}
            </span>
            <div className="flex items-center gap-3">
              {outputRaw && (
                <>
                  <button
                    onClick={() => {
                      const blob = new Blob([outputRaw], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = mode === "ts" ? "interfaces.ts" : "jsonformatter.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-fixed hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    DOWNLOAD
                  </button>
                  <div className="w-px h-4 bg-outline-variant/70" />
                </>
              )}
              <CopyButton getValue={() => outputRaw} />
            </div>
          </div>
          <div className="flex-grow bg-surface-container-lowest dark:bg-[#191c1e] mx-2 mb-2 rounded-xl overflow-auto p-6 font-mono text-sm leading-6"
            style={{ fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace" }}
          >
            {output ? (
              <pre
                className="text-on-surface dark:text-inverse-on-surface whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: output }}
              />
            ) : !error ? (
              <pre className="text-outline/40">
                {mode === "ts"
                  ? "// TypeScript interfaces will appear here"
                  : "// Formatted output will appear here"}
              </pre>
            ) : null}
          </div>
          {/* Decorative overlay */}
          <div className="absolute bottom-6 right-6 pointer-events-none opacity-5">
            <span className="material-symbols-outlined text-8xl">
              architecture
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
