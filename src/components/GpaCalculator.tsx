import { useState, useRef } from "react";
import { z } from "zod";

//  Zod validation schemas

const NUMERIC_REGEX = /^\d*\.?\d*$/;
const isBlockedKey = (key: string) =>
  key.length === 1 && !NUMERIC_REGEX.test(key);

const numericField = (schema: z.ZodNumber) =>
  z
    .string()
    .min(1, "This field is required")
    .regex(NUMERIC_REGEX, "Only positive numbers allowed")
    .transform(parseFloat)
    .pipe(schema);

const creditsSchema = numericField(
  z
    .number()
    .positive("Credits must be greater than 0")
    .max(99, "Credits too large"),
);

const gradeSchema = numericField(
  z
    .number()
    .min(0, "Grade cannot be less than 0")
    .max(100, "Grade cannot exceed 100"),
);

//  Types

interface Course {
  id: string;
  name: string;
  credits: string;
  grade: string;
}

interface RowErrors {
  credits?: string;
  grade?: string;
}

interface GpaResult {
  gpa: number;
  totalCredits: number;
}

//  Utility helpers

//  Sub-components

interface NumberInputProps {
  value: string;
  placeholder: string;
  step: string;
  min: string;
  max?: string;
  error?: string;
  onChange: (v: string) => void;
}

