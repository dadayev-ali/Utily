import { useState, useCallback, useRef } from "react";

// ── Data Banks ────────────────────────────────────────────────────────────────
const FIRST = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Barbara","David","Susan","Richard","Jessica","Joseph","Sarah","Thomas","Karen","Charles","Lisa","Christopher","Nancy","Daniel","Betty","Matthew","Margaret","Anthony","Sandra","Mark","Ashley","Donald","Dorothy","Steven","Kimberly","Paul","Emily","Andrew","Donna","Joshua","Michelle"];
const LAST  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Martinez","Anderson","Taylor","Thomas","Hernandez","Moore","Martin","Jackson","Thompson","White","Lopez","Lee","Gonzalez","Harris","Clark","Lewis","Robinson","Walker","Perez","Hall","Young","Allen","Sanchez","Wright","King","Scott","Green","Baker","Adams","Nelson","Hill"];
const CITIES = ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Nashville","Oklahoma City","El Paso","Washington","Boston","Memphis","Louisville","Portland","Las Vegas","Milwaukee","Albuquerque"];
const COUNTRIES = ["United States","United Kingdom","Canada","Australia","Germany","France","Japan","India","Brazil","Mexico","Italy","Spain","Netherlands","Sweden","Norway","Denmark","Finland","Switzerland","Poland","Austria","Belgium","Portugal","Greece","Czech Republic","Romania","Hungary","South Korea","Singapore","New Zealand","Argentina"];
const COMPANIES = ["Acme Corp","Globex","Initech","Umbrella","Soylent","Massive Dynamic","Oceanic Airlines","Rekall","Tyrell Corp","Weyland-Yutani","Nakatomi Trading","Cyberdyne Systems","Oscorp","Stark Industries","Wayne Enterprises","LexCorp","Aperture Science","Black Mesa","InGen","Virtucon"];
const JOBS = ["Software Engineer","Product Manager","Data Analyst","Designer","Marketing Manager","Sales Executive","DevOps Engineer","QA Engineer","Business Analyst","Scrum Master","Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","Cloud Architect","Security Engineer","HR Manager","Finance Manager","Operations Manager","Technical Lead"];
const DOMAINS = ["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com","proton.me","company.com","corp.io","tech.dev","mail.com"];
const STREETS = ["Main St","Oak Ave","Maple Dr","Cedar Ln","Pine Rd","Elm St","Washington Blvd","Park Ave","Lake Dr","River Rd"];
const BOOL_VALS = ["true","false"];

let __id = 1;
const uid = () => __id++;

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad2(n: number) { return String(n).padStart(2, "0"); }

function uuid4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateValue(type: string, index: number): string {
  switch (type) {
    case "row_number": return String(index + 1);
    case "first_name": return pick(FIRST);
    case "last_name":  return pick(LAST);
    case "full_name":  return `${pick(FIRST)} ${pick(LAST)}`;
    case "email":      return `${pick(FIRST).toLowerCase()}.${pick(LAST).toLowerCase()}${rand(1,99)}@${pick(DOMAINS)}`;
    case "phone":      return `+1-${rand(200,999)}-${rand(100,999)}-${rand(1000,9999)}`;
    case "age":        return String(rand(18, 75));
    case "number":     return String(rand(1, 10000));
    case "boolean":    return pick(BOOL_VALS);
    case "uuid":       return uuid4();
    case "city":       return pick(CITIES);
    case "country":    return pick(COUNTRIES);
    case "company":    return pick(COMPANIES);
    case "job_title":  return pick(JOBS);
    case "address":    return `${rand(1, 9999)} ${pick(STREETS)}`;
    case "date":       return `${rand(2000,2024)}-${pad2(rand(1,12))}-${pad2(rand(1,28))}`;
    case "url":        return `https://www.${pick(COMPANIES).toLowerCase().replace(/\s+/g,"-")}.com`;
    case "ip":         return `${rand(1,254)}.${rand(0,255)}.${rand(0,255)}.${rand(0,254)}`;
    case "username":   return `${pick(FIRST).toLowerCase()}${pick(LAST).toLowerCase().slice(0,4)}${rand(10,99)}`;
    case "password":   return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase().slice(0,4) + "!";
    default: return "";
  }
}

