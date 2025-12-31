import React from "react";
import { Sparkles, Wand2, Image as ImageIcon, CheckCircle2 } from "lucide-react";

function Step({ icon: Icon, title, active, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "h-9 w-9 rounded-2xl border flex items-center justify-center",
          done
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : active
            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
            : "bg-slate-50 border-slate-200 text-slate-400",
        ].join(" ")}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
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

export default function GeneratingModal({ open, progress = 0, phase = "extract", aiEnhanced = false }) {
  if (!open) return null;

  const steps = [
    { key: "extract", title: "Extracting colors", icon: ImageIcon },
    { key: "curate", title: aiEnhanced ? "AI curating palette" : "Selecting best colors", icon: Wand2 },
    { key: "finish", title: "Finishing touches", icon: Sparkles },
  ];

  const stepIndex = steps.findIndex((s) => s.key === phase);
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />

      {/* modal */}
      <div className="relative w-[92vw] max-w-xl rounded-[28px] border border-white/30 bg-white/80 shadow-soft backdrop-blur p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-slate-900 font-bold text-lg">Generating your palette</div>
            <div className="text-slate-500 text-sm">
              {aiEnhanced ? "AI Enhanced is on — curating a cleaner, designer palette." : "Fast mode — extracting colors locally."}
            </div>
          </div>

          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-amber-300" />
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

        {/* sponsored slot (styled like a normal card) */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-500">Sponsored</div>
            <div className="text-xs text-slate-400">Ad</div>
          </div>

          {/* Replace this div with your ad component/script later */}
          <div className="mt-3 h-20 rounded-xl border border-dashed border-slate-200 bg-slate-50 grid place-items-center text-slate-400 text-sm">
            Your ad goes here
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Ads keep maplebar.io free.
          </div>
        </div>
      </div>
    </div>
  );
}
