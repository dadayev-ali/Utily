import { useState, useCallback, useRef, useEffect } from "react";

interface Stop {
  id: number;
  color: string;
  position: number;
}

type GradientType = "linear" | "radial";

const PRESETS: { label: string; stops: Omit<Stop, "id">[] }[] = [
  { label: "Ocean",   stops: [{ color: "#2a7b9b", position: 0 }, { color: "#44ddc1", position: 100 }] },
  { label: "Sunset",  stops: [{ color: "#f97316", position: 0 }, { color: "#ec4899", position: 100 }] },
  { label: "Forest",  stops: [{ color: "#22c55e", position: 0 }, { color: "#15803d", position: 100 }] },
  { label: "Purple",  stops: [{ color: "#6366f1", position: 0 }, { color: "#a855f7", position: 100 }] },
  { label: "Gold",    stops: [{ color: "#f59e0b", position: 0 }, { color: "#fbbf24", position: 50 }, { color: "#fde68a", position: 100 }] },
  { label: "Rose",    stops: [{ color: "#f43f5e", position: 0 }, { color: "#fb7185", position: 100 }] },
];

let nextId = 1;
function makeStop(color: string, position: number): Stop {
  return { id: nextId++, color, position };
}

function buildGradientCSS(type: GradientType, angle: number, stops: Stop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const stopStr = sorted.map(s => `${s.color} ${s.position}%`).join(", ");
  if (type === "linear") return `linear-gradient(${angle}deg, ${stopStr})`;
  return `radial-gradient(circle, ${stopStr})`;
}

function buildFullCSS(type: GradientType, angle: number, stops: Stop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const gradient = buildGradientCSS(type, angle, stops);
  const fallback = sorted[0]?.color ?? "#000";
  return `background: ${fallback};\nbackground: ${gradient};`;
}

