import { useState, useCallback } from "react";

function generateUUID(): string {
  return crypto.randomUUID();
}

export default function UuidGenerator() {
  const [singleUUID, setSingleUUID] = useState<string>(() => generateUUID());
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(10);
  const [bulkUUIDs, setBulkUUIDs] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [uppercase, setUppercase] = useState(false);

  const format = useCallback(
    (uuid: string) => (uppercase ? uuid.toUpperCase() : uuid),
    [uppercase]
  );

  const handleGenerate = () => {
    setSingleUUID(generateUUID());
    setCopied(false);
  };

  const handleCopySingle = () => {
    navigator.clipboard.writeText(format(singleUUID));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBulkGenerate = () => {
    const clamped = Math.min(Math.max(count, 1), 1000);
    setBulkUUIDs(Array.from({ length: clamped }, generateUUID));
  };

  const handleCopyOne = (uuid: string, i: number) => {
    navigator.clipboard.writeText(format(uuid));
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(bulkUUIDs.map(format).join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([bulkUUIDs.map(format).join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uuids.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const CHIP =
    "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="space-y-6">
      {/* Options bar */}
      <div className="flex items-center gap-2 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div
            className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 ${
              uppercase ? "bg-primary" : "bg-outline-variant"
            }`}
            onClick={() => setUppercase((v) => !v)}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                uppercase ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">
            Uppercase
          </span>
        </label>
      </div>

      {/* Single UUID */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-outline-variant/20 gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
            Single UUID
          </span>
        </div>
        <div className="p-5 space-y-4">
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
            Generate UUID v4
          </button>
          <div className="flex items-center justify-between bg-surface-container-high border border-outline-variant/20 rounded-lg px-4 py-3 gap-4">
            <span className="font-mono text-sm sm:text-base text-on-surface tracking-wider select-all break-all">
              {format(singleUUID)}
            </span>
            <button
              onClick={handleCopySingle}
              className={`${CHIP} shrink-0 bg-secondary-container text-on-secondary-container`}
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Generator */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              layers
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
              Bulk Generator
            </span>
          </div>
          {bulkUUIDs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className={`${CHIP} bg-secondary-container text-on-secondary-container`}
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedAll ? "check" : "content_copy"}
                </span>
                {copiedAll ? "Copied" : "Copy All"}
              </button>
              <button
                onClick={handleDownload}
                className={`${CHIP} bg-secondary-container text-on-secondary-container`}
              >
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
                Download
              </button>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                How many?
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) =>
                  setCount(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 1000))
                }
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={handleBulkGenerate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-sm cursor-pointer"
            >
              Generate
            </button>
          </div>

          {bulkUUIDs.length > 0 ? (
            <div className="bg-surface-container-high border border-outline-variant/20 rounded-lg overflow-hidden">
              <div className="max-h-72 overflow-y-auto font-mono text-sm">
                {bulkUUIDs.map((uuid, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2 hover:bg-surface-container-highest transition-colors border-b border-outline-variant/10 last:border-0 group"
                  >
                    <span className="text-on-surface-variant group-hover:text-on-surface transition-colors select-all text-xs sm:text-sm">
                      {format(uuid)}
                    </span>
                    <button
                      onClick={() => handleCopyOne(uuid, i)}
                      className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedIndex === i ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-on-surface-variant text-sm">
              Set a count and click Generate
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