const FIELD_TYPES = [
  { value: "row_number", label: "Row Number" },
  { value: "first_name", label: "First Name" },
  { value: "last_name",  label: "Last Name"  },
  { value: "full_name",  label: "Full Name"  },
  { value: "email",      label: "Email"      },
  { value: "phone",      label: "Phone"      },
  { value: "age",        label: "Age"        },
  { value: "number",     label: "Number"     },
  { value: "boolean",    label: "Boolean"    },
  { value: "uuid",       label: "UUID"       },
  { value: "date",       label: "Date"       },
  { value: "city",       label: "City"       },
  { value: "country",    label: "Country"    },
  { value: "company",    label: "Company"    },
  { value: "job_title",  label: "Job Title"  },
  { value: "address",    label: "Address"    },
  { value: "url",        label: "URL"        },
  { value: "ip",         label: "IP Address" },
  { value: "username",   label: "Username"   },
  { value: "password",   label: "Password"   },
];

type Format = "csv" | "json" | "sql";

interface Field { id: number; name: string; type: string }

function generateCSV(fields: Field[], rows: number, header: boolean): string {
  const lines: string[] = [];
  if (header) lines.push(fields.map(f => f.name).join(","));
  for (let i = 0; i < rows; i++) {
    lines.push(fields.map(f => {
      const v = generateValue(f.type, i);
      return v.includes(",") ? `"${v}"` : v;
    }).join(","));
  }
  return lines.join("\n");
}

function generateJSON(fields: Field[], rows: number): string {
  const data = Array.from({ length: rows }, (_, i) => {
    const obj: Record<string, string> = {};
    fields.forEach(f => { obj[f.name] = generateValue(f.type, i); });
    return obj;
  });
  return JSON.stringify(data, null, 2);
}

function generateSQL(fields: Field[], rows: number, tableName: string): string {
  const cols = fields.map(f => f.name).join(", ");
  const inserts = Array.from({ length: rows }, (_, i) => {
    const vals = fields.map(f => `'${generateValue(f.type, i).replace(/'/g, "''")}'`).join(", ");
    return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
  });
  return inserts.join("\n");
}