function NumberInput({
  value,
  placeholder,
  step,
  min,
  max,
  error,
  onChange,
}: NumberInputProps) {
  return (
    <div>
      <input
        type="number"
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        value={value}
        onKeyDown={(e) => isBlockedKey(e.key) && e.preventDefault()}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-surface-container-low rounded px-4 py-3 text-sm text-center transition-all focus:outline-none border ${
          error
            ? "border-red-400 ring-2 ring-red-400 bg-red-50 dark:bg-red-950/20"
            : "border-transparent focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest"
        }`}
      />
      {error && (
        <p className="text-red-500 text-[0.65rem] mt-1 text-center">{error}</p>
      )}
    </div>
  );
}

//  Main component

export default function GpaCalculator() {
  const courseId = useRef(0);
  const newCourse = (): Course => ({
    id: String(++courseId.current),
    name: "",
    credits: "",
    grade: "",
  });

  const [courses, setCourses] = useState<Course[]>(() => [
    newCourse(),
    newCourse(),
  ]);
  const [showNames, setShowNames] = useState(false);
  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [result, setResult] = useState<GpaResult | null>(null);
  const toggleId = "show-names-toggle";

  //  State updaters

  function updateField(id: string, field: keyof Course, value: string) {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
    // Clear the error for this field as the user types
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const updated = { ...prev[id] };
      delete updated[field as "credits" | "grade"];
      if (!updated.credits && !updated.grade) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: updated };
    });
  }

  function addCourse() {
    const course = newCourse();
    setCourses((prev) => [...prev, course]);
  }

  function removeCourse(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setErrors((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  function reset() {
    setCourses([newCourse(), newCourse()]);
    setErrors({});
    setResult(null);
  }

  //  Validation + calculation

  function calculate() {
    const newErrors: Record<string, RowErrors> = {};
    let hasErrors = false;
    let totalPoints = 0;
    let totalCredits = 0;

    for (const course of courses) {
      const creditsResult = creditsSchema.safeParse(course.credits);
      const gradeResult = gradeSchema.safeParse(course.grade);

      if (!creditsResult.success || !gradeResult.success) {
        newErrors[course.id] = {};
        if (!creditsResult.success)
          newErrors[course.id].credits = creditsResult.error.issues[0].message;
        if (!gradeResult.success)
          newErrors[course.id].grade = gradeResult.error.issues[0].message;
        hasErrors = true;
      } else {
        totalPoints += creditsResult.data * gradeResult.data;
        totalCredits += creditsResult.data;
      }
    }

    setErrors(newErrors);

    if (hasErrors) {
      setResult(null);
      return;
    }

    setResult({
      gpa: totalCredits > 0 ? totalPoints / totalCredits : 0,
      totalCredits,
    });
  }

  //  Column span helpers

  const nameSpan = "col-span-7";
  const creditsSpan = showNames ? "col-span-2" : "col-span-5";
  const gradeSpan = showNames ? "col-span-2" : "col-span-5";
  const deleteSpan = showNames ? "col-span-1" : "col-span-2";

  //  Render

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-10 shadow-[0_12px_40px_-10px_rgba(25,28,30,0.08)]">
      {/* ── Toggle show course names ── */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <input
            id={toggleId}
            type="checkbox"
            className="sr-only peer"
            checked={showNames}
            onChange={(e) => setShowNames(e.target.checked)}
          />
          <label
            htmlFor={toggleId}
            className="relative inline-block w-[38px] h-[20px] rounded-full cursor-pointer
              bg-[#c2c6d4] peer-checked:bg-[#00478d] transition-colors duration-200
              after:content-[''] after:absolute after:top-[3px] after:left-[3px]
              after:w-[14px] after:h-[14px] after:bg-white after:rounded-full
              after:shadow after:transition-transform after:duration-200
              peer-checked:after:translate-x-[18px]"
          />
          <label
            htmlFor={toggleId}
            className="text-sm font-semibold text-on-surface-variant cursor-pointer"
          >
            Show Course Names
          </label>
        </div>
      </div>

      {/* ── Column headers ── */}
      <div className="grid grid-cols-12 gap-4 mb-4 px-2">
        {showNames && (
          <div className={nameSpan}>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
              Course Name
            </span>
          </div>
        )}
        <div className={creditsSpan}>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant text-center block">
            Credits
          </span>
        </div>
        <div className={gradeSpan}>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant text-center block">
            Grade
          </span>
        </div>
        <div className={deleteSpan} />
      </div>

      {/* ── Course rows ── */}
      <div className="space-y-3 mb-10">
        {courses.map((course) => {
          const err = errors[course.id] ?? {};
          return (
            <div
              key={course.id}
              className="grid grid-cols-12 gap-4 items-start"
            >
              {showNames && (
                <div className={nameSpan}>
                  <input
                    type="text"
                    placeholder="e.g. Structural Mechanics"
                    value={course.name}
                    onChange={(e) =>
                      updateField(course.id, "name", e.target.value)
                    }
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-lowest transition-all"
                  />
                </div>
              )}

              <div className={creditsSpan}>
                <NumberInput
                  value={course.credits}
                  placeholder="course credit ..."
                  step="0.5"
                  min="0.5"
                  error={err.credits}
                  onChange={(v) => updateField(course.id, "credits", v)}
                />
              </div>

              <div className={gradeSpan}>
                <NumberInput
                  value={course.grade}
                  placeholder="your grade ..."
                  step="0.1"
                  min="0"
                  max="4.0"
                  error={err.grade}
                  onChange={(v) => updateField(course.id, "grade", v)}
                />
              </div>

              <div className={`${deleteSpan} flex justify-center pt-2`}>
                <button
                  onClick={() => removeCourse(course.id)}
                  aria-label="Remove course"
                  className="text-outline hover:text-error transition-colors p-2"
                >
                  <span className="material-symbols-outlined text-xl">
                    delete
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-outline-variant/15">
        <div className="flex gap-4">
          <button
            onClick={addCourse}
            className="flex cursor-pointer items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded text-xs font-bold uppercase tracking-widest hover:bg-primary-fixed dark:hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Course
          </button>
          <button
            onClick={reset}
            className="flex items-center cursor-pointer gap-2 px-6 py-3 bg-surface-container-low text-on-surface-variant rounded text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              restart_alt
            </span>
            Reset
          </button>
        </div>
        <button
          onClick={calculate}
          className="bg-gradient-to-br from-primary cursor-pointer to-primary-container text-on-primary px-10 py-4 rounded font-headline font-extrabold tracking-tight hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          Calculate GPA
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="mt-12 bg-surface-container rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-6 flex flex-col justify-center border-r border-outline-variant/20">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                Total Accumulated Credits
              </span>
              <div className="text-3xl font-headline font-bold text-on-surface">
                {result.totalCredits.toFixed(1)}
              </div>
            </div>
            <div className="p-6 bg-surface-container-highest flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2 text-center">
                Calculated GPA
              </span>
              <div className="text-5xl font-headline font-black text-primary tracking-tighter">
                {result.gpa.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
