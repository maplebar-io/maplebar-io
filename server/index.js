// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import OpenAI from "openai";
import sharp from "sharp";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ----------------------------- Helpers ----------------------------- */

// tiny helper: force uppercase hex
function normalizeHex(hex) {
  return hex.toUpperCase();
}

function clamp01(n) {
  const x = Number(n);
  if (!isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Brush finalizer:
 * - trims away residual edge pixels / faint guide lines
 * - OPTIONAL: forces a pure black silhouette with hard cutoff (recommended for PS brushes)
 * - adds clean transparent padding
 * - re-sizes back to finalSize x finalSize (contain) so you always return 1024/2048
 *
 * base64DataUrl: "data:image/png;base64,...."
 */
async function finalizeBrushPng(base64DataUrl, opts = {}) {
  const {
    trimThreshold = 4,          // trims faint edge lines
    pad = 16,                   // margin after trim
    finalSize = null,           // keep 1024/2048
    alphaCutoff = 48,           // IMPORTANT: 0-255. Higher = less noise, more aggressive
    smallSpeckle = 0,           // OPTIONAL: 0 disables. Try 1–2 if needed.
  } = opts;

  const buffer = Buffer.from(
    base64DataUrl.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );

  // Load and ensure alpha exists
  const src = sharp(buffer).ensureAlpha();

  // Extract alpha channel and hard-threshold it into a clean mask
  // alphaCutoff: raise to remove noise (try 32, 48, 64, 80)
  let alpha = src.extractChannel("alpha").threshold(alphaCutoff);

  // OPTIONAL: tiny despeckle (helps with single-pixel dust)
  // This is a morphological "close" (dilate then erode) effect via blur+threshold hack.
  // Keep it small; too high will chunk your brush.
  if (smallSpeckle > 0) {
    alpha = alpha
      .blur(smallSpeckle)       // slightly fills holes / removes isolated pixels
      .threshold(128);          // re-binarize
  }

  // Create a PURE BLACK RGB image (no noise possible)
  const meta = await src.metadata();
  const width = meta.width || finalSize || 1024;
  const height = meta.height || finalSize || 1024;

    // Compose: pure black RGB + thresholded alpha as the ONLY transparency
    const alphaRaw = await alpha.raw().toBuffer({ resolveWithObject: true });

    // Create a solid black RGB image, then attach alpha as the 4th channel
    let out = sharp({
    create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }, // solid black
    },
    }).joinChannel(alphaRaw.data, {
    raw: { width: alphaRaw.info.width, height: alphaRaw.info.height, channels: 1 },
    });



  // Now trim edge junk based on transparency, then pad, then resize
    out = out
    .trim({ threshold: trimThreshold })
    .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

    if (finalSize) {
    out = out.resize(finalSize, finalSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    }

  const buf = await out.png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}


/* ----------------------------- Validation ----------------------------- */

const EnhanceBody = z.object({
  colors: z.array(z.string().regex(/^#[0-9A-Fa-f]{6}$/)).min(3).max(60),
  count: z.number().int().min(3).max(12).default(6),
  style: z.string().optional().default("canva"),
});

const BrushesBody = z.object({
  prompt: z.string().min(3).max(400),
  count: z.number().int().min(1).max(8).default(6), // keep max conservative for early rate limits
  size: z.union([z.literal(1024), z.literal(2048)]).default(1024),

  softness: z.number().min(0).max(1).default(0.6),
  density: z.number().min(0).max(1).default(0.7),
  vibe: z.enum(["cute", "clean", "grunge", "handdrawn"]).default("cute"),
});

/* ----------------------------- Routes ----------------------------- */

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * AI palette curation
 * Takes candidate hex colors and returns exactly `count` colors with roles.
 */
app.post("/api/palette/enhance", async (req, res) => {
  try {
    const parsed = EnhanceBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY in server environment" });
    }

    const { colors, count, style } = parsed.data;

    const schema = {
      name: "palette_response",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          palette: {
            type: "array",
            minItems: count,
            maxItems: count,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                hex: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
                role: {
                  type: "string",
                  enum: [
                    "Background",
                    "Surface",
                    "Primary",
                    "Secondary",
                    "Accent",
                    "Deep",
                    "Neutral",
                    "Highlight",
                  ],
                },
              },
              required: ["hex", "role"],
            },
          },
        },
        required: ["palette"],
      },
    };

    const input = [
      {
        role: "system",
        content: `You are a color palette curator for a Canva-like design tool.
Return a palette of exactly ${count} colors chosen from the candidate list.
Goals:
- Keep it faithful to the image-derived candidates
- Avoid near-duplicates (don’t pick multiple colors that look the same)
- Ensure variety: at least 1 light (Background/Surface) and 1 dark (Deep), plus 1 punchy Accent if possible
- Prefer clean, pleasant colors over muddy ones
- Assign a sensible role to each color.`,
      },
      {
        role: "user",
        content: `Style: ${style}
Candidate colors (hex): ${colors.map(normalizeHex).join(", ")}`,
      },
    ];

    const response = await client.responses.create({
      model: "gpt-5",
      input,
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          strict: true,
          schema: schema.schema,
        },
      },
      reasoning: { effort: "low" },
    });

    const text = response.output_text || "";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { palette: [] };
    }

    if (!data?.palette?.length) {
      return res.status(502).json({ error: "AI returned no palette", raw: text });
    }

    data.palette = data.palette.map((p) => ({
      hex: normalizeHex(p.hex),
      role: p.role,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
      message: err?.message || String(err),
    });
  }
});

