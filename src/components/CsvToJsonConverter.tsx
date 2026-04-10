import { useState, useRef, useEffect } from "react";

type Separator = "auto" | "," | ";" | "\t";
type OutputFormat = "array" | "hash" | "minified";

function parseCSV(text: string, separator: Separator): string[][] {
  const sep =
    separator === "auto"
      ? detectSeparator(text)
      : separator;

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  return lines.map((line) => splitCSVLine(line, sep));
}

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const counts = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  if (counts["\t"] >= counts[","] && counts["\t"] >= counts[";"]) return "\t";
  if (counts[";"] >= counts[","]) return ";";
  return ",";
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && line.slice(i, i + sep.length) === sep) {
      result.push(current);
      current = "";
      i += sep.length - 1;
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function coerceValue(
  raw: string,
  parseNumbers: boolean,
  parseJson: boolean
): unknown {
  const trimmed = raw.trim();
  if (parseNumbers && trimmed !== "") {
    const n = Number(trimmed);
    if (!isNaN(n)) return n;
  }
  if (parseJson && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // not JSON
    }
  }
  return trimmed;
}

function convertToJson(
  text: string,
  separator: Separator,
  parseNumbers: boolean,
  parseJson: boolean,
  transpose: boolean,
  format: OutputFormat
): string {
  const rows = parseCSV(text, separator);
  if (rows.length < 1) return "";

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  let result: unknown;

  if (transpose) {
    // Flip the full matrix (header row + data rows), then re-derive headers
    const fullRows = [headers, ...dataRows.map((r) => r.map((v) => v))];
    const colCount = Math.max(...fullRows.map((r) => r.length));
    const transposed: string[][] = Array.from({ length: colCount }, (_, ci) =>
      fullRows.map((row) => row[ci] ?? "")
    );
    const newHeaders = transposed[0].map((h) => h.trim());
    const newDataRows = transposed.slice(1);
    result = newDataRows.map((row) => {
      const obj: Record<string, unknown> = {};
      newHeaders.forEach((h, hi) => {
        obj[h] = coerceValue(row[hi] ?? "", parseNumbers, parseJson);
      });
      return obj;
    });
  } else {
    result = dataRows.map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, hi) => {
        obj[h] = coerceValue(row[hi] ?? "", parseNumbers, parseJson);
      });
      return obj;
    });
  }

  if (format === "hash" && Array.isArray(result)) {
    const hash: Record<string, Record<string, unknown>> = {};
    (result as Record<string, unknown>[]).forEach((item, i) => {
      hash[`row_${i + 1}`] = item;
    });
    result = hash;
  }

  return format === "minified"
    ? JSON.stringify(result)
    : JSON.stringify(result, null, 2);
}

