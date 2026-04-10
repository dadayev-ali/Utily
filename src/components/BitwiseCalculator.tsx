import { useState, useRef } from "react";

type InputFmt = "decimal" | "hex" | "binary";
type BitWidth = "auto" | "8" | "16" | "32";
type Op = "AND" | "OR" | "XOR";

const PRESETS: { label: string; a: string; b: string; fmt: InputFmt }[] = [
  { label: "12 & 10",     a: "12",  b: "10",  fmt: "decimal" },
  { label: "5 | 3",       a: "5",   b: "3",   fmt: "decimal" },
  { label: "0xFF & 0xAA", a: "FF",  b: "AA",  fmt: "hex"     },
  { label: "255 ^ 170",   a: "255", b: "170", fmt: "decimal" },
];

const OP_DESC: Record<Op, string> = {
  AND: "Returns 1 only when BOTH bits are 1",
  OR:  "Returns 1 when AT LEAST ONE bit is 1",
  XOR: "Returns 1 when bits are DIFFERENT",
};

function parse(val: string, fmt: InputFmt): number | null {
  const v = val.trim().replace(/^0x/i, "").replace(/^0b/i, "");
  if (!v) return null;
  const n = parseInt(v, fmt === "decimal" ? 10 : fmt === "hex" ? 16 : 2);
  return isNaN(n) ? null : n;
}

function maskTo(n: number, bits: number): number {
  if (bits === 8)  return n & 0xFF;
  if (bits === 16) return n & 0xFFFF;
  return n >>> 0;
}

function autoBits(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max <= 0xFF)   return 8;
  if (max <= 0xFFFF) return 16;
  return 32;
}

function toBin(n: number, bits: number): string {
  return (n >>> 0).toString(2).padStart(bits, "0");
}

function toHex(n: number): string {
  return "0x" + (n >>> 0).toString(16).toUpperCase();
}

function bitCount(n: number): number {
  let c = 0, v = n >>> 0;
  while (v) { c += v & 1; v >>>= 1; }
  return c;
}

interface Computed {
  a: number; b: number; bits: number;
  AND: number; OR: number; XOR: number;
  NOTA: number; shiftL: number; shiftR: number;
  parity: string;
}

function compute(rawA: number, rawB: number, bitWidth: BitWidth): Computed {
  const bits = bitWidth === "auto" ? autoBits(rawA, rawB) : parseInt(bitWidth);
  const a = maskTo(rawA, bits);
  const b = maskTo(rawB, bits);
  return {
    a, b, bits,
    AND:    maskTo(a & b,  bits),
    OR:     maskTo(a | b,  bits),
    XOR:    maskTo(a ^ b,  bits),
    NOTA:   maskTo(~a,     bits),
    shiftL: maskTo(a << 1, bits),
    shiftR: maskTo(a >> 1, bits),
    parity: bitCount(a) % 2 === 0 ? "Even" : "Odd",
  };
}

