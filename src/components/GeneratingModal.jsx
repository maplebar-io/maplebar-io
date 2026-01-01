// src/components/GeneratingModal.jsx
import React, { useEffect, useState } from "react";
import { Sparkles, Wand2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import AdSenseUnit from "./AdSenseUnit";

function CuteSpinner() {
  return (
    <div className="relative h-10 w-10">
      {/* Outer orbit (6 dots) */}
      <div className="absolute inset-0 animate-[mbSpin_1.15s_linear_infinite]">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full shadow-sm"
            style={{
              transform: `rotate(${i * 60}deg) translateY(-14px)`,
              background:
                i % 3 === 0
                  ? "#818CF8" // indigo-400
                  : i % 3 === 1
                  ? "#E879F9" // fuchsia-400
                  : "#FCD34D", // amber-300
              opacity: 0.95,
            }}
          />
        ))}
      </div>

      {/* Inner orbit (4 smaller dots, reverse direction) */}
      <div className="absolute inset-0 animate-[mbSpinReverse_0.9s_linear_infinite]">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{
              transform: `rotate(${i * 90}deg) translateY(-8px)`,
              background:
                i % 2 === 0
                  ? "rgba(129,140,248,0.85)" // indigo-ish
                  : "rgba(232,121,249,0.85)", // fuchsia-ish
              filter: "blur(0px)",
            }}
          />
        ))}
      </div>

      {/* Soft “breathing” glow behind dots */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-200 via-fuchsia-200 to-amber-100 opacity-60 blur-md animate-[mbPulse_1.2s_ease-in-out_infinite]" />

      {/* keyframes */}
      <style>{`
        @keyframes mbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mbSpinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes mbPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.45; }
          50% { transform: scale(1.02); opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}


function Step({ icon: Icon, title, active, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "h-9 w-9 rounded-2xl border flex items-center justify-center transition-colors",
          done
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : active
            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
            : "bg-slate-50 border-slate-200 text-slate-400",
        ].join(" ")}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0">
        <div
          className={[
            "text-sm font-semibold truncate",
            done ? "text-slate-900" : active ? "text-slate-900" : "text-slate-400",
          ].join(" ")}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

export default function GeneratingModal({
  open,
  progress = 0,
  phase = "extract",
  aiEnhanced = false,
  fadeMs = 260,
}) {
  // Keep mounted long enough to play fade-out
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => setMounted(false), fadeMs);
    return () => clearTimeout(t);
  }, [open, fadeMs]);

  if (!mounted) return null;

  const steps = [
    { key: "extract", title: "Extracting colors", icon: ImageIcon },
    {
      key: "curate",
      title: aiEnhanced ? "AI curating palette" : "Selecting best colors",
      icon: Wand2,
    },
    { key: "finish", title: "Finishing touches", icon: Sparkles },
  ];

  const stepIndex = steps.findIndex((s) => s.key === phase);
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div
      className={[
        "fixed inset-0 z-50 grid place-items-center transition-opacity",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      ].join(" ")}
      style={{ transitionDuration: `${fadeMs}ms` }}
      aria-hidden={open ? "false" : "true"}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

      {/* modal */}
      <div
        className={[
          "relative w-[92vw] max-w-xl rounded-[28px] border border-white/30 bg-white/80 shadow-soft backdrop-blur p-6",
          "transition-transform",
          open ? "scale-100 translate-y-0" : "scale-[0.98] translate-y-1",
        ].join(" ")}
        style={{ transitionDuration: `${fadeMs}ms` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-slate-900 font-bold text-lg">
              Generating your palette
            </div>
            <div className="text-slate-500 text-sm">
              {aiEnhanced
                ? "AI Enhanced is on — curating a cleaner, designer palette."
                : "Fast mode — extracting colors locally."}
            </div>
          </div>

          {/* Cute spinner instead of gradient square */}
          <CuteSpinner />
        </div>

        {/* progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{steps[Math.max(0, stepIndex)]?.title || "Working…"}</span>
            <span className="tabular-nums">{pct}%</span>
          </div>

          <div className="mt-2 h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* steps */}
        <div className="mt-5 grid gap-3">
          {steps.map((s, idx) => (
            <Step
              key={s.key}
              icon={s.icon}
              title={s.title}
              active={idx === stepIndex}
              done={idx < stepIndex}
            />
          ))}
        </div>

        {/* sponsored slot */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">Sponsored</div>
            <div className="text-xs text-slate-400">Ad</div>
          </div>

          <div className="mt-3 min-h-[90px]">
            <AdSenseUnit slot="3296020168" />
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Ads keep maplebar.io free.
          </div>
        </div>
      </div>
    </div>
  );
}