/**
 * AI stamp brush generator (PNG w/ transparent background)
 * Returns an array of base64 PNG data URLs.
 */
app.post("/api/brushes/generate", async (req, res) => {
  try {
    const parsed = BrushesBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OPENAI_API_KEY in server environment" });
    }

    const { prompt, count, size, vibe } = parsed.data;
    const softness = clamp01(parsed.data.softness);
    const density = clamp01(parsed.data.density);

    // Brush stamp rules — hardened for Photoshop brush creation
    const rules =
      `You are generating a SINGLE Photoshop stamp brush image.\n` +
      `Hard requirements (must follow exactly):\n` +
      `- Background must be FULLY transparent (true alpha = 0).\n` +
      `- NO residual pixels, haze, mist, glow, or soft transparency outside the stamp.\n` +
      `- Black ink ONLY for the stamp (pure black or near-black; no color).\n` +
      `- No text, letters, numbers, symbols, watermarks, logos, or signatures.\n` +
      `- No frame, border, bounding box, UI, mockup, or canvas outline.\n` +
      `- Subject must be perfectly centered.\n` +
      `- Stamp should fill ~70–85% of the canvas.\n` +
      `- Leave at least 10–15% empty margin on all sides.\n` +
      `- Do NOT paint near or touch the canvas edges.\n` +
      `- High contrast, clean silhouette, clearly defined shape.\n` +
      `- Output MUST be a single isolated stamp (not a collage or pattern tile).\n` +
      `- Image must be directly usable as a Photoshop brush without cleanup.\n`;

    const vibeGuide =
      {
        cute: "Style: cute, clean, playful shapes, smooth edges, charming aesthetic.",
        clean: "Style: minimal, crisp edges, modern, balanced spacing.",
        grunge: "Style: distressed ink, rough edges, speckle, texture, gritty.",
        handdrawn: "Style: hand-drawn ink, imperfect lines, organic shapes.",
      }[vibe] || "Style: clean, crisp, brush-stamp friendly.";

    const knobGuide =
      `Softness: ${softness} (0=hard crisp edges, 1=very soft)\n` +
      `Density: ${density} (0=minimal, 1=very dense)\n`;

    const images = [];

    for (let i = 0; i < count; i++) {
      const variationHint =
        `Variation: ${i + 1} of ${count}. ` +
        `Make it meaningfully different while staying on-theme.`;

      const fullPrompt = `${rules}\n${vibeGuide}\n${knobGuide}\nUser prompt: ${prompt}\n${variationHint}`;

      try {
        const result = await client.images.generate({
          model: "gpt-image-1",
          prompt: fullPrompt,
          size: `${size}x${size}`,
          background: "transparent",
          output_format: "png",
        });

        const b64 = result?.data?.[0]?.b64_json;
        if (!b64) continue;

        const rawDataUrl = `data:image/png;base64,${b64}`;

        // --- FINALIZE PASS ---
        // Goal: eliminate faint border lines AND guarantee brush-friendly output.
        const cleaned = await finalizeBrushPng(rawDataUrl, {
        trimThreshold: 4,
        pad: Math.max(8, Math.round(size * 0.05)),
        finalSize: size,
        alphaCutoff: 96,     // 👈 start here (try 48–96)
        smallSpeckle: 1,     // 👈 optional; set 0 if it changes shape too much
        });

        images.push({
          name: `maplebar_stamp_${String(i + 1).padStart(2, "0")}.png`,
          pngBase64: cleaned,
        });
      } catch (e) {
        const msg = e?.message || String(e);
        console.error("brush generate error:", e);

        if (String(e?.status) === "403" || msg.includes("must be verified")) {
          return res.status(403).json({
            error: "Image model access denied",
            message:
              "Your OpenAI organization must be verified to use gpt-image-1. Verify in OpenAI settings, then try again.",
          });
        }

        throw e;
      }
    }

    if (!images.length) {
      return res.status(502).json({ error: "AI returned no images" });
    }

    res.json({ images });
  } catch (err) {
    console.error("brush generate fatal error:", err);
    res.status(500).json({
      error: "Server error",
      message: err?.message || String(err),
    });
  }
});

/* ----------------------------- Listen ----------------------------- */

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`maplebar api listening on http://localhost:${PORT}`);
});
