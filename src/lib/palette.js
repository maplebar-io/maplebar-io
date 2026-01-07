// src/lib/palette.js
import chroma from "chroma-js";
import { kmeans } from "ml-kmeans";

function samplePixels(imageData, maxSamples = 14000) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  const stride = Math.max(1, Math.floor(totalPixels / maxSamples));
  const pts = [];

  for (let p = 0; p < totalPixels; p += stride) {
    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 20) continue;

    const l = (r + g + b) / 3;
    if (l > 252 || l < 3) continue;

    pts.push([r, g, b]);
  }

  return pts;
}

function sortColorsNice(colors) {
  return colors
    .map((c) => chroma(c))
    .sort((a, b) => {
      const [ha, hb] = [a.hsl()[0] ?? 0, b.hsl()[0] ?? 0];
      if (ha !== hb) return ha - hb;
      const [sa, sb] = [a.hsl()[1] ?? 0, b.hsl()[1] ?? 0];
      if (sa !== sb) return sb - sa;
      const [la, lb] = [a.hsl()[2] ?? 0, b.hsl()[2] ?? 0];
      return la - lb;
    })
    .map((c) => c.rgb());
}

// ✅ Normalize whatever ml-kmeans returns into clean [[r,g,b], ...]
function normalizeCenters(km) {
  const candidates = [];

  if (Array.isArray(km?.means)) candidates.push(...km.means);
  if (Array.isArray(km?.centroids)) candidates.push(...km.centroids);

  // some versions store objects: [{ centroid: [...] }, ...]
  if (Array.isArray(km?.centroids) && typeof km.centroids[0] === "object") {
    for (const c of km.centroids) {
      if (Array.isArray(c?.centroid)) candidates.push(c.centroid);
      if (Array.isArray(c?.center)) candidates.push(c.center);
      if (Array.isArray(c?.mean)) candidates.push(c.mean);
    }
  }

  const cleaned = candidates
    .map((v) => {
      if (!Array.isArray(v) || v.length < 3) return null;
      const r = Number(v[0]);
      const g = Number(v[1]);
      const b = Number(v[2]);
      if (![r, g, b].every((n) => Number.isFinite(n))) return null;
      return [r, g, b];
    })
    .filter(Boolean);

  return cleaned;
}

/**
 * ✅ Robust image decode:
 * - Prefer createImageBitmap(file) (fast + reliable)
 * - Fallback to <img>.decode() with a friendly Error message
 */
async function decodeImageFromFile(file) {
  // Best path in modern browsers
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return bmp; // ImageBitmap
    } catch {
      // fall through to <img> decode
    }
  }

  // Fallback path
  const url = URL.createObjectURL(file);
  try {
    const im = new Image();

    // Important: set src AFTER handlers (and decode) are set up
    im.src = url;

    // decode() gives a real rejection we can catch
    if (typeof im.decode === "function") {
      try {
        await im.decode();
        return im;
      } catch (err) {
        throw new Error(
          "Could not read that image. Please upload a PNG, JPG, or WEBP file."
        );
      }
    }

    // Older browsers: use onload/onerror but reject with Error (not Event)
    await new Promise((resolve, reject) => {
      im.onload = () => resolve();
      im.onerror = () =>
        reject(
          new Error(
            "Could not read that image. Please upload a PNG, JPG, or WEBP file."
          )
        );
    });

    return im;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractPaletteFromFile(file, count = 6) {
  const img = await decodeImageFromFile(file);

  const maxDim = 900;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const pts = samplePixels(imageData);

  if (pts.length < 50) {
    throw new Error("Not enough color information in that image.");
  }

  const k = Math.max(3, Math.min(12, Number(count) || 6));
  const km = kmeans(pts, k, { seed: 42 });

  const rawCenters = normalizeCenters(km);
  if (!rawCenters.length) {
    throw new Error("Palette engine failed to extract cluster centers.");
  }

  const centers = rawCenters.map(([r, g, b]) => [
    Math.round(r),
    Math.round(g),
    Math.round(b),
  ]);

  function rgbDist(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Deduplicate close colors
  const deduped = [];
  for (const c of centers) {
    const tooClose = deduped.some((d) => rgbDist(d, c) < 12);
    if (!tooClose) deduped.push(c);
  }

  const final = sortColorsNice(deduped).slice(0, k);

  return final.map((rgb) => ({
    rgb,
    hex: chroma(rgb).hex().toUpperCase(),
  }));
}
