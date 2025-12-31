import React, { useCallback, useRef } from "react";
import { ImageUp } from "lucide-react";

export default function Dropzone({ onFile, disabled }) {
  const inputRef = useRef(null);

  const pick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const onChange = useCallback(
    (e) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
      e.target.value = "";
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile, disabled]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    // Gradient border wrapper
    <div
      className={[
        "rounded-3xl p-[1.5px]",
        "bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200",
        disabled ? "opacity-60" : "hover:opacity-95",
        "transition"
      ].join(" ")}
    >
      {/* Actual clickable card */}
      <div
        onClick={pick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={[
          "group cursor-pointer select-none rounded-3xl bg-white p-6 shadow-soft",
          "border border-white/50",
          "transition hover:-translate-y-0.5 hover:shadow-lg",
          "focus-within:ring-2 focus-within:ring-slate-900/10",
          disabled ? "cursor-not-allowed" : ""
        ].join(" ")}
        role="button"
        tabIndex={0}
        aria-disabled={disabled ? "true" : "false"}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
          disabled={disabled}
        />

        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
            <ImageUp className="h-6 w-6 text-slate-700" />
          </div>

            <div className="flex-1 min-w-0">
            <div className="text-slate-900 font-semibold">Upload an image</div>
            <div className="text-slate-500 text-sm">
              Drag & drop or click to choose a file (PNG, JPG, WEBP)
            </div>
          </div>

          <div className="hidden sm:block text-xs text-slate-400">maplebar.io</div>
        </div>

        {/* Optional: tiny accent line (NOT progress). Remove if you want it super clean. */}
        <div className="mt-4 h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-amber-100 opacity-60" />
        </div>
      </div>
    </div>
  );
}
