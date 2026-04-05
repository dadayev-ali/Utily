import { useState } from "react";

type CaseType =
  | "upper"
  | "lower"
  | "proper"
  | "sentence"
  | "capitalized"
  | "inverse"
  | null;

function toUpper(text: string) {
  return text.toUpperCase();
}

function toLower(text: string) {
  return text.toLowerCase();
}

function toProper(text: string) {
  return text.replace(
    /\w\S*/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

function toSentence(text: string) {
  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
}

function toCapitalized(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function toInverse(text: string) {
  return text
    .split("")
    .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
    .join("");
}

function applyCase(text: string, type: CaseType): string {
  if (!type || !text) return text;
  switch (type) {
    case "upper":
      return toUpper(text);
    case "lower":
      return toLower(text);
    case "proper":
      return toProper(text);
    case "sentence":
      return toSentence(text);
    case "capitalized":
      return toCapitalized(text);
    case "inverse":
      return toInverse(text);
  }
}

const operations: {
  type: CaseType;
  label: string;
  icon: string;
  display: string;
}[] = [
  {
    type: "upper",
    label: "UPPER CASE",
    icon: "text_fields",
    display: "UPPER CASE",
  },
  {
    type: "lower",
    label: "lower case",
    icon: "text_format",
    display: "lower case",
  },
  {
    type: "proper",
    label: "Proper Case",
    icon: "title",
    display: "Proper Case",
  },
  {
    type: "sentence",
    label: "Sentence case",
    icon: "notes",
    display: "Sentence case",
  },
  {
    type: "capitalized",
    label: "Capitalized Case",
    icon: "format_size",
    display: "Capitalized Case",
  },
  {
    type: "inverse",
    label: "iNVERSE cASE",
    icon: "swap_vert",
    display: "iNVERSE cASE",
  },
];

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export default function CaseConverter() {
  const [input, setInput] = useState("");
  const [activeCase, setActiveCase] = useState<CaseType>(null);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleConvert(type: CaseType) {
    setActiveCase(type);
    setInput(applyCase(input, type));
  }

  function handleInputChange(val: string) {
    const converted = activeCase ? applyCase(val, activeCase) : val;
    setInput(converted);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setInput(activeCase ? applyCase(text, activeCase) : text);
    } catch {
      // clipboard denied
    }
  }

  function handleClear() {
    setInput("");
    setActiveCase(null);
  }

  function handleCopy() {
    if (!input) return;
    navigator.clipboard.writeText(input).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const activeOp = operations.find((o) => o.type === activeCase);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Left: Input Area — order-2 on mobile so Operations appear first */}
      <section className="lg:col-span-8 order-2 lg:order-1">
        <div className="flex flex-col gap-3">
          {/* Toolbar */}
          <div className="flex justify-between items-center px-1">
            <span className="font-label text-[0.7rem] uppercase tracking-widest text-on-surface-variant font-bold">
              Input
            </span>
            <div className="flex gap-4">
              <button
                onClick={handlePaste}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-fixed hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[1.1rem]">content_paste</span>
                Paste
              </button>
              <button
                onClick={handleCopy}
                disabled={!input}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-primary-fixed hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[1.1rem]">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs font-semibold text-error hover:opacity-70 transition-opacity cursor-pointer"
              >
                <span className="material-symbols-outlined text-[1.1rem]">delete_sweep</span>
                Clear
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Insert text here for immediate conversion..."
            className="w-full h-80 p-6 bg-surface-container-lowest dark:bg-inverse-surface/10 border border-outline-variant/20 focus:border-primary rounded-xl outline-none text-on-background font-body text-base resize-none placeholder:text-outline/40 transition-colors duration-300"
          />
        </div>

        {/* Metrics */}
        <div className="mt-4 flex gap-8 px-2">
          <div className="flex flex-col">
            <span className="font-label text-[0.65rem] text-outline uppercase tracking-tighter">Word Count</span>
            <span className="font-headline font-bold text-lg text-primary dark:text-primary-fixed">
              {wordCount(input)}
            </span>
          </div>
          <div className="flex flex-col border-l border-outline-variant/20 pl-8">
            <span className="font-label text-[0.65rem] text-outline uppercase tracking-tighter">Characters</span>
            <span className="font-headline font-bold text-lg text-primary dark:text-primary-fixed">
              {input.length}
            </span>
          </div>
        </div>
      </section>

      {/* Right: Operations — order-1 on mobile (appears first), order-2 on desktop */}
      <section className="lg:col-span-4 order-1 lg:order-2">
        {/* Mobile: custom dropdown */}
        <div className="block lg:hidden relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex justify-between items-center px-5 py-4 bg-surface-container-low dark:bg-inverse-surface/10 border border-outline-variant/20 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-label text-[0.7rem] uppercase tracking-widest text-on-surface-variant font-bold">
                Operation
              </span>
              {activeOp && (
                <span className="font-body font-semibold text-sm text-primary dark:text-primary-fixed">
                  {activeOp.display}
                </span>
              )}
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-surface-container-low dark:bg-inverse-surface/10 border border-outline-variant/20 rounded-xl overflow-hidden shadow-xl">
              {operations.map(({ type, display, icon }) => {
                const isActive = activeCase === type;
                return (
                  <button
                    key={type}
                    onClick={() => { handleConvert(type); setDropdownOpen(false); }}
                    className={`w-full flex justify-between items-center px-5 py-4 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-on-primary"
                        : "text-on-surface hover:bg-surface-container dark:hover:bg-inverse-surface/20"
                    }`}
                  >
                    <span className="font-body font-semibold text-sm tracking-tight">{display}</span>
                    <span className={`material-symbols-outlined text-[1.1rem] ${isActive ? "" : "opacity-50"}`}>{icon}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop: full list */}
        <div className="hidden lg:block bg-surface-container-low dark:bg-inverse-surface/10 p-8 rounded-xl border border-outline-variant/20">
          <h2 className="font-headline font-bold text-xl mb-6 text-on-surface">Operations</h2>
          <div className="grid grid-cols-1 gap-3">
            {operations.map(({ type, display, icon }) => {
              const isActive = activeCase === type;
              return (
                <button
                  key={type}
                  onClick={() => handleConvert(type)}
                  className={`w-full flex justify-between items-center p-4 rounded-lg transition-all active:scale-95 cursor-pointer ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container dark:bg-inverse-surface/20 text-on-surface hover:bg-secondary-container dark:hover:bg-primary/20"
                  }`}
                >
                  <span className="font-body font-semibold tracking-tight">{display}</span>
                  <span className={`material-symbols-outlined ${isActive ? "" : "opacity-50"}`}>{icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
