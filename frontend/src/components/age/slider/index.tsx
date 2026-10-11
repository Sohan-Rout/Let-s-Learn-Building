"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";

/** Life stages shown above the slider. `from` is the first age in each stage. */
const STAGES = [
  { from: 0, src: "/assets/women/teenage.avif", alt: "Teenage girl in an orange sweater with a shoulder bag" },
  { from: 25, src: "/assets/women/middle.avif", alt: "Woman with short hair and a yellow scarf" },
  { from: 60, src: "/assets/women/elderly.avif", alt: "Elderly woman wearing glasses and a crown of roses" },
] as const;

const stageFor = (age: number) => STAGES.findLast((s) => age >= s.from) ?? STAGES[0];

type AgeSliderProps = {
  /** Controlled value. Omit to let the component manage its own state. */
  value?: number;
  defaultValue?: number;
  onChange?: (age: number) => void;
  min?: number;
  max?: number;
  /** Form field name, so the age is submitted with a surrounding <form>. */
  name?: string;
};

export default function AgeSlider({
  value,
  defaultValue = 25,
  onChange,
  min = 13,
  max = 100,
  name = "age",
}: AgeSliderProps) {
  const [internal, setInternal] = useState(defaultValue);
  const age = value ?? internal;
  // What's in the text box while the user is mid-typing (e.g. "4" on the way to "45").
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (n: number) => {
    const next = Number.isNaN(n) ? age : Math.min(max, Math.max(min, Math.round(n)));
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const fill = `${((age - min) / (max - min)) * 100}%`;
  const stage = stageFor(age);

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-10">
      <figure className="relative size-56 overflow-hidden rounded-full border-2 border-b-6 border-black bg-white">
        {/* All images stay mounted so switching stages crossfades with no loading flash. */}
        {STAGES.map((s) => (
          <Image
            key={s.src}
            src={s.src}
            alt={s === stage ? s.alt : ""}
            aria-hidden={s !== stage}
            fill
            sizes="224px"
            priority
            className={`object-cover transition-all duration-500 ${
              s === stage ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          />
        ))}
      </figure>

      <label className="flex items-baseline gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? age}
          onChange={(e) => {
            const raw = e.target.value;
            setDraft(raw);
            const n = Number(raw);
            if (raw !== "" && n >= min && n <= max) commit(n);
          }}
          onBlur={() => {
            if (draft === null) return;
            commit(draft === "" ? age : Number(draft));
            setDraft(null);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const input = e.currentTarget;
            // Commit (and clamp) the typed value before any surrounding form submits it.
            flushSync(() => input.blur());
            input.form?.requestSubmit();
          }}
          aria-label="Age in years"
          className="w-32 rounded-xl border-2 border-b-6 border-black bg-purple-300 py-2 text-center font-syne text-4xl font-semibold outline-none transition-colors focus:bg-purple-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-3xl font-semibold">years</span>
      </label>

      <div className="w-full">
        <input
          type="range"
          name={name}
          min={min}
          max={max}
          step={1}
          value={age}
          onChange={(e) => {
            setDraft(null);
            commit(Number(e.target.value));
          }}
          aria-label="Age"
          aria-valuetext={`${age} years`}
          style={{ "--fill": fill } as CSSProperties}
          className="h-4 w-full cursor-pointer appearance-none rounded-full border-2 border-black bg-[linear-gradient(to_right,var(--color-amber-300)_var(--fill),white_var(--fill))] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black [&::-moz-range-thumb]:size-9 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_4px_0_black] active:[&::-moz-range-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:size-9 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_4px_0_black] active:[&::-webkit-slider-thumb]:cursor-grabbing"
        />
        <div className="mt-3 flex justify-between text-xl font-semibold" aria-hidden>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
