import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Unit {
  label: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface Category {
  name: string;
  icon: string;
  units: Unit[];
}

// ── Conversion Data ───────────────────────────────────────────────────────────

const categories: Category[] = [
  {
    name: "Length",
    icon: "straighten",
    units: [
      { label: "Meter",      symbol: "m",   toBase: v => v,           fromBase: v => v },
      { label: "Kilometer",  symbol: "km",  toBase: v => v * 1000,    fromBase: v => v / 1000 },
      { label: "Centimeter", symbol: "cm",  toBase: v => v / 100,     fromBase: v => v * 100 },
      { label: "Millimeter", symbol: "mm",  toBase: v => v / 1000,    fromBase: v => v * 1000 },
      { label: "Micrometer", symbol: "µm",  toBase: v => v / 1e6,     fromBase: v => v * 1e6 },
      { label: "Inch",       symbol: "in",  toBase: v => v * 0.0254,  fromBase: v => v / 0.0254 },
      { label: "Foot",       symbol: "ft",  toBase: v => v * 0.3048,  fromBase: v => v / 0.3048 },
      { label: "Yard",       symbol: "yd",  toBase: v => v * 0.9144,  fromBase: v => v / 0.9144 },
      { label: "Mile",       symbol: "mi",  toBase: v => v * 1609.344,fromBase: v => v / 1609.344 },
      { label: "Nautical Mi",symbol: "nmi", toBase: v => v * 1852,    fromBase: v => v / 1852 },
    ],
  },
  {
    name: "Temperature",
    icon: "thermometer",
    units: [
      {
        label: "Celsius",    symbol: "°C",
        toBase: v => v,
        fromBase: v => v,
      },
      {
        label: "Fahrenheit", symbol: "°F",
        toBase: v => (v - 32) * 5 / 9,
        fromBase: v => v * 9 / 5 + 32,
      },
      {
        label: "Kelvin",     symbol: "K",
        toBase: v => v - 273.15,
        fromBase: v => v + 273.15,
      },
      {
        label: "Rankine",    symbol: "°R",
        toBase: v => (v - 491.67) * 5 / 9,
        fromBase: v => (v + 273.15) * 9 / 5,
      },
    ],
  },
  {
    name: "Area",
    icon: "crop_square",
    units: [
      { label: "Sq. Meter",     symbol: "m²",   toBase: v => v,              fromBase: v => v },
      { label: "Sq. Kilometer", symbol: "km²",  toBase: v => v * 1e6,        fromBase: v => v / 1e6 },
      { label: "Sq. Centimeter",symbol: "cm²",  toBase: v => v / 10000,      fromBase: v => v * 10000 },
      { label: "Sq. Millimeter",symbol: "mm²",  toBase: v => v / 1e6,        fromBase: v => v * 1e6 },
      { label: "Sq. Micrometer",symbol: "µm²",  toBase: v => v / 1e12,       fromBase: v => v * 1e12 },
      { label: "Sq. Foot",      symbol: "ft²",  toBase: v => v * 0.09290304,  fromBase: v => v / 0.09290304 },
      { label: "Sq. Yard",      symbol: "yd²",  toBase: v => v * 0.83612736,  fromBase: v => v / 0.83612736 },
      { label: "Sq. Mile",      symbol: "mi²",  toBase: v => v * 2589988.1103,fromBase: v => v / 2589988.1103 },
      { label: "Sq. Inch",      symbol: "in²",  toBase: v => v * 0.00064516, fromBase: v => v / 0.00064516 },
      { label: "Acre",          symbol: "ac",   toBase: v => v * 4046.856,   fromBase: v => v / 4046.856 },
      { label: "Hectare",       symbol: "ha",   toBase: v => v * 10000,      fromBase: v => v / 10000 },
    ],
  },
  {
    name: "Volume",
    icon: "water_drop",
    units: [
      { label: "Liter",       symbol: "L",    toBase: v => v,              fromBase: v => v },
      { label: "Milliliter",  symbol: "mL",   toBase: v => v / 1000,       fromBase: v => v * 1000 },
      { label: "Cubic Meter", symbol: "m³",   toBase: v => v * 1000,       fromBase: v => v / 1000 },
      { label: "Cubic Cm",    symbol: "cm³",  toBase: v => v / 1000,       fromBase: v => v * 1000 },
      { label: "Cubic Foot",  symbol: "ft³",  toBase: v => v * 28.3168,    fromBase: v => v / 28.3168 },
      { label: "Cubic Inch",  symbol: "in³",  toBase: v => v * 0.0163871,  fromBase: v => v / 0.0163871 },
      { label: "Gallon (US)", symbol: "gal",  toBase: v => v * 3.78541,    fromBase: v => v / 3.78541 },
      { label: "Quart (US)",  symbol: "qt",   toBase: v => v * 0.946353,   fromBase: v => v / 0.946353 },
      { label: "Pint (US)",   symbol: "pt",   toBase: v => v * 0.473176,   fromBase: v => v / 0.473176 },
      { label: "Fluid Oz",    symbol: "fl oz",toBase: v => v * 0.0295735,  fromBase: v => v / 0.0295735 },
    ],
  },
  {
    name: "Weight",
    icon: "weight",
    units: [
      { label: "Kilogram",    symbol: "kg",  toBase: v => v,              fromBase: v => v },
      { label: "Gram",        symbol: "g",   toBase: v => v / 1000,       fromBase: v => v * 1000 },
      { label: "Milligram",   symbol: "mg",  toBase: v => v / 1e6,        fromBase: v => v * 1e6 },
      { label: "Metric Ton",  symbol: "t",   toBase: v => v * 1000,       fromBase: v => v / 1000 },
      { label: "Pound",       symbol: "lb",  toBase: v => v * 0.453592,   fromBase: v => v / 0.453592 },
      { label: "Ounce",       symbol: "oz",  toBase: v => v * 0.0283495,  fromBase: v => v / 0.0283495 },
      { label: "Stone",       symbol: "st",  toBase: v => v * 6.35029,    fromBase: v => v / 6.35029 },
      { label: "US Ton",      symbol: "ton", toBase: v => v * 907.185,    fromBase: v => v / 907.185 },
    ],
  },
  {
    name: "Time",
    icon: "schedule",
    units: [
      { label: "Second",      symbol: "s",   toBase: v => v,               fromBase: v => v },
      { label: "Millisecond", symbol: "ms",  toBase: v => v / 1000,        fromBase: v => v * 1000 },
      { label: "Microsecond", symbol: "µs",  toBase: v => v / 1e6,         fromBase: v => v * 1e6 },
      { label: "Minute",      symbol: "min", toBase: v => v * 60,          fromBase: v => v / 60 },
      { label: "Hour",        symbol: "h",   toBase: v => v * 3600,        fromBase: v => v / 3600 },
      { label: "Day",         symbol: "d",   toBase: v => v * 86400,       fromBase: v => v / 86400 },
      { label: "Week",        symbol: "wk",  toBase: v => v * 604800,      fromBase: v => v / 604800 },
      { label: "Month",       symbol: "mo",  toBase: v => v * 2629800,     fromBase: v => v / 2629800 },
      { label: "Year",        symbol: "yr",  toBase: v => v * 31557600,    fromBase: v => v / 31557600 },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function convert(value: number, from: Unit, to: Unit): number {
  const base = from.toBase(value);
  return to.fromBase(base);
}

function formatResult(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e12 || (abs < 0.0001 && abs > 0)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  // Up to 8 significant digits, strip trailing zeros
  const formatted = parseFloat(value.toPrecision(8)).toString();
  return formatted;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnitConverter() {
  const [activeCat, setActiveCat] = useState(0);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [inputValue, setInputValue] = useState("1");

  const category = categories[activeCat];
  const fromUnit = category.units[fromIdx];
  const toUnit = category.units[toIdx];

  const numericInput = parseFloat(inputValue);
  const resultNum = isNaN(numericInput) ? NaN : convert(numericInput, fromUnit, toUnit);
  const resultStr = isNaN(numericInput) ? "—" : formatResult(resultNum);

  const switchCategory = useCallback((idx: number) => {
    setActiveCat(idx);
    setFromIdx(0);
    setToIdx(1);
    setInputValue("1");
  }, []);

  const selectFrom = useCallback((idx: number) => {
    if (idx === toIdx) {
      setToIdx(fromIdx);
    }
    setFromIdx(idx);
  }, [fromIdx, toIdx]);

  const selectTo = useCallback((idx: number) => {
    if (idx === fromIdx) {
      setFromIdx(toIdx);
    }
    setToIdx(idx);
  }, [fromIdx, toIdx]);

  const swapUnits = useCallback(() => {
    const prevFrom = fromIdx;
    const prevTo = toIdx;
    setFromIdx(prevTo);
    setToIdx(prevFrom);
    if (!isNaN(resultNum)) {
      setInputValue(formatResult(resultNum));
    }
  }, [fromIdx, toIdx, resultNum]);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-0 relative z-10">
        {categories.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => switchCategory(i)}
            className={`px-2 py-1 sm:px-4 sm:py-2.5 font-bold text-[0.65rem] sm:text-sm rounded-t transition-all flex items-center gap-0.5 sm:gap-1.5 ${
              i === activeCat
                ? "bg-primary text-white border border-primary border-b-transparent z-10 shadow-md"
                : "bg-surface-container-highest dark:bg-surface-container-highest/40 text-on-surface-variant border border-transparent hover:bg-surface-container hover:text-on-surface dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-xs sm:text-base hidden sm:inline">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Converter Workspace */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-container rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
        <div className="relative bg-white dark:bg-[#1e2327] rounded-b-xl rounded-tr-xl overflow-hidden shadow-2xl border border-[#c2c6d4]/20">
          <div className="grid grid-cols-2">
            {/* From */}
            <div className="p-3 sm:p-6 md:p-8 border-r border-[#c2c6d4]/10">
              <label className="block font-label text-[0.55rem] sm:text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant dark:text-[#c2c6d4] mb-2 sm:mb-4">
                From
              </label>
              <div className="bg-surface-container-low dark:bg-[#191c1e] rounded-lg p-2 sm:p-5 md:p-6 mb-3 sm:mb-6 border border-transparent focus-within:border-primary transition-colors">
                <input
                  type="number"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent !border-0 !ring-0 !shadow-none !outline-none focus:!border-0 focus:!ring-0 focus:!shadow-none text-xl sm:text-3xl md:text-4xl font-headline font-bold text-on-surface dark:text-white placeholder-on-surface-variant/30"
                />
              </div>
              <div className="h-40 sm:h-52 overflow-y-auto unit-scrollbar space-y-0.5 sm:space-y-1">
                {category.units.map((unit, i) => (
                  <button
                    key={unit.symbol}
                    onClick={() => selectFrom(i)}
                    className={`w-full flex justify-between items-center px-2 sm:px-4 py-1.5 sm:py-3 rounded-full cursor-pointer transition-colors text-left ${
                      i === fromIdx
                        ? "bg-primary dark:bg-primary-container text-white"
                        : "hover:bg-surface-container dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-[0.65rem] sm:text-base font-semibold truncate pr-1 ${i === fromIdx ? "" : "text-on-surface dark:text-[#c2c6d4]"}`}>
                      {unit.label}
                    </span>
                    <span className={`text-[0.6rem] sm:text-xs shrink-0 ${i === fromIdx ? "opacity-80" : "text-on-surface-variant"}`}>
                      {unit.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* To */}
            <div className="p-3 sm:p-6 md:p-8">
              <label className="block font-label text-[0.55rem] sm:text-[0.75rem] uppercase tracking-[0.05em] font-semibold text-on-surface-variant dark:text-[#c2c6d4] mb-2 sm:mb-4">
                To
              </label>
              <div className="bg-surface-container-low dark:bg-[#191c1e] rounded-lg p-2 sm:p-5 md:p-6 mb-3 sm:mb-6">
                <input
                  type="text"
                  value={resultStr}
                  readOnly
                  className="w-full bg-transparent border-none focus:ring-0 text-xl sm:text-3xl md:text-4xl font-headline font-bold text-primary dark:text-[#a9c7ff] outline-none cursor-default"
                />
              </div>
              <div className="h-40 sm:h-52 overflow-y-auto unit-scrollbar space-y-0.5 sm:space-y-1">
                {category.units.map((unit, i) => (
                  <button
                    key={unit.symbol}
                    onClick={() => selectTo(i)}
                    className={`w-full flex justify-between items-center px-2 sm:px-4 py-1.5 sm:py-3 rounded-full cursor-pointer transition-colors text-left ${
                      i === toIdx
                        ? "bg-primary dark:bg-primary-container text-white"
                        : "hover:bg-surface-container dark:hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-[0.65rem] sm:text-base font-semibold truncate pr-1 ${i === toIdx ? "" : "text-on-surface dark:text-[#c2c6d4]"}`}>
                      {unit.label}
                    </span>
                    <span className={`text-[0.6rem] sm:text-xs shrink-0 ${i === toIdx ? "opacity-80" : "text-on-surface-variant"}`}>
                      {unit.symbol}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Bar */}
          <div className="bg-primary dark:bg-primary-container p-3 sm:p-6 flex flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="inline-flex items-center bg-white/10 px-3 sm:px-8 py-1.5 sm:py-3 rounded-full backdrop-blur-md min-w-0">
              <span className="font-headline text-xs sm:text-lg md:text-2xl font-bold text-white tracking-tight truncate">
                {isNaN(numericInput)
                  ? "Enter a value"
                  : `${inputValue} ${fromUnit.symbol} = ${resultStr} ${toUnit.symbol}`}
              </span>
            </div>
            <button
              onClick={swapUnits}
              title="Swap units"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full font-bold text-[0.65rem] sm:text-sm transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm sm:text-base">swap_horiz</span>
              <span className="hidden sm:inline">Swap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