export default function CssGradientGenerator() {
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<Stop[]>([
    makeStop("#005db6", 0),
    makeStop("#44ddc1", 100),
  ]);
  const [activeStopId, setActiveStopId] = useState<number>(stops[0].id);
  const [copied, setCopied] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<number | null>(null);
  // Live copy of stops used during drag — no React re-renders
  const stopsRef = useRef<Stop[]>(stops);
  stopsRef.current = stops;

  const gradient = buildGradientCSS(type, angle, stops);
  const fullCSS = buildFullCSS(type, angle, stops);
  const activeStop = stops.find(s => s.id === activeStopId) ?? stops[0];

  const updateStop = (id: number, patch: Partial<Omit<Stop, "id">>) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addStop = () => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const midPos = sorted.length >= 2
      ? Math.round((sorted[0].position + sorted[sorted.length - 1].position) / 2)
      : 50;
    const ns = makeStop("#ffffff", midPos);
    setStops(prev => [...prev, ns]);
    setActiveStopId(ns.id);
  };

  const removeStop = (id: number) => {
    if (stops.length <= 2) return;
    const remaining = stops.filter(s => s.id !== id);
    setStops(remaining);
    if (activeStopId === id) setActiveStopId(remaining[0].id);
  };

  // Drag — update DOM directly, commit to state only on mouseup
  const onBarMouseDown = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    draggingId.current = id;
    setActiveStopId(id);
  };

  const onWindowMouseMove = useCallback((e: MouseEvent) => {
    const id = draggingId.current;
    if (id === null || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const posRounded = Math.round(pos);

    // Move the handle directly in the DOM
    const handle = document.getElementById(`stop-handle-${id}`);
    if (handle) handle.style.left = `${pos}%`;

    // Update gradient bar + preview directly
    const liveStops = stopsRef.current.map(s => s.id === id ? { ...s, position: posRounded } : s);
    const liveGradient = buildGradientCSS(
      (barRef.current.dataset.gradtype ?? "linear") as GradientType,
      Number(barRef.current.dataset.gradangle ?? 90),
      liveStops,
    );
    if (barRef.current) barRef.current.style.background = liveGradient;
    if (previewRef.current) previewRef.current.style.background = liveGradient;
  }, []);

  const onWindowMouseUp = useCallback(() => {
    const id = draggingId.current;
    if (id === null || !barRef.current) return;
    draggingId.current = null;
    // Read position from DOM handle and commit to React state
    const handle = document.getElementById(`stop-handle-${id}`);
    if (handle) {
      const pos = Math.round(parseFloat(handle.style.left));
      setStops(prev => prev.map(s => s.id === id ? { ...s, position: pos } : s));
    }
  }, []);

  // Keep data attrs in sync so mousemove reads correct type/angle
  useEffect(() => {
    if (barRef.current) {
      barRef.current.dataset.gradtype = type;
      barRef.current.dataset.gradangle = String(angle);
    }
  }, [type, angle]);

  useEffect(() => {
    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [onWindowMouseMove, onWindowMouseUp]);

  const onBarMouseUp = () => { draggingId.current = null; };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    const newStops = preset.stops.map(s => makeStop(s.color, s.position));
    setStops(newStops);
    setActiveStopId(newStops[0].id);
  };

  const CHIP = "flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-full font-bold uppercase tracking-tighter hover:opacity-80 cursor-pointer transition-opacity";

  return (
    <div className="space-y-5">

      {/* ── Live Preview ── */}
      <div
        ref={previewRef}
        className="w-full h-40 rounded-xl border border-outline-variant/30"
        style={{ background: gradient }}
      />

      {/* ── Controls ── */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">

        {/* Gradient bar + type/angle */}
        <div className="p-5 border-b border-outline-variant/20 space-y-4">

          {/* Draggable bar */}
          <div
            ref={barRef}
            data-gradtype={type}
            data-gradangle={angle}
            className="relative h-8 w-full rounded-full border border-outline-variant/30 cursor-crosshair select-none"
            style={{ background: gradient }}
          >
            {stops.map(stop => (
              <div
                key={stop.id}
                id={`stop-handle-${stop.id}`}
                onMouseDown={e => onBarMouseDown(stop.id, e)}
                onClick={() => setActiveStopId(stop.id)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-4 shadow-lg cursor-grab active:cursor-grabbing ${
                  activeStopId === stop.id ? "border-primary scale-110" : "border-white"
                }`}
                style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
              />
            ))}
          </div>

          {/* Type + Angle + Presets */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Type toggle */}
            <div className="flex rounded-lg border border-outline-variant/30 overflow-hidden shrink-0">
              {(["linear", "radial"] as GradientType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    type === t ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Angle (linear only) */}
            {type === "linear" && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Angle</span>
                <input
                  type="number"
                  min={0} max={360}
                  value={angle}
                  onChange={e => setAngle(Number(e.target.value))}
                  className="w-16 bg-surface-container-high border border-outline-variant/20 rounded-lg px-2 py-1 text-xs font-mono text-on-surface text-center outline-none"
                  style={{ boxShadow: "none" }}
                />
                <span className="text-xs text-on-surface-variant">°</span>
              </div>
            )}

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => loadPreset(p)}
                  title={p.label}
                  className="w-6 h-6 rounded-full border-2 border-outline-variant/30 hover:scale-110 transition-transform cursor-pointer shrink-0"
                  style={{ background: `linear-gradient(135deg, ${p.stops[0].color}, ${p.stops[p.stops.length - 1].color})` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stops list + color editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20">

          {/* Active stop color editor */}
          <div className="lg:col-span-5 p-5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Stop Color</span>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl border-2 border-outline-variant/30 shrink-0 cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: activeStop?.color }}
              >
                <input
                  type="color"
                  value={activeStop?.color ?? "#000000"}
                  onChange={e => updateStop(activeStop.id, { color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant font-mono text-sm">#</span>
                  <input
                    type="text"
                    value={(activeStop?.color ?? "#000000").replace("#", "").toUpperCase()}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                      if (v.length === 6) updateStop(activeStop.id, { color: `#${v}` });
                    }}
                    className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 font-mono text-sm text-on-surface outline-none"
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-12 shrink-0">Position</span>
                  <input
                    type="range"
                    min={0} max={100}
                    value={activeStop?.position ?? 0}
                    onChange={e => updateStop(activeStop.id, { position: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="font-mono text-xs text-on-surface w-8 text-right">{activeStop?.position}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stops list */}
          <div className="lg:col-span-7 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Color Stops</span>
              <button onClick={addStop} className={`${CHIP} bg-primary/10 text-primary`}>
                <span className="material-symbols-outlined text-sm">add</span>Add Stop
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...stops].sort((a, b) => a.position - b.position).map(stop => (
                <div
                  key={stop.id}
                  onClick={() => setActiveStopId(stop.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    activeStopId === stop.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-outline-variant/20 bg-surface-container-high hover:border-outline-variant/40"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border border-outline-variant/20 shrink-0 relative overflow-hidden cursor-pointer"
                    style={{ backgroundColor: stop.color }}
                  >
                    <input
                      type="color"
                      value={stop.color}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { updateStop(stop.id, { color: e.target.value }); setActiveStopId(stop.id); }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <span className="font-mono text-xs text-on-surface flex-1">{stop.color.toUpperCase()}</span>
                  <span className="font-mono text-xs text-on-surface-variant w-10 text-right">{stop.position}%</span>
                  <button
                    onClick={e => { e.stopPropagation(); removeStop(stop.id); }}
                    className="text-on-surface-variant/40 hover:text-error transition-colors cursor-pointer"
                    disabled={stops.length <= 2}
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CSS Output ── */}
      <div className="bg-surface-container border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface">CSS Output</span>
          <button onClick={handleCopy} className={`${CHIP} bg-secondary-container text-on-secondary-container`}>
            <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="p-5 font-mono text-sm leading-6 text-on-surface overflow-x-auto whitespace-pre-wrap break-all">
          <span className="text-sky-400">background</span>
          <span className="text-on-surface">: </span>
          <span className="text-emerald-400">{stops.sort((a,b)=>a.position-b.position)[0]?.color}</span>
          <span className="text-on-surface">;</span>{"\n"}
          <span className="text-sky-400">background</span>
          <span className="text-on-surface">: </span>
          <span className="text-emerald-400">{gradient}</span>
          <span className="text-on-surface">;</span>
        </pre>
      </div>
    </div>
  );
}