export default function CsvToJsonConverter() {
  const [csvText, setCsvText] = useState("");
  const [separator, setSeparator] = useState<Separator>("auto");
  const [parseNumbers, setParseNumbers] = useState(true);
  const [parseJson, setParseJson] = useState(true);
  const [transpose, setTranspose] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("array");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasConverted, setHasConverted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const outputLines = output ? output.split("\n").length : 0;
  const outputSize = output ? (new TextEncoder().encode(output).length / 1024).toFixed(2) : "0.00";

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? "");
      setError(null);
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFile(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function handleConvert() {
    setError(null);
    if (!csvText.trim()) {
      setError("No CSV data provided. Paste or upload a CSV file.");
      setOutput("");
      return;
    }
    try {
      const json = convertToJson(csvText, separator, parseNumbers, parseJson, transpose, format);
      setOutput(json);
      setHasConverted(true);
    } catch (err) {
      setError(`Conversion failed: ${(err as Error).message}`);
      setOutput("");
    }
  }

  useEffect(() => {
    if (!hasConverted || !csvText.trim()) return;
    try {
      const json = convertToJson(csvText, separator, parseNumbers, parseJson, transpose, format);
      setOutput(json);
      setError(null);
    } catch (err) {
      setError(`Conversion failed: ${(err as Error).message}`);
      setOutput("");
    }
  }, [separator, parseNumbers, parseJson, transpose, format]);

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const checkboxes: { label: string; checked: boolean; setter: (v: boolean) => void }[] = [
    { label: "Parse numbers", checked: parseNumbers, setter: setParseNumbers },
    { label: "Parse JSON strings", checked: parseJson, setter: setParseJson },
    { label: "Transpose structure", checked: transpose, setter: setTranspose },
  ];

  const formats: { value: OutputFormat; label: string }[] = [
    { value: "array", label: "Array" },
    { value: "hash", label: "Hash (Object)" },
    { value: "minified", label: "Minified" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Panel: Source CSV */}
      <section className="lg:col-span-4 flex flex-col gap-4">
        <div
          className={`relative bg-surface-container-low dark:bg-inverse-surface/10 p-6 rounded-xl flex flex-col grow h-full border transition-all ${
            dragging
              ? "border-primary border-dashed bg-primary/5"
              : "border-outline-variant/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant">
              Source CSV
            </h3>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-[10px] font-label font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Choose File
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <button
                onClick={() => { setCsvText(""); setOutput(""); setError(null); }}
                disabled={!csvText}
                className="flex items-center justify-center p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/10 rounded-lg transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-on-surface-variant disabled:hover:bg-transparent"
                title="Clear input"
              >
                <span className="material-symbols-outlined text-base">delete_sweep</span>
              </button>
            </div>
          </div>

          {dragging && (
            <div className="absolute inset-6 rounded-xl border-2 border-dashed border-primary/60 flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-4xl">file_upload</span>
                <span className="text-xs font-bold uppercase tracking-widest">Drop file here</span>
              </div>
            </div>
          )}

          <div className="flex-grow flex flex-col gap-1">
            <textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setError(null); }}
              className="w-full h-[360px] bg-surface-container dark:bg-inverse-surface/20 border-0 rounded-xl p-5 font-mono text-[13px] text-on-background resize-none placeholder:text-outline/40 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Paste CSV or drag & drop a file..."
            />
            <div className="text-right text-[10px] font-mono text-outline/40 pr-1">
              {csvText ? `${csvText.split(/\r?\n/).filter(Boolean).length} LINES` : "EMPTY_BUFFER"}
            </div>
          </div>

          <button
            onClick={handleConvert}
            className="mt-4 w-full py-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-headline font-extrabold text-sm uppercase tracking-widest shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
          >
            Convert
          </button>
        </div>
      </section>

      {/* Center: Configuration */}
      <section className="lg:col-span-3 flex flex-col gap-4">
        <div className="bg-surface-container-low dark:bg-inverse-surface/10 p-6 rounded-xl flex flex-col gap-7 h-full border border-outline-variant/20">
          <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant">
            Configuration
          </h3>

          {/* Separator */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-label uppercase tracking-widest text-outline">
              Separator
            </label>
            <div className="relative">
              <select
                value={separator}
                onChange={(e) => setSeparator(e.target.value as Separator)}
                className="w-full bg-surface-container dark:bg-inverse-surface/20 text-sm py-3 px-4 rounded-lg appearance-none border-0 focus:ring-2 focus:ring-primary/20 text-on-background"
              >
                <option value="auto">Auto-detect</option>
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-on-surface-variant text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Processing Rules */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-label uppercase tracking-widest text-outline">
              Processing Rules
            </label>
            {checkboxes.map(({ label, checked, setter }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setter(!checked)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    checked
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container dark:bg-inverse-surface/20 text-outline/30 group-hover:bg-surface-container-high"
                  }`}
                >
                  {checked && (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  )}
                </div>
                <span
                  onClick={() => setter(!checked)}
                  className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors cursor-pointer"
                >
                  {label}
                </span>
              </label>
            ))}
          </div>

          {/* Output Format */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-label uppercase tracking-widest text-outline">
              Output Format
            </label>
            <div className="flex flex-col gap-2">
              {formats.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold transition-colors ${
                    format === value
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container dark:bg-inverse-surface/20 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span>{label}</span>
                  <span className="material-symbols-outlined text-base">
                    {format === value ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-error-container/30 border border-error/20 rounded-xl mt-auto">
              <span className="material-symbols-outlined text-error text-sm shrink-0 mt-0.5">error</span>
              <span className="text-error font-mono text-[11px] leading-relaxed">{error}</span>
            </div>
          )}
        </div>
      </section>

      {/* Right Panel: Output */}
      <section className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-surface-container-low dark:bg-inverse-surface/10 p-6 rounded-xl flex flex-col flex-grow h-full border border-outline-variant/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex justify-between items-center mb-6 z-10">
            <h3 className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant">
              JSON Output
            </h3>
            <div className="flex items-center gap-3">
              {output && (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-tertiary">
                  <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" />
                  VALIDATED
                </span>
              )}
            </div>
          </div>

          <div className="relative flex-grow z-10">
            <textarea
              value={output}
              readOnly
              className="w-full h-full min-h-[400px] bg-surface-container dark:bg-inverse-surface/20 border-0 rounded-xl p-5 font-mono text-[13px] text-primary dark:text-primary-fixed resize-none focus:ring-0"
              placeholder={'{ "status": "waiting_for_input" }'}
            />
          </div>

          <div className="mt-6 flex justify-between items-center z-10">
            <div className="text-[10px] font-label text-outline flex gap-4">
              <span>LINES: {outputLines}</span>
              <span>SIZE: {outputSize} KB</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1.5 px-4 py-2 bg-surface-container dark:bg-inverse-surface/20 hover:bg-surface-container-high rounded-lg text-[10px] font-label font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? "check" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-[10px] font-label font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Download
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
