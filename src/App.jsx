import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import PaletteTool from "./pages/PaletteTool";
import BrushGenerator from "./pages/BrushGenerator";

// NEW: legal + contact pages
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";

const ENABLE_BRUSH = import.meta.env.VITE_ENABLE_BRUSH === "true";

function ComingSoon() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 pb-12 sm:pb-16">
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
        <div className="text-slate-900 font-semibold text-lg">Brush Generator</div>
        <div className="text-slate-500 text-sm mt-1">
          Temporarily offline while we dial in pricing + performance.
        </div>
        <div className="mt-4 text-sm text-slate-600">Check back soon ❤️</div>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-sm shadow-sm transition"
          >
            ← Back to Palette
          </Link>
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const location = useLocation();

  const isPalette = location.pathname === "/";
  const isBrushes = location.pathname.startsWith("/brushes");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 pt-6 sm:pt-10 pb-4 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="maplebar"
            className="h-9 sm:h-10 w-auto max-w-[200px] sm:max-w-[240px] object-contain"
            draggable="false"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className={[
              "text-sm px-3 py-2 rounded-full border shadow-sm transition",
              isPalette ? "border-slate-300 bg-white" : "border-slate-200 bg-white/70 hover:bg-white",
            ].join(" ")}
          >
            Palette
          </Link>

          {ENABLE_BRUSH ? (
            <Link
              to="/brushes"
              className={[
                "text-sm px-3 py-2 rounded-full border shadow-sm transition",
                isBrushes ? "border-slate-300 bg-white" : "border-slate-200 bg-white/70 hover:bg-white",
              ].join(" ")}
            >
              Brushes
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-5 pb-10">
      <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} maplebar.io</div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="hover:underline">
            Terms
          </Link>
          <Link to="/contact" className="hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-50 via-white to-fuchsia-50">
        <TopBar />

        <Routes>
          <Route path="/" element={<PaletteTool />} />

          {/* NEW: legal + contact routes */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/contact" element={<Contact />} />

          {/* Guard route so it can’t be used when disabled */}
          <Route path="/brushes" element={ENABLE_BRUSH ? <BrushGenerator /> : <ComingSoon />} />

          {/* Optional: if someone hits /brushes/*, keep it sane */}
          <Route
            path="/brushes/*"
            element={ENABLE_BRUSH ? <BrushGenerator /> : <Navigate to="/brushes" replace />}
          />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
