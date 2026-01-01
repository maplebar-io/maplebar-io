import React, { useMemo, useState } from "react";
import { Copy, Check, Palette as PaletteIcon } from "lucide-react";

function fmtRgb(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export default function Palette({ palette }) {
  const swatches = useMemo(() => (Array.isArray(palette) ? palette : []), [palette]);
  const [copiedKey, setCopiedKey] = useState("");

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 900);
    } catch {
      // ignore
    }
  }

  async function copyAllHex() {
    const text = swatches.map((s) => s.hex).join(", ");
    await copy(text, "all");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <PaletteIcon className="h-5 w-5" />
            Your Palette
          </div>
          <div className="text-slate-500 text-sm">
            Hex + RGB — copy what you need.
          </div>
        </div>

        <button
          className="text-sm px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition"
          onClick={copyAllHex}
          disabled={!swatches.length}
        >
          {copiedKey === "all" ? "Copied!" : "Copy all hex"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
      {swatches.map((s, idx) => {
        const rgbText = fmtRgb(s.rgb);
        const hexKey = `hex-${idx}`;
        const rgbKey = `rgb-${idx}`;

        return (
          <button
            key={idx}
            type="button"
            className={[
              "w-full text-left rounded-2xl border border-slate-200 bg-white",
              "hover:shadow-md transition shadow-sm overflow-hidden",
              "flex items-stretch gap-0",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              // animation base
              "opacity-0 translate-y-2",
              "animate-[mbFadeIn_420ms_ease-out_forwards]",
            ].join(" ")}
            style={{ animationDelay: `${idx * 80}ms` }}
            onClick={() => copy(s.hex, hexKey)}
            title="Click row to copy HEX"
          >
            <div className="w-20 sm:w-24 shrink-0" style={{ background: s.hex }} />

            <div className="flex-1 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-slate-900 font-extrabold tracking-wide text-sm">
                  {s.hex}
                </div>
                <div className="mt-1 text-slate-500 font-semibold text-xs">
                  {rgbText}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(s.hex, hexKey);
                  }}
                  aria-label={`Copy hex ${s.hex}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {copiedKey === hexKey ? (
                      <>
                        <Check className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> HEX
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(rgbText, rgbKey);
                  }}
                  aria-label={`Copy rgb ${rgbText}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {copiedKey === rgbKey ? (
                      <>
                        <Check className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> RGB
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </button>
        );
      })}
    </div>

      <style>{`
        @keyframes mbFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mt-4 text-xs text-slate-400">
        Tip: Click a row to quickly copy the HEX. Use buttons for exact values.
      </div>
    </div>
  );
}
