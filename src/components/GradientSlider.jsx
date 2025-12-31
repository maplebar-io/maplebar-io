import React, { useMemo } from "react";

export default function GradientSlider({
  value,
  min = 3,
  max = 12,
  step = 1,
  onChange,
  disabled,
}) {
  const pct = useMemo(() => {
    const span = max - min;
    if (span <= 0) return 0;
    const p = ((value - min) / span) * 100;
    return Math.max(0, Math.min(100, p));
  }, [value, min, max]);

  return (
    <div className={["w-full", disabled ? "opacity-60" : ""].join(" ")}>
      {/* Track container */}
      <div className="relative w-full h-9 flex items-center">
        {/* Base track */}
        <div className="absolute left-0 right-0 h-3 rounded-full bg-slate-200" />

        {/* Gradient fill (only up to pct) */}
        <div
          className="absolute left-0 h-3 rounded-full bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200"
          style={{ width: `${pct}%` }}
        />

        {/* Range input sits on top, but track is transparent */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={[
            "absolute left-0 right-0 w-full h-9",
            "appearance-none bg-transparent",
            "cursor-pointer focus:outline-none",
          ].join(" ")}
          aria-label="Colors"
        />

        {/* Thumb styles */}
        <style>{`
          /* Chrome/Edge/Safari */
          input[type="range"]::-webkit-slider-runnable-track {
            height: 12px;
            background: transparent;
            border: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 9999px;
            background: #ffffff;
            border: 1px solid rgb(203 213 225);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
            margin-top: -3px; /* centers thumb on 12px track */
          }

          /* Firefox */
          input[type="range"]::-moz-range-track {
            height: 12px;
            background: transparent;
            border: none;
          }
          input[type="range"]::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 9999px;
            background: #ffffff;
            border: 1px solid rgb(203 213 225);
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
          }

          /* Prevent ugly focus outline in some browsers */
          input[type="range"]::-moz-focus-outer {
            border: 0;
          }
        `}</style>
      </div>
    </div>
  );
}
