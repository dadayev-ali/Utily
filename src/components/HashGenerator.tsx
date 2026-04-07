import { useState, useEffect, useCallback } from "react";

// ── Compact MD5 (pure JS, no deps) ───────────────────────────────────────────
function md5(str: string): string {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff);
  }
  function rol(n: number, c: number) { return (n << c) | (n >>> (32 - c)); }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return cmn(c ^ (b | ~d), a, b, x, s, t); }

  function md5cycle(x: number[], k: number[]) {
    let [a, b, c, d] = x;
    a = ff(a,b,c,d,k[0],7,-680876936); d = ff(d,a,b,c,k[1],12,-389564586); c = ff(c,d,a,b,k[2],17,606105819); b = ff(b,c,d,a,k[3],22,-1044525330);
    a = ff(a,b,c,d,k[4],7,-176418897); d = ff(d,a,b,c,k[5],12,1200080426); c = ff(c,d,a,b,k[6],17,-1473231341); b = ff(b,c,d,a,k[7],22,-45705983);
    a = ff(a,b,c,d,k[8],7,1770035416); d = ff(d,a,b,c,k[9],12,-1958414417); c = ff(c,d,a,b,k[10],17,-42063); b = ff(b,c,d,a,k[11],22,-1990404162);
    a = ff(a,b,c,d,k[12],7,1804603682); d = ff(d,a,b,c,k[13],12,-40341101); c = ff(c,d,a,b,k[14],17,-1502002290); b = ff(b,c,d,a,k[15],22,1236535329);
    a = gg(a,b,c,d,k[1],5,-165796510); d = gg(d,a,b,c,k[6],9,-1069501632); c = gg(c,d,a,b,k[11],14,643717713); b = gg(b,c,d,a,k[0],20,-373897302);
    a = gg(a,b,c,d,k[5],5,-701558691); d = gg(d,a,b,c,k[10],9,38016083); c = gg(c,d,a,b,k[15],14,-660478335); b = gg(b,c,d,a,k[4],20,-405537848);
    a = gg(a,b,c,d,k[9],5,568446438); d = gg(d,a,b,c,k[14],9,-1019803690); c = gg(c,d,a,b,k[3],14,-187363961); b = gg(b,c,d,a,k[8],20,1163531501);
    a = gg(a,b,c,d,k[13],5,-1444681467); d = gg(d,a,b,c,k[2],9,-51403784); c = gg(c,d,a,b,k[7],14,1735328473); b = gg(b,c,d,a,k[12],20,-1926607734);
    a = hh(a,b,c,d,k[5],4,-378558); d = hh(d,a,b,c,k[8],11,-2022574463); c = hh(c,d,a,b,k[11],16,1839030562); b = hh(b,c,d,a,k[14],23,-35309556);
    a = hh(a,b,c,d,k[1],4,-1530992060); d = hh(d,a,b,c,k[4],11,1272893353); c = hh(c,d,a,b,k[7],16,-155497632); b = hh(b,c,d,a,k[10],23,-1094730640);
    a = hh(a,b,c,d,k[13],4,681279174); d = hh(d,a,b,c,k[0],11,-358537222); c = hh(c,d,a,b,k[3],16,-722521979); b = hh(b,c,d,a,k[6],23,76029189);
    a = hh(a,b,c,d,k[9],4,-640364487); d = hh(d,a,b,c,k[12],11,-421815835); c = hh(c,d,a,b,k[15],16,530742520); b = hh(b,c,d,a,k[2],23,-995338651);
    a = ii(a,b,c,d,k[0],6,-198630844); d = ii(d,a,b,c,k[7],10,1126891415); c = ii(c,d,a,b,k[14],15,-1416354905); b = ii(b,c,d,a,k[5],21,-57434055);
    a = ii(a,b,c,d,k[12],6,1700485571); d = ii(d,a,b,c,k[3],10,-1894986606); c = ii(c,d,a,b,k[10],15,-1051523); b = ii(b,c,d,a,k[1],21,-2054922799);
    a = ii(a,b,c,d,k[8],6,1873313359); d = ii(d,a,b,c,k[15],10,-30611744); c = ii(c,d,a,b,k[6],15,-1560198380); b = ii(b,c,d,a,k[13],21,1309151649);
    a = ii(a,b,c,d,k[4],6,-145523070); d = ii(d,a,b,c,k[11],10,-1120210379); c = ii(c,d,a,b,k[2],15,718787259); b = ii(b,c,d,a,k[9],21,-343485551);
    x[0] = safeAdd(a,x[0]); x[1] = safeAdd(b,x[1]); x[2] = safeAdd(c,x[2]); x[3] = safeAdd(d,x[3]);
  }

  function bytes2binl(bytes: Uint8Array) {
    const b: number[] = [];
    for (let i = 0; i < bytes.length; i++) b[i >> 2] |= bytes[i] << ((i % 4) * 8);
    return b;
  }
  function binl2hex(b: number[]) {
    const h = "0123456789abcdef"; let s = "";
    for (let i = 0; i < b.length * 4; i++) s += h[(b[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf] + h[(b[i >> 2] >> ((i % 4) * 8)) & 0xf];
    return s;
  }

  const bytes = new TextEncoder().encode(str);
  const n = bytes.length;
  const b = bytes2binl(bytes);
  b[n >> 2] |= 0x80 << ((n % 4) * 8);
  b[(((n + 64) >>> 9) << 4) + 14] = n * 8;
  const st = [1732584193, -271733879, -1732584194, 271733878];
  for (let i = 0; i < b.length; i += 16) { md5cycle(st, b.slice(i, i + 16)); }
  return binl2hex(st);
}

// ── SubtleCrypto for SHA variants ─────────────────────────────────────────────
async function subtleHash(text: string, algo: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Algorithm config ──────────────────────────────────────────────────────────
const ALGOS = [
  { id: "MD5",     label: "MD5",     bits: "128-bit", badge: "bg-surface-container-high text-on-surface-variant" },
  { id: "SHA-1",   label: "SHA-1",   bits: "160-bit", badge: "bg-primary text-on-primary" },
  { id: "SHA-256", label: "SHA-256", bits: "256-bit", badge: "bg-sky-700 text-white" },
  { id: "SHA-512", label: "SHA-512", bits: "512-bit", badge: "bg-indigo-700 text-white" },
];

type Hashes = Record<string, string>;

export default function HashGenerator() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Hashes>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);

  const compute = useCallback(async (text: string) => {
    if (!text) { setHashes({}); return; }
    const results: Hashes = {};
    results["MD5"]     = md5(text);
    results["SHA-1"]   = await subtleHash(text, "SHA-1");
    results["SHA-256"] = await subtleHash(text, "SHA-256");
    results["SHA-512"] = await subtleHash(text, "SHA-512");
    setHashes(results);
  }, []);

  useEffect(() => { compute(input); }, [input, compute]);

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  };

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(uppercase ? value.toUpperCase() : value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const fmt = (h: string) => uppercase ? h.toUpperCase() : h;

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="space-y-5">
      {/* Input panel */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
            Input Text
          </span>
          <div className="flex items-center gap-2">
            {/* Uppercase toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <div
                className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors duration-200 ${uppercase ? "bg-primary" : "bg-outline-variant"}`}
                onClick={() => setUppercase(v => !v)}
              >
                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${uppercase ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Uppercase</span>
            </label>
            <button onClick={handlePaste} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
              <span className="material-symbols-outlined text-sm">content_paste</span>
              Paste
            </button>
            <button onClick={() => setInput("")} className={`${CHIP} bg-error-container/40 text-error`}>
              <span className="material-symbols-outlined text-sm">delete</span>
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type or paste your text here — hashes update instantly..."
          spellCheck={false}
          rows={5}
          className="w-full bg-transparent border-none focus:ring-0 outline-none text-on-surface p-5 font-mono text-sm leading-relaxed resize-none placeholder:text-on-surface-variant/40"
          style={{ outline: "none", boxShadow: "none" }}
        />
      </div>

      {/* Hash result cards */}
      <div className="space-y-3">
        {ALGOS.map(({ id, label, bits, badge }) => {
          const hash = hashes[id];
          const isCopied = copied === id;
          return (
            <div
              key={id}
              className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 space-y-2 hover:bg-surface-container-high transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badge}`}>
                  {label}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold">
                  {bits}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 font-mono text-xs sm:text-sm text-primary break-all">
                  {hash ? fmt(hash) : <span className="text-on-surface-variant/30 italic">waiting for input…</span>}
                </div>
                <button
                  onClick={() => hash && handleCopy(id, hash)}
                  disabled={!hash}
                  className="flex items-center gap-1.5 shrink-0 text-[11px] px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase tracking-tighter hover:opacity-80 disabled:opacity-30 cursor-pointer transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">
                    {isCopied ? "check" : "content_copy"}
                  </span>
                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
