import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PERIODS_PER_YEAR: Record<string, number> = {
  days: 365,
  weeks: 52,
  months: 12,
  years: 1,
};

function calcPayment(principal: number, annualRate: number, periods: number, periodsPerYear: number): number {
  if (periods <= 0) return 0;
  if (annualRate === 0) return principal / periods;
  const r = annualRate / 100 / periodsPerYear;
  return (principal * r * Math.pow(1 + r, periods)) / (Math.pow(1 + r, periods) - 1);
}

// ── Input Field ───────────────────────────────────────────────────────────────

function Field({
  label,
  sublabel,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-outline">
          {label}
        </label>
        {sublabel && (
          <p className="text-[0.65rem] text-outline/70 mt-0.5">{sublabel}</p>
        )}
      </div>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-4 text-on-surface-variant font-semibold text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min ?? 0}
          max={max}
          step={step ?? 1}
          onKeyDown={(e) => {
            if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
          }}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (parseFloat(val) >= 0 && !val.includes("-"))) onChange(val);
          }}
          className={`w-full bg-surface-container dark:bg-inverse-surface/10 border-0 rounded-xl py-4 text-sm font-mono font-semibold text-on-background focus:ring-2 focus:ring-primary/20 outline-none transition-all
            ${prefix ? "pl-8 pr-4" : suffix ? "pl-4 pr-10" : "px-4"}`}
        />
        {suffix && (
          <span className="absolute right-4 text-on-surface-variant font-semibold text-sm select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 p-6 rounded-xl ${
        accent
          ? "bg-primary dark:bg-primary-container"
          : "bg-surface-container dark:bg-inverse-surface/10"
      }`}
    >
      <span
        className={`font-label text-[0.65rem] uppercase tracking-widest ${
          accent ? "text-on-primary/70 dark:text-on-primary-container/70" : "text-outline"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-2xl font-extrabold font-headline tracking-tight ${
          accent
            ? "text-on-primary dark:text-on-primary-container"
            : "text-on-background"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Amortization Table ────────────────────────────────────────────────────────

interface AmRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

function buildSchedule(
  principal: number,
  annualRate: number,
  months: number,
  monthly: number
): AmRow[] {
  const rows: AmRow[] = [];
  let balance = principal;
  const r = annualRate / 100 / 12;

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const princ = monthly - interest;
    balance = Math.max(0, balance - princ);
    rows.push({
      month: i,
      payment: monthly,
      principal: princ,
      interest,
      balance,
    });
  }
  return rows;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [termYears, setTermYears] = useState("5");
  type TermUnit = "years" | "months" | "weeks" | "days";
  const [termMode, setTermMode] = useState<TermUnit>("years");
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);
  const [showSchedule, setShowSchedule] = useState(true);

  const TERM_UNITS: { value: TermUnit; label: string }[] = [
    { value: "days",   label: "Days"   },
    { value: "weeks",  label: "Weeks"  },
    { value: "months", label: "Months" },
    { value: "years",  label: "Years"  },
  ];

  const periods = Math.round(parseFloat(termYears) || 0);
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const periodsPerYear = PERIODS_PER_YEAR[termMode] ?? 12;

  const payment = useMemo(() => {
    if (p <= 0 || periods <= 0) return 0;
    return calcPayment(p, r, periods, periodsPerYear);
  }, [p, r, periods, periodsPerYear]);

  const totalPayment = payment * periods;
  const totalInterest = totalPayment - p;

  // For amortization schedule, convert to monthly equivalent
  const months = useMemo(() => {
    if (termMode === "years")  return Math.round(periods * 12);
    if (termMode === "months") return periods;
    if (termMode === "weeks")  return Math.round((periods * 7) / 30.4375);
    if (termMode === "days")   return Math.round(periods / 30.4375);
    return periods;
  }, [periods, termMode]);

  const schedule = useMemo(() => {
    if (!showSchedule || payment === 0) return [];
    return buildSchedule(p, r, months, calcPayment(p, r, months, 12));
  }, [showSchedule, p, r, months, payment]);

  const valid = p > 0 && periods > 0 && payment > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest dark:bg-surface-container-low p-8 rounded-2xl">
        <Field
          label="Loan Amount"
          sublabel="Total principal borrowed"
          value={principal}
          onChange={setPrincipal}
          prefix="$"
          min={0}
          step={100}
        />

        <Field
          label="Annual Interest Rate"
          sublabel="Yearly interest percentage"
          value={rate}
          onChange={setRate}
          suffix="%"
          min={0}
          max={100}
          step={0.1}
        />

        <div className="flex flex-col gap-2">
          <div>
            <label className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-outline">
              Loan Term
            </label>
            <p className="text-[0.65rem] text-outline/70 mt-0.5">Duration of the loan</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <input
                type="number"
                value={termYears}
                min={1}
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseFloat(val) >= 0 && !val.includes("-"))) setTermYears(val);
                }}
                className="w-full bg-surface-container dark:bg-inverse-surface/10 border-0 rounded-xl px-4 py-4 text-sm font-mono font-semibold text-on-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            {/* Unit dropdown */}
            <div className="relative">
              <button
                onClick={() => setTermDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-4 bg-surface-container dark:bg-inverse-surface/10 rounded-xl font-label text-[0.75rem] uppercase tracking-wide text-on-surface hover:bg-surface-container-high transition-all w-[140px] justify-between"
              >
                <span>{TERM_UNITS.find((u) => u.value === termMode)?.label}</span>
                <span className="material-symbols-outlined text-sm text-on-surface-variant">
                  {termDropdownOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                </span>
              </button>
              {termDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-[140px] bg-surface-container-low dark:bg-[#2d3133] border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden z-50">
                  {TERM_UNITS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { setTermMode(value); setTermDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                        termMode === value
                          ? "bg-primary/10 text-primary dark:text-primary-fixed"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      }`}
                    >
                      {termMode === value && (
                        <span className="material-symbols-outlined text-xs mr-1.5 align-middle">check</span>
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-end">
          <div className="flex items-center gap-3 p-4 bg-surface-container dark:bg-inverse-surface/10 rounded-xl">
            <span className="material-symbols-outlined text-tertiary">info</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {valid
                ? `${periods} ${TERM_UNITS.find(u => u.value === termMode)?.label.toLowerCase()} × $${fmt(payment)} / ${termMode.replace(/s$/, "")}`
                : "Fill in all fields to calculate."}
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      {valid && (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, minmax(160px, 1fr))" }}>
            <ResultCard
              label={`${TERM_UNITS.find(u => u.value === termMode)?.label.replace(/s$/, "")} Payment`}
              value={`$${fmt(payment)}`}
              accent
            />
            <ResultCard
              label="Total Payment"
              value={`$${fmt(totalPayment)}`}
            />
            <ResultCard
              label="Total Interest"
              value={`$${fmt(totalInterest)}`}
            />
          </div>

          {/* Interest vs Principal bar */}
          <div className="bg-surface-container-lowest dark:bg-surface-container-low p-6 rounded-2xl flex flex-col gap-3">
            <span className="font-label text-[0.75rem] uppercase tracking-[0.05em] text-outline">
              Principal vs Interest Breakdown
            </span>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-primary transition-all duration-500"
                style={{ width: `${(p / totalPayment) * 100}%` }}
              />
              <div className="bg-error/60 flex-1" />
            </div>
            <div className="flex gap-6 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                Principal — {((p / totalPayment) * 100).toFixed(1)}%
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-error/60 inline-block" />
                Interest — {((totalInterest / totalPayment) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Amortization toggle */}
          <div>
            <button
              onClick={() => setShowSchedule((s) => !s)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-low dark:bg-inverse-surface/10 font-label text-[0.75rem] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                {showSchedule ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
              {showSchedule ? "Hide" : "Show"} Amortization Schedule
            </button>

            {showSchedule && (
              <div className="mt-4 overflow-auto rounded-2xl border border-outline-variant/20 max-h-96">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-surface-container dark:bg-[#2d3133]">
                    <tr>
                      {["#", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-label text-[0.65rem] uppercase tracking-widest text-outline border-b border-outline-variant/20"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => (
                      <tr
                        key={row.month}
                        className={`transition-colors ${
                          i % 2 === 0
                            ? "bg-surface-container-lowest dark:bg-[#191c1e]"
                            : "bg-surface-container-low dark:bg-surface-container/20"
                        } hover:bg-primary/5`}
                      >
                        <td className="px-4 py-2.5 text-outline">{row.month}</td>
                        <td className="px-4 py-2.5 text-on-surface">${fmt(row.payment)}</td>
                        <td className="px-4 py-2.5 text-primary dark:text-primary-fixed">${fmt(row.principal)}</td>
                        <td className="px-4 py-2.5 text-error">${fmt(row.interest)}</td>
                        <td className="px-4 py-2.5 text-on-surface">${fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
