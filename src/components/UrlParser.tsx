import { useState, useMemo } from "react";

interface ParsedField {
  label: string;
  value: string;
  highlight?: string;
}

function parseUrl(raw: string): ParsedField[] | null {
  try {
    const url = new URL(raw.trim());
    const fields: ParsedField[] = [
      { label: "Protocol", value: url.protocol.replace(":", ""), highlight: "text-sky-400" },
      { label: "Host", value: url.host },
      { label: "Hostname", value: url.hostname },
    ];

    if (url.port) {
      fields.push({ label: "Port", value: url.port, highlight: "text-orange-400" });
    }

    fields.push({ label: "Origin", value: url.origin });
    fields.push({ label: "Path", value: url.pathname || "/", highlight: "text-emerald-400" });

    if (url.search) {
      fields.push({ label: "Query String", value: url.search });
      url.searchParams.forEach((value, key) => {
        fields.push({ label: `  └ ${key}`, value, highlight: "text-violet-400" });
      });
    }

    if (url.hash) {
      fields.push({ label: "Hash", value: url.hash, highlight: "text-rose-400" });
    }

    if (url.username) fields.push({ label: "Username", value: url.username });
    if (url.password) fields.push({ label: "Password", value: url.password });

    fields.push({ label: "Full URL", value: url.href });

    return fields;
  } catch {
    return null;
  }
}

export default function UrlParser() {
  const [input, setInput] = useState("");
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const parsed = useMemo(() => parseUrl(input), [input]);
  const isInvalid = input.trim().length > 0 && parsed === null;

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  };

  const handleClear = () => setInput("");

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const CHIP =
    "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="space-y-5">
      {/* Input panel */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
            URL Input
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className={`${CHIP} bg-secondary-container text-on-secondary-container`}
            >
              <span className="material-symbols-outlined text-sm">content_paste</span>
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
        </div>
        <div className="p-5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com/path?query=value#hash"
            spellCheck={false}
            className={`w-full bg-surface-container-high border rounded-lg px-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-colors ${
              isInvalid
                ? "border-error/60 focus:border-error"
                : "border-outline-variant/30 focus:border-primary"
            }`}
          />
          {isInvalid && (
            <p className="mt-2 text-xs text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              Invalid URL — make sure it includes a protocol (e.g. https://)
            </p>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
            Parsed Components
          </span>
          {parsed && (
            <button
              onClick={() => handleCopy("all", parsed.map((f) => `${f.label}: ${f.value}`).join("\n"))}
              className={`${CHIP} bg-secondary-container text-on-secondary-container`}
            >
              <span className="material-symbols-outlined text-sm">
                {copiedLabel === "all" ? "check" : "content_copy"}
              </span>
              {copiedLabel === "all" ? "Copied" : "Copy All"}
            </button>
          )}
        </div>

        {parsed ? (
          <div className="divide-y divide-outline-variant/10">
            {parsed.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant w-28 shrink-0">
                    {field.label}
                  </span>
                  <span
                    className={`font-mono text-sm break-all ${
                      field.highlight ?? "text-on-surface"
                    }`}
                  >
                    {field.value}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(field.label, field.value)}
                  className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedLabel === field.label ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-30">link</span>
            <p className="text-sm">Paste a URL above to see its components</p>
          </div>
        )}
      </div>
    </div>
  );
}