export default function RandomDataGenerator() {
  const [fields, setFields] = useState<Field[]>([
    { id: uid(), name: "id",         type: "row_number" },
    { id: uid(), name: "first_name", type: "first_name" },
    { id: uid(), name: "email",      type: "email"      },
  ]);
  const [rowCount, setRowCount] = useState(10);
  const [rowInput, setRowInput] = useState("10");

  const [format, setFormat] = useState<Format>("csv");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [tableName, setTableName] = useState("users");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const addField = () => setFields(prev => [...prev, { id: uid(), name: `field_${prev.length + 1}`, type: "full_name" }]);
  const removeField = (id: number) => setFields(prev => prev.filter(f => f.id !== id));
  const updateField = (id: number, patch: Partial<Omit<Field, "id">>) =>
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

  const handleGenerate = useCallback(() => {
    if (!fields.length) return;
    const count = Math.max(1, Math.min(rowCount || 1, 5000));
    if (format === "csv") setOutput(generateCSV(fields, count, includeHeader));
    else if (format === "json") setOutput(generateJSON(fields, count));
    else setOutput(generateSQL(fields, count, tableName));
    setTimeout(() => {
      if (outputRef.current) {
        const top = outputRef.current.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 50);
  }, [fields, rowCount, format, includeHeader, tableName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === "json" ? "json" : format === "sql" ? "sql" : "csv";
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `data.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="space-y-4">

      {/* ── Schema Builder ── */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/15">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Schema</span>
          <button onClick={addField} className={`${CHIP} bg-primary/10 text-primary`}>
            <span className="material-symbols-outlined text-sm">add</span>Add Field
          </button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2 border-b border-outline-variant/10 bg-surface-container-high/40">
          <div className="col-span-4 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Field Name</div>
          <div className="col-span-7 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Type</div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {fields.map((field) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-center px-5 py-3 hover:bg-surface-container-high/50 transition-colors duration-150">
              <div className="col-span-5 sm:col-span-4">
                <input
                  value={field.name}
                  onChange={e => updateField(field.id, { name: e.target.value })}
                  className="w-full bg-transparent border-b border-outline-variant/25 focus:border-primary px-1 py-1 text-sm text-on-surface outline-none transition-colors duration-150 font-mono"
                  style={{ boxShadow: "none" }}
                  placeholder="field_name"
                  spellCheck={false}
                />
              </div>
              <div className="col-span-6 sm:col-span-7">
                <select
                  value={field.type}
                  onChange={e => updateField(field.id, { type: e.target.value })}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-1.5 text-sm text-on-surface outline-none cursor-pointer transition-colors duration-150 hover:border-outline-variant/40"
                  style={{ boxShadow: "none" }}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => removeField(field.id)}
                  disabled={fields.length <= 1}
                  className="text-on-surface-variant/30 hover:text-error transition-colors duration-150 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Settings ── */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-outline-variant/15">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Settings</span>
        </div>
        <div className="p-5 flex flex-wrap items-end gap-6">
          {/* Row count */}
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 whitespace-nowrap">Rows <span className="normal-case tracking-normal opacity-70">(max 5000)</span></label>
            <input
              type="number" min={0} max={5000}
              value={rowInput}
              onChange={e => {
                setRowInput(e.target.value);
                const n = Number(e.target.value);
                setRowCount(isNaN(n) || e.target.value === "" ? 0 : Math.min(5000, n));
              }}
              onBlur={() => {
                if (rowInput === "" || isNaN(Number(rowInput)) || Number(rowInput) < 1) {
                  setRowInput("1");
                  setRowCount(1);
                }
              }}
              className="w-28 bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-mono text-on-surface outline-none transition-colors duration-150 hover:border-outline-variant/40 focus:border-primary"
              style={{ boxShadow: "none" }}
            />
          </div>

          {/* Format */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Format</label>
            <div className="flex rounded-xl border border-outline-variant/20 overflow-hidden">
              {(["csv","json","sql"] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
                    format === f ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* SQL table name */}
          {format === "sql" && (
            <div className="flex items-center gap-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 whitespace-nowrap">Table Name</label>
              <input
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                className="w-36 bg-surface-container-high border border-outline-variant/20 rounded-xl px-3 py-2 text-sm font-mono text-on-surface outline-none transition-colors duration-150 hover:border-outline-variant/40 focus:border-primary"
                style={{ boxShadow: "none" }}
                spellCheck={false}
              />
            </div>
          )}

          {/* Include header (CSV only) */}
          {format === "csv" && (
            <label className="flex items-center gap-2.5 cursor-pointer pb-1">
              <div
                className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200 ${includeHeader ? "bg-primary" : "bg-outline-variant/50"}`}
                onClick={() => setIncludeHeader(v => !v)}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${includeHeader ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-on-surface-variant">Include header</span>
            </label>
          )}
        </div>
      </div>

      {/* ── Generate Button ── */}
      <button
        onClick={handleGenerate}
        className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-2xl hover:opacity-90 active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-sm"
      >
        <span className="material-symbols-outlined text-base">data_object</span>
        Generate Data
      </button>

      {/* ── Output ── */}
      {output && (
        <div ref={outputRef} className="bg-surface-container border border-outline-variant/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/15">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Output</span>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={handleDownload} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
                <span className="material-symbols-outlined text-sm">download</span>Download
              </button>
            </div>
          </div>
          <pre className="p-5 font-mono text-xs text-on-surface leading-5 overflow-auto max-h-96 whitespace-pre-wrap break-all">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
