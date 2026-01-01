// src/pages/PaletteTool.jsx
import React, { useMemo, useRef, useState } from "react";
import Dropzone from "../components/Dropzone";
import Palette from "../components/Palette";
import GeneratingModal from "../components/GeneratingModal";
import GradientSlider from "../components/GradientSlider";
import { extractPaletteFromFile } from "../lib/palette";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import chroma from "chroma-js";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function hexesFromPalette(p) {
  return (p || []).map((x) => x.hex).filter(Boolean);
}

function toSwatchesFromHexes(hexes) {
  return hexes.map((hex) => ({
    hex: hex.toUpperCase(),
    rgb: chroma(hex)
      .rgb()
      .map((n) => Math.round(n)),
  }));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function PaletteTool() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [count, setCount] = useState(6);

  const [palette, setPalette] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState("extract"); // extract | curate | finish
  const [progress, setProgress] = useState(0);

  const runIdRef = useRef(0);

  const subtitle = useMemo(
    () => "Upload an image → get a clean palette with Hex + RGB.",
    []
  );

  function startModal() {
    setModalOpen(true);
    setPhase("extract");
    setProgress(0.08);
  }

  function endModal() {
    setProgress(1);
    setTimeout(() => setModalOpen(false), 220);
  }

    async function enhancePalette(candidateHexes, desiredCount) {
    const payload = {
        colors: candidateHexes,
        count: desiredCount,
        style: "canva",
    };

    const res = await fetch(`${API_BASE}/api/palette/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Enhancement failed");
    }

    const data = await res.json();
    const hexes = (data.palette || []).map((p) => p.hex);
    return { hexes, roles: data.palette || [] };
    }

  async function generateAll(f, desiredCount, myRunId) {
    setErr("");
    setPalette(null);

    setPhase("extract");
    setProgress(0.12);
    await sleep(120);

    const candidateCount = Math.max(10, Math.min(24, desiredCount * 3));
    const candidates = await extractPaletteFromFile(f, candidateCount);

    if (runIdRef.current !== myRunId) return null;

    setProgress(0.52);

    const candidateHexes = hexesFromPalette(candidates);

    setPhase("curate");
    setProgress(0.62);

    try {
      const { hexes } = await enhancePalette(candidateHexes, desiredCount);
      if (runIdRef.current !== myRunId) return null;

      setPhase("finish");
      setProgress(0.9);
      await sleep(140);

      return toSwatchesFromHexes(hexes);
    } catch (e) {
      setErr(
        (e?.message || "Enhancement failed") +
          " — showing the standard palette instead."
      );

      if (runIdRef.current !== myRunId) return null;

      setPhase("finish");
      setProgress(0.9);
      await sleep(120);

      return candidates.slice(0, desiredCount);
    }
  }

  async function handleFile(f) {
    const myRunId = ++runIdRef.current;

    setFile(f);
    setErr("");

    const url = URL.createObjectURL(f);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });

    try {
      setBusy(true);
      startModal();

      const p = await generateAll(f, count, myRunId);
      if (!p) return;

      setPalette(p);
    } catch (e) {
      setErr(e?.message || "Something went wrong generating the palette.");
    } finally {
      setBusy(false);
      endModal();
    }
  }

  async function regenerate() {
    if (!file) return;
    const myRunId = ++runIdRef.current;

    try {
      setBusy(true);
      setErr("");
      setPalette(null);
      startModal();

      const p = await generateAll(file, count, myRunId);
      if (!p) return;

      setPalette(p);
    } catch (e) {
      setErr(e?.message || "Something went wrong generating the palette.");
    } finally {
      setBusy(false);
      endModal();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 pb-12 sm:pb-16">
      {/* remove AI labeling in modal */}
      <GeneratingModal open={modalOpen} progress={progress} phase={phase} />

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-5 min-w-0 space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
              <Sparkles className="h-5 w-5" />
              Color Palette Generator
            </div>
            <div className="text-slate-500 text-sm mt-1">{subtitle}</div>

            <div className="mt-4 sm:mt-5">
              <Dropzone onFile={handleFile} disabled={busy} />
            </div>

            <div className="mt-4 sm:mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-600 font-medium">Colors</div>
                <div className="text-sm font-semibold text-slate-900 tabular-nums">
                  {count}
                </div>
              </div>

              <GradientSlider
                value={count}
                min={3}
                max={12}
                onChange={setCount}
                disabled={busy}
              />
            </div>

            <div className="mt-4 sm:mt-5">
              <div
                className={[
                  "rounded-2xl sm:rounded-3xl p-[1.5px]",
                  "bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200",
                  !file || busy ? "opacity-60" : "hover:opacity-95",
                  "transition",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={!file || busy}
                  className={[
                    "w-full rounded-2xl sm:rounded-3xl bg-white p-4 border border-slate-200",
                    "shadow-soft text-left",
                    "transition hover:-translate-y-0.5 hover:shadow-lg",
                    !file || busy ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
                      {busy ? (
                        <Loader2 className="h-5 w-5 text-slate-700 animate-spin" />
                      ) : (
                        <RotateCcw className="h-5 w-5 text-slate-700" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 font-semibold">
                        Regenerate palette
                      </div>
                      <div className="text-slate-500 text-sm">
                        {file
                          ? "Re-run extraction with the current color count."
                          : "Upload an image first to regenerate."}
                      </div>
                    </div>

                    <div className="hidden sm:block text-xs text-slate-400">
                      {busy ? "Working…" : "Ready"}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {err ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {err}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur">
            <div className="text-slate-900 font-semibold">Preview</div>
            <div className="text-slate-500 text-sm">
              Your uploaded image (local only).
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="aspect-[16/10] w-full bg-slate-50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="uploaded preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-slate-400 text-sm">
                    Upload an image to preview it here
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 min-w-0 space-y-4 sm:space-y-6">
          {palette ? (
            <Palette palette={palette} />
          ) : (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur">
              <div className="text-slate-900 font-semibold text-lg">
                Palette results
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Upload an image to generate your palette.
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 px-2">
            v1 note: palette extraction runs in-browser using canvas + clustering.
          </div>
        </div>
      </div>
    </div>
  );
}
