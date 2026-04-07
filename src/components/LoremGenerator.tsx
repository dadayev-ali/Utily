import { useState, useCallback } from "react";

type UnitType = "paragraphs" | "sentences" | "words" | "html";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum vestibulum ante primis faucibus orci luctus ultrices posuere cubilia curae nullam scelerisque neque efficitur convallis purus accumsan lectus feugiat diam mauris elementum vulputate urna praesent congue tincidunt rhoncus metus suspendisse potenti hac habitasse platea dictumst eget interdum aliquam euismod vivamus pretium fusce vitae aliquet quisque volutpat finibus augue malesuada pellentesque porttitor libero bibendum sodales tempus blandit gravida arcu lacus pharetra ligula fringilla nunc hendrerit condimentum massa porta sapien semper curabitur aenean tristique dapibus fermentum iaculis varius".split(" ");

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(): string {
  const len = 8 + Math.floor(Math.random() * 12);
  const words = Array.from({ length: len }, (_, i) => i === 0 ? capitalize(randomWord()) : randomWord());
  return words.join(" ") + ".";
}

function generateParagraph(): string {
  const count = 4 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, generateSentence).join(" ");
}

function generate(type: UnitType, qty: number): string {
  qty = Math.max(1, Math.min(qty, type === "words" ? 1000 : 20));
  switch (type) {
    case "paragraphs":
      return Array.from({ length: qty }, generateParagraph).join("\n\n");
    case "sentences":
      return Array.from({ length: qty }, generateSentence).join(" ");
    case "words":
      return Array.from({ length: qty }, (_, i) => i === 0 ? capitalize(randomWord()) : randomWord()).join(" ") + ".";
    case "html":
      return Array.from({ length: qty }, () => `<p>${generateParagraph()}</p>`).join("\n");
  }
}

const UNIT_OPTIONS: { id: UnitType; icon: string; label: string }[] = [
  { id: "paragraphs", icon: "segment",    label: "Paragraphs" },
  { id: "sentences",  icon: "short_text", label: "Sentences"  },
  { id: "words",      icon: "notes",      label: "Words"      },
];

function computeStats(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const chars = text.length;
  const avgLen = words.length ? (words.reduce((s, w) => s + w.replace(/[^a-z]/gi, "").length, 0) / words.length) : 0;
  const readSec = Math.ceil(words.length / 200 * 60);
  return {
    words: words.length,
    chars,
    avgLen: avgLen.toFixed(1),
    readTime: readSec < 60 ? `~${readSec}s` : `~${Math.ceil(readSec / 60)}m`,
  };
}

export default function LoremGenerator() {
  const [unitType, setUnitType] = useState<UnitType>("paragraphs");
  const [qty, setQty] = useState(3);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setOutput(generate(unitType, qty));
  }, [unitType, qty]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lorem-ipsum.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = output ? computeStats(output) : null;

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  const maxQty = unitType === "words" ? 1000 : 20;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {/* ── Left: Settings ── */}
      <div className="lg:col-span-4 bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Generator Settings</span>
        </div>
        <div className="p-5 space-y-6">

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Quantity <span className="text-on-surface-variant/40 normal-case tracking-normal">(max {maxQty})</span>
            </label>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={e => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 text-sm font-mono text-on-surface outline-none focus:ring-0 focus:border-primary transition-colors"
              style={{ boxShadow: "none" }}
            />
          </div>

          {/* Unit type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Unit Type</label>
            <div className="space-y-2">
              {UNIT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setUnitType(opt.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    unitType === opt.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-container-high border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg leading-none">{opt.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{opt.label}</span>
                  </div>
                  {unitType === opt.id && (
                    <span className="material-symbols-outlined text-base">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Generate Text
          </button>
        </div>
      </div>

      {/* ── Right: Output + Stats ── */}
      <div className="lg:col-span-8 space-y-5">

        {/* Output */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Output</span>
            {output && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                  <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={handleDownload} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download
                </button>
              </div>
            )}
          </div>
          <div className="p-5 min-h-48">
            {output ? (
              unitType === "html" ? (
                <pre className="font-mono text-xs text-on-surface whitespace-pre-wrap break-all leading-relaxed">{output}</pre>
              ) : (
                <div className="space-y-4">
                  {output.split("\n\n").map((para, i) => (
                    <p key={i} className="text-on-surface text-sm leading-relaxed">{para}</p>
                  ))}
                </div>
              )
            ) : (
              <p className="text-on-surface-variant/30 italic text-sm">Click "Generate Text" to create Lorem Ipsum…</p>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden divide-x divide-outline-variant/10">
            {[
              { label: "Words",       value: stats.words    },
              { label: "Characters",  value: stats.chars    },
              { label: "Avg. Length", value: stats.avgLen   },
              { label: "Read Time",   value: stats.readTime },
            ].map(({ label, value }, i) => (
              <div key={label} className={`flex flex-col items-center justify-center py-5 gap-1 ${i === 3 ? "col-span-2 sm:col-span-1 border-t sm:border-t-0 divide-outline-variant/10" : ""}`}>
                <span className="text-2xl font-extrabold text-on-surface font-headline">{value}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
