import { useState, useEffect } from "react";

// ── JWT decode helpers ────────────────────────────────────────────────────────

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJwt(token: string): {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  error: string | null;
} {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { header: null, payload: null, signature: "", error: "Invalid JWT: must have exactly 3 parts separated by dots." };
  }
  try {
    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload, signature: parts[2], error: null };
  } catch {
    return { header: null, payload: null, signature: "", error: "Failed to decode token. Ensure it is a valid JWT." };
  }
}

function formatJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 2);
}

function isExpired(payload: Record<string, unknown>): boolean | null {
  if (typeof payload.exp !== "number") return null;
  return Date.now() / 1000 > payload.exp;
}

function formatTimestamp(val: unknown): string | null {
  if (typeof val !== "number") return null;
  try {
    return new Date(val * 1000).toUTCString();
  } catch {
    return null;
  }
}

// ── Syntax-highlighted JSON ──────────────────────────────────────────────────

function JsonBlock({ obj }: { obj: Record<string, unknown> }) {
  const lines = formatJson(obj).split("\n");
  return (
    <pre className="text-on-surface dark:text-[#c2c6d4] leading-relaxed text-sm font-mono">
      {lines.map((line, i) => {
        // Colorize keys and values
        const colored = line
          .replace(/("[\w@.-]+")\s*:/g, '<span class="text-rose-400">$1</span>:')
          .replace(/:\s*(".*?")/g, ': <span class="text-emerald-400">$1</span>')
          .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-amber-400">$1</span>')
          .replace(/:\s*(true|false)/g, ': <span class="text-sky-400">$1</span>')
          .replace(/:\s*(null)/g, ': <span class="text-outline">$1</span>');
        return <div key={i} dangerouslySetInnerHTML={{ __html: colored }} />;
      })}
    </pre>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ getValue }: { getValue: () => string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(getValue()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary dark:text-primary-fixed bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 uppercase tracking-wider cursor-pointer"
    >
      <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Component ────────────────────────────────────────────────────────────────


export default function JwtDecoder() {
  const [token, setToken] = useState("");
  const [header, setHeader] = useState<Record<string, unknown> | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token.trim()) {
      setHeader(null);
      setPayload(null);
      setError(null);
      return;
    }
    const result = decodeJwt(token);
    setHeader(result.header);
    setPayload(result.payload);
    setError(result.error);
  }, [token]);

  const expired = payload ? isExpired(payload) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Token Input */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-surface-container-lowest dark:bg-inverse-surface/10 rounded-xl p-6 shadow-sm border border-outline-variant/20 border-b-2 border-b-primary">
          <div className="flex justify-between items-center mb-4">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Encoded Token
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setToken(text);
                  } catch {}
                }}
                className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">content_paste</span>
                Paste
              </button>
              {token && (
                <button
                  onClick={() => setToken("")}
                  className="flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full bg-error-container/40 text-error font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Container: background here so overlay shows through transparent textarea */}
          <div className="relative h-[480px] bg-surface-container-low dark:bg-inverse-surface/20 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            {/* Highlight overlay */}
            <div
              aria-hidden
              className="absolute inset-0 p-5 font-mono text-sm leading-relaxed pointer-events-none select-none whitespace-pre-wrap break-all overflow-hidden rounded-xl"
            >
              {token ? (() => {
                const dots = token.split(".");
                if (dots.length === 3) {
                  return (
                    <>
                      <span className="text-orange-400">{dots[0]}</span>
                      <span className="text-on-surface-variant">.</span>
                      <span className="text-sky-500">{dots[1]}</span>
                      <span className="text-on-surface-variant">.</span>
                      <span className="text-rose-600">{dots[2]}</span>
                    </>
                  );
                }
                return <span className="text-on-surface">{token}</span>;
              })() : (
                <span className="text-outline/40">Paste your JWT here...</span>
              )}
            </div>
            {/* Transparent textarea on top */}
            <style>{`textarea.jwt-token-input::selection { background: transparent; }`}</style>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder=""
              spellCheck={false}
              className="jwt-token-input absolute inset-0 w-full h-full bg-transparent border-0 focus:ring-0 rounded-xl p-5 font-mono text-sm leading-relaxed resize-none outline-none text-transparent caret-on-surface dark:caret-[#f8f9fb]"
            />
            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-none">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                <i className="w-2 h-2 rounded-full bg-orange-400 not-italic" /> Header
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                <i className="w-2 h-2 rounded-full bg-sky-500 not-italic" /> Payload
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                <i className="w-2 h-2 rounded-full bg-rose-600 not-italic" /> Signature
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Decoded Panels */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-5 py-3 bg-error-container/30 border border-error/20 rounded-xl">
            <span className="material-symbols-outlined text-error text-base shrink-0">error</span>
            <span className="text-error font-mono text-xs">{error}</span>
          </div>
        )}

        {/* Header Panel */}
        <div className="bg-surface-container-lowest dark:bg-inverse-surface/10 rounded-xl p-6 shadow-sm border border-outline-variant/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-orange-400 rounded-full" />
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Decoded Header
              </label>
            </div>
            {header && <CopyBtn getValue={() => formatJson(header)} />}
          </div>
          <div className="bg-surface-container-low dark:bg-inverse-surface/20 rounded-xl p-5 font-mono text-sm overflow-x-auto min-h-[80px]">
            {header ? (
              <JsonBlock obj={header} />
            ) : (
              <span className="text-outline/50 text-xs">Waiting for token...</span>
            )}
          </div>
        </div>

        {/* Payload Panel */}
        <div className="bg-surface-container-lowest dark:bg-inverse-surface/10 rounded-xl p-6 shadow-sm border border-outline-variant/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-sky-500 rounded-full" />
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Decoded Payload
              </label>
            </div>
            {payload && <CopyBtn getValue={() => formatJson(payload)} />}
          </div>
          <div className="bg-surface-container-low dark:bg-inverse-surface/20 rounded-xl p-5 font-mono text-sm overflow-x-auto min-h-[80px]">
            {payload ? (
              <>
                <JsonBlock obj={payload} />
                {/* Timestamp hints */}
                {(payload.iat || payload.exp) && (
                  <div className="mt-4 pt-4 border-t border-outline-variant/20 flex flex-col gap-1">
                    {typeof payload.iat === "number" && (
                      <p className="text-xs text-outline">
                        <span className="font-bold">iat:</span> {formatTimestamp(payload.iat)}
                      </p>
                    )}
                    {typeof payload.exp === "number" && (
                      <p className="text-xs text-outline">
                        <span className="font-bold">exp:</span> {formatTimestamp(payload.exp)}
                        {expired === true && (
                          <span className="ml-2 text-error font-bold">• Expired</span>
                        )}
                        {expired === false && (
                          <span className="ml-2 text-rose-600 font-bold">• Valid</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <span className="text-outline/50 text-xs">Waiting for token...</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
