import { useState } from "react";

type Mode = "encode" | "decode";

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
      className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label text-[0.75rem] uppercase tracking-[0.05em] shadow-md hover:-translate-y-px active:translate-y-px transition-all cursor-pointer"
    >
      <span className="material-symbols-outlined text-sm">
        {copied ? "check" : "content_copy"}
      </span>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function encode(input: string): string {
  return encodeURIComponent(input);
}

function decode(input: string): { result: string; error: string | null } {
  try {
    return { result: decodeURIComponent(input), error: null };
  } catch {
    return { result: "", error: "Invalid URL-encoded string." };
  }
}

export default function UrlEncoderDecoder() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function getOutput(): string {
    if (!input.trim()) return "";
    if (mode === "encode") return encode(input);
    const { result } = decode(input);
    return result;
  }

  const output = getOutput();

  function onInputChange(val: string) {
    setInput(val);
    setError(null);
    if (mode === "decode" && val.trim()) {
      const { error: err } = decode(val.trim());
      if (err) setError(err);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setInput("");
    setError(null);
  }

  const inputLabel = mode === "encode" ? "Plain text / URL" : "Encoded string";
  const inputPlaceholder =
    mode === "encode"
      ? "Paste your URL or text to encode..."
      : "Paste your URL-encoded string to decode...";
  const outputLabel = mode === "encode" ? "Encoded Output" : "Decoded Output";

  return (
    <div className="flex flex-col gap-8">
      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex bg-surface-container-low dark:bg-inverse-surface/20 p-1 rounded-full shadow-sm">
          {(["encode", "decode"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-8 py-2.5 rounded-full font-label text-[0.75rem] uppercase tracking-[0.05em] transition-all active:scale-95 cursor-pointer ${
                mode === m
                  ? "bg-primary text-on-primary shadow-lg"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {m === "encode" ? "Encode" : "Decode"}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-3 bg-error-container/30 border border-error/20 rounded-xl">
          <span className="material-symbols-outlined text-error text-base shrink-0">error</span>
          <span className="text-error font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant/15 rounded-xl overflow-hidden shadow-2xl shadow-black/5">
        {/* Input Panel */}
        <div className="bg-surface-container-lowest dark:bg-surface-container-low p-8 flex flex-col gap-6 min-h-[500px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-outline">
                Source Input
              </label>
              <h3 className="font-headline text-lg font-bold">{inputLabel}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    onInputChange(text);
                  } catch {
                    // clipboard access denied
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-fixed hover:opacity-80 transition-opacity cursor-pointer"
                title="Paste from clipboard"
              >
                <span className="material-symbols-outlined text-sm">content_paste</span>
                Paste
              </button>
              <div className="w-px h-4 bg-outline-variant/70" />
              <button
                onClick={() => { setInput(""); setError(null); }}
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg transition-colors cursor-pointer"
                title="Clear"
              >
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            </div>
          </div>

          <div className="flex-grow relative">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full h-full min-h-[320px] bg-surface-container dark:bg-inverse-surface/10 border-0 rounded-xl p-6 font-body text-sm text-on-background focus:ring-2 focus:ring-primary/20 resize-none transition-all placeholder:text-outline/50"
            />
          </div>

          <div className="flex justify-between items-center text-[0.65rem] font-label uppercase tracking-widest text-outline">
            <span>{input.length} Characters</span>
            <span>{new TextEncoder().encode(input).length} Bytes</span>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-surface-container-lowest dark:bg-surface-container-low p-8 flex flex-col gap-6 min-h-[500px]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-outline">
                Result
              </label>
              <h3 className="font-headline text-lg font-bold">{outputLabel}</h3>
            </div>
            <CopyButton getValue={() => output} />
          </div>

          <div className="flex-grow relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-xl" />
            <textarea
              value={output}
              readOnly
              className="w-full h-full min-h-[320px] bg-surface-container-low dark:bg-inverse-surface/30 border-0 rounded-xl p-6 font-body text-sm text-primary dark:text-primary-fixed focus:ring-0 resize-none"
              placeholder={
                error
                  ? "Invalid input — fix the error above"
                  : "Output will appear here..."
              }
            />
          </div>

          <div className="flex justify-between items-center text-[0.65rem] font-label uppercase tracking-widest text-outline">
            <span>
              {output
                ? mode === "encode"
                  ? "RFC 3986 Encoded"
                  : "Decoded Successfully"
                : "—"}
            </span>
            <span>{output.length} Characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