// ── Single bit row ─────────────────────────────────────────────────────────────
function BitRow({ label, bits, isResult = false }: { label: string; bits: string[]; isResult?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 shrink-0 text-[9px] font-bold text-on-surface-variant/60 text-right">{label}</div>
      <div className="flex gap-0.5">
        {bits.map((bit, i) => (
          <div
            key={i}
            className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded sm:rounded-lg text-[10px] sm:text-sm font-bold font-mono transition-colors duration-150 shrink-0 ${
              bit === "1"
                ? isResult
                  ? "bg-primary text-on-primary"
                  : "bg-primary/20 text-primary border border-primary/40"
                : "bg-surface-container text-on-surface-variant/40 border border-outline-variant/15"
            }`}
          >
            {bit}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bit-by-bit visualization panel ────────────────────────────────────────────
function BitByBitViz({ a, b, result, bits, op }: { a: number; b: number; result: number; bits: number; op: Op }) {
  const aBin = toBin(a, bits).split("");
  const bBin = toBin(b, bits).split("");
  const rBin = toBin(result, bits).split("");

  // For 16/32-bit show in groups of 8
  const groupSize = 8;
  const groups: { a: string[]; b: string[]; r: string[]; startPos: number }[] = [];
  for (let i = 0; i < bits; i += groupSize) {
    groups.push({
      a: aBin.slice(i, i + groupSize),
      b: bBin.slice(i, i + groupSize),
      r: rBin.slice(i, i + groupSize),
      startPos: bits - 1 - i,
    });
  }

  return (
    <div className="space-y-5">
      {/* Op header + stat cards */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-base">
            {op === "AND" ? "&" : op === "OR" ? "|" : "^"}
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">{op} Operation</p>
            <p className="text-xs text-on-surface-variant/70">{OP_DESC[op]}</p>
          </div>
        </div>
      </div>

      {/* Binary / Decimal / Hex cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-high rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-2">Binary</span>
          <span className="font-bold font-mono text-sm break-all leading-relaxed">{toBin(result, bits)}</span>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-2">Decimal</span>
          <span className="text-2xl font-bold font-mono text-primary">{result}</span>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block mb-2">Hexadecimal</span>
          <span className="text-2xl font-bold font-mono">{toHex(result)}</span>
        </div>
      </div>

      {/* Bit-by-bit panel */}
      <div className="bg-surface-container-highest rounded-2xl p-4 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 block">
          Bit-by-Bit Visualization
        </span>
        <div className="overflow-x-auto no-scrollbar">
          {groups.map((g, gi) => (
            <div key={gi} className="space-y-1.5" style={{ minWidth: `${g.a.length * 42 + 44}px` }}>
              {/* Position labels */}
              <div className="flex items-center gap-2">
                <div className="w-9 shrink-0" />
                <div className="flex gap-0.5">
                  {g.a.map((_, bi) => (
                    <div key={bi} className="w-10 shrink-0 text-[8px] text-center text-on-surface-variant/40 font-mono">
                      {g.startPos - bi}
                    </div>
                  ))}
                </div>
              </div>
              <BitRow label="A"      bits={g.a} />
              <BitRow label="B"      bits={g.b} />
              {/* Separator */}
              <div className="flex items-center gap-2">
                <div className="w-9 shrink-0" />
                <div className="h-px bg-primary/30" style={{ width: `${g.a.length * (40 + 2)}px`, minWidth: `${g.a.length * (40 + 2)}px` }} />
              </div>
              <BitRow label="Result" bits={g.r} isResult />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function BitwiseCalculator() {
  const [inputA, setInputA]     = useState("");
  const [inputB, setInputB]     = useState("");
  const [fmt, setFmt]           = useState<InputFmt>("decimal");
  const [bitWidth, setBitWidth] = useState<BitWidth>("auto");
  const [result, setResult] = useState<Computed | null>(null);
  const resultRefs = useRef<Record<Op, HTMLDivElement | null>>({ AND: null, OR: null, XOR: null });
  const firstResultRef = useRef<HTMLDivElement | null>(null);
  const [error, setError]       = useState("");

  const handleCalculate = (op?: Op) => {
    const a = parse(inputA, fmt);
    const b = parse(inputB, fmt);
    if (a === null) { setError("Invalid value for A"); return; }
    if (b === null) { setError("Invalid value for B"); return; }
    setError("");
    setResult(compute(a, b, bitWidth));
    setTimeout(() => {
      const el = op ? resultRefs.current[op] : firstResultRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  };

  const handlePreset = (p: typeof PRESETS[0]) => {
    setFmt(p.fmt);
    setInputA(p.a);
    setInputB(p.b);
    setError("");
    setResult(null);
  };



  return (
    <div className="space-y-5">

      {/* ── Quick-Start Presets ── */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 block mb-3">
          Quick-Start Examples
        </span>
        <div className="flex sm:flex-wrap gap-2 overflow-x-auto sm:overflow-x-visible no-scrollbar">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="px-4 py-2 bg-surface-container-high border border-outline-variant/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-sm font-medium rounded-full transition-all duration-150 cursor-pointer shrink-0 sm:shrink"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Inputs */}
        <div className="lg:col-span-12">
          <div className="bg-surface-container border border-outline-variant/20 rounded-2xl p-5 space-y-5">

            {/* Config row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Input Format</label>
                <div className="flex rounded-xl border border-outline-variant/20 overflow-hidden">
                  {(["decimal", "hex", "binary"] as InputFmt[]).map(f => (
                    <button
                      key={f}
                      onClick={() => { setFmt(f); setResult(null); setError(""); }}
                      className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
                        fmt === f ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Bit Width</label>
                <select
                  value={bitWidth}
                  onChange={e => setBitWidth(e.target.value as BitWidth)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm text-on-surface outline-none cursor-pointer hover:border-outline-variant/40 transition-colors duration-150"
                  style={{ boxShadow: "none" }}
                >
                  <option value="auto">Auto (Optimized)</option>
                  <option value="8">8-bit</option>
                  <option value="16">16-bit</option>
                  <option value="32">32-bit</option>
                </select>
              </div>
            </div>

            {/* Number Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">First Number (A)</label>
                <input
                  value={inputA}
                  onChange={e => { setInputA(e.target.value); setError(""); }}
                  placeholder={fmt === "decimal" ? "e.g. 15" : fmt === "hex" ? "e.g. FF" : "e.g. 1111"}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-lg font-mono text-on-surface outline-none focus:border-primary transition-colors duration-150"
                  style={{ boxShadow: "none" }}
                  spellCheck={false}
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Second Number (B)</label>
                <input
                  value={inputB}
                  onChange={e => { setInputB(e.target.value); setError(""); }}
                  placeholder={fmt === "decimal" ? "e.g. 7" : fmt === "hex" ? "e.g. AA" : "e.g. 0111"}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-lg font-mono text-on-surface outline-none focus:border-primary transition-colors duration-150"
                  style={{ boxShadow: "none" }}
                  spellCheck={false}
                />
              </div>
            </div>

            {error && <p className="text-error text-xs">{error}</p>}

            {/* Operation buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/10">
              {(["AND", "OR", "XOR"] as Op[]).map(op => (
                <button
                  key={op}
                  onClick={() => handleCalculate(op)}
                  className={`px-5 py-3 rounded-xl font-bold text-sm tracking-tight flex items-center gap-2 transition-all duration-150 cursor-pointer border ${
                    result
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high border-outline-variant/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <span className="font-black text-base">{op === "AND" ? "&" : op === "OR" ? "|" : "^"}</span>
                  {op}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => handleCalculate()}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm tracking-tight shadow-sm hover:opacity-90 active:scale-[0.99] transition-all duration-150 cursor-pointer"
              >
                Calculate All
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">

          {/* One block per operation */}
          {(["AND", "OR", "XOR"] as Op[]).map((op, i) => (
            <div key={op} ref={el => { resultRefs.current[op] = el; if (i === 0) firstResultRef.current = el; }} className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-outline-variant/15">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface">{op} Result</span>
              </div>
              <div className="p-5">
                <BitByBitViz
                  a={result.a}
                  b={result.b}
                  result={result[op]}
                  bits={result.bits}
                  op={op}
                />
              </div>
            </div>
          ))}

          {/* Analysis grid */}
          <div className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/15">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
                Analysis <span className="normal-case tracking-normal font-normal text-on-surface-variant/60">(based on A = {result.a})</span>
              </span>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "NOT (~A)",         value: toHex(result.NOTA)     },
                { label: "Left Shift (<<1)",  value: String(result.shiftL) },
                { label: "Right Shift (>>1)", value: String(result.shiftR) },
                { label: "Parity",            value: result.parity         },
              ].map(item => (
                <div key={item.label} className="bg-surface-container-high rounded-xl p-4">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1.5">{item.label}</span>
                  <span className="font-mono text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
