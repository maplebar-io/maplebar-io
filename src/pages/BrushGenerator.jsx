// src/pages/BrushGenerator.jsx
import React, { useMemo, useRef, useState } from "react";
import GeneratingModal from "../components/GeneratingModal";
import { Sparkles, Download, Package, Wand2 } from "lucide-react";
import JSZip from "jszip";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}

const VIBES = [
  { value: "cute", label: "Cute" },
  { value: "clean", label: "Clean" },
  { value: "grunge", label: "Grunge" },
  { value: "handdrawn", label: "Handdrawn" },
];

const PROMPT_SUGGESTIONS = [
  "sparkle stars, twinkles, kawaii vibe",
  "tiny hearts and doodle swirls",
  "ink splatter droplets, organic random",
  "soft cloud puffs, airy shapes",
  "leaf clusters, botanical stamp",
  "halftone stipple dots, retro texture",
];

export default function BrushGenerator() {
  const [prompt, setPrompt] = useState("sparkle stars, twinkles, kawaii vibe");
  const [vibe, setVibe] = useState("cute");

  const [count, setCount] = useState(6);
  const [size, setSize] = useState(1024);
  const [softness, setSoftness] = useState(0.6);
  const [density, setDensity] = useState(0.7);

  const [images, setImages] = useState([]); // { name, pngBase64 }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState("extract");
  const [progress, setProgress] = useState(0);

  const runIdRef = useRef(0);

  const subtitle = useMemo(
    () =>
      "Type what you want → get transparent PNG stamp images you can import into Photoshop.",
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

  async function generate() {
    const myRunId = ++runIdRef.current;

    setErr("");
    setImages([]);

    try {
      setBusy(true);
      startModal();

      setPhase("extract");
      setProgress(0.18);
      await sleep(120);

      setPhase("curate");
      setProgress(0.45);

      const res = await fetch("/api/brushes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          vibe,
          count,
          size,
          softness,
          density,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Failed to generate stamps"
        );
      }

      if (runIdRef.current !== myRunId) return;

      setPhase("finish");
      setProgress(0.9);
      await sleep(160);

      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (e) {
      setErr(e?.message || "Something went wrong generating stamps.");
    } finally {
      setBusy(false);
      endModal();
    }
  }

  async function downloadZip() {
    if (!images?.length) return;

    const zip = new JSZip();
    images.forEach((img, i) => {
      const name = img?.name || `stamp_${String(i + 1).padStart(2, "0")}.png`;
      const blob = dataUrlToBlob(img.pngBase64);
      zip.file(name, blob);
    });

    const out = await zip.generateAsync({ type: "blob" });
    const safePrompt = (prompt || "stamps")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 28);

    downloadBlob(out, `maplebar_${vibe}_${safePrompt || "stamps"}.zip`);
  }

  function downloadOne(img) {
    const blob = dataUrlToBlob(img.pngBase64);
    downloadBlob(blob, img.name || "stamp.png");
  }

  function setSuggestion(s) {
    setPrompt(s);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 pb-12 sm:pb-16">
      {/* remove AI labeling in modal */}
      <GeneratingModal open={modalOpen} progress={progress} phase={phase} />

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* left */}
        <div className="lg:col-span-5 min-w-0 space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
              <Sparkles className="h-5 w-5" />
              Stamp Brush Generator
            </div>
            <div className="text-slate-500 text-sm mt-1">{subtitle}</div>

            <div className="mt-5 space-y-4">
              {/* Prompt */}
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Prompt
                </label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[92px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={busy}
                  placeholder="Example: sparkle stars, twinkles, kawaii vibe"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSuggestion(s)}
                      disabled={busy}
                      className={[
                        "text-xs px-3 py-1.5 rounded-full border transition",
                        "border-slate-200 bg-white hover:bg-slate-50",
                        busy ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      title="Use suggestion"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibe pills */}
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Vibe
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {VIBES.map((v) => {
                    const active = vibe === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setVibe(v.value)}
                        disabled={busy}
                        className={[
                          "px-3 py-2 rounded-full text-sm border transition inline-flex items-center gap-2",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                          busy ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        <Wand2 className="h-4 w-4" />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count + size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    disabled={busy}
                  />
                  <div className="mt-1 text-xs text-slate-500">
                    Keep this small to avoid rate limits.
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Size
                  </label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    disabled={busy}
                  >
                    <option value={1024}>1024</option>
                    <option value={2048}>2048</option>
                  </select>
                </div>
              </div>

              {/* Softness */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Softness
                  </label>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {softness.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={softness}
                  onChange={(e) => setSoftness(Number(e.target.value))}
                  className="w-full mt-2"
                  disabled={busy}
                />
              </div>

              {/* Density */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Density
                  </label>
                  <span className="text-sm text-slate-500 tabular-nums">
                    {density.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="w-full mt-2"
                  disabled={busy}
                />
              </div>

              {/* Generate button */}
              <div
                className={[
                  "rounded-2xl sm:rounded-3xl p-[1.5px]",
                  "bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-200",
                  busy ? "opacity-70" : "hover:opacity-95",
                  "transition",
                ].join(" ")}
              >
                <button
                  onClick={generate}
                  disabled={busy || !prompt.trim()}
                  className={[
                    "w-full rounded-2xl sm:rounded-3xl bg-white px-4 py-3 text-left border border-slate-200",
                    "shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg",
                    busy || !prompt.trim()
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        Generate stamp pack
                      </div>
                      <div className="text-sm text-slate-500">
                        {prompt.trim()
                          ? "Transparent PNGs you can turn into brushes."
                          : "Type a prompt first."}
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {busy ? "Working…" : "Go"}
                    </div>
                  </div>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-slate-900 font-semibold text-sm">
                  How to import into Photoshop
                </div>
                <ol className="mt-2 text-sm text-slate-600 list-decimal ml-5 space-y-1">
                  <li>Download a stamp PNG</li>
                  <li>Open it in Photoshop</li>
                  <li>
                    Go to{" "}
                    <span className="font-medium">
                      Edit → Define Brush Preset…
                    </span>
                  </li>
                </ol>
              </div>

              {err ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {err}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* right */}
        <div className="lg:col-span-7 min-w-0 space-y-4 sm:space-y-6">
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-slate-900 font-semibold text-lg">
                  Your Stamp Pack
                </div>
                <div className="text-slate-500 text-sm">
                  Transparent PNG stamps — download one or zip them all.
                </div>
              </div>

              <button
                onClick={downloadZip}
                disabled={!images?.length}
                className={[
                  "inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm shadow-sm transition",
                  images?.length
                    ? "border-slate-200 bg-white hover:bg-slate-50"
                    : "border-slate-200 bg-white opacity-60 cursor-not-allowed",
                ].join(" ")}
              >
                <Package className="h-4 w-4" />
                ZIP
              </button>
            </div>

            {!images?.length ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Generate a pack to see your stamps here.
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div
                    key={img?.name || i}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <div className="aspect-square bg-slate-50 grid place-items-center">
                      <div className="w-full h-full bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%,#f1f5f9),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%,#f1f5f9)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]">
                        <img
                          src={img.pngBase64}
                          alt={img.name || "stamp"}
                          className="w-full h-full object-contain p-3"
                        />
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-600 truncate">
                        {img?.name || `stamp_${i + 1}.png`}
                      </div>

                      <button
                        onClick={() => downloadOne(img)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PNG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 px-2">
            Note: These are stamp PNGs (MVP). You define them as brushes inside
            Photoshop.
          </div>
        </div>
      </div>
    </div>
  );
}
