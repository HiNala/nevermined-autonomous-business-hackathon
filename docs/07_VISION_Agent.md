# VISION Agent — NanoBanana Image Generation

## Overview

VISION is the image generation stage of the Auto Business pipeline. After the Composer produces a research report, VISION generates a professional hero image using **NanoBanana** (which wraps Gemini image models) and runs an iterative quality loop to ensure the result meets a minimum quality bar before being attached to the report.

VISION is **non-blocking and best-effort** — if it fails or is disabled, the core pipeline result is unaffected.

---

## Pipeline Position

```
Seller → Interpreter → Composer → [Buyer*] → Seller → VISION*
                                                         ↓
                                                   Hero Image
```

Stage 6 (optional) — runs after Composer document is ready.

---

## API Endpoint

```
POST /api/agents/vision
GET  /api/agents/vision
```

### POST Request Body

```json
{
  "brief": "Autonomous AI agent payments in 2025. The report covers key platforms...",
  "outputContext": "research_report",
  "requirements": ["Professional quality", "No text overlay", "Relevant to topic"],
  "aspectRatio": "16:9",
  "style": { "mood": "professional" },
  "calledBy": "composer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brief` | string | ✅ | Title + summary of the document to visualise |
| `calledBy` | `"interpreter"` \| `"composer"` | ✅ | Caller identity — enforced |
| `outputContext` | string | — | One of: `research_report`, `hero_banner`, `marketplace_listing`, `agent_card`, `data_visualization`, `agent_transaction` |
| `requirements` | string[] | — | Visual requirements passed to the prompt engine |
| `aspectRatio` | string | — | `"16:9"` (default), `"1:1"`, `"9:16"`, `"4:3"`, `"3:4"`, `"2:3"`, `"3:2"` |
| `style.mood` | string | — | `professional`, `vibrant`, `dark`, `minimal`, `futuristic` |

### POST Response

```json
{
  "imageUrl": "https://...",
  "attempts": 2,
  "passedQuality": true,
  "qualityReport": {
    "score": 84,
    "passed": ["relevance", "professional quality", "no text overlay"],
    "failed": [],
    "notes": "Image clearly represents AI agent commerce themes"
  },
  "finalPrompt": "A photorealistic wide-angle scene...",
  "attemptHistory": [ ... ]
}
```

---

## Quality Loop

Each attempt is evaluated by a GPT-4o-mini vision judge that scores the image 0–100 against four criteria:

1. **Relevance** — does it visually represent the report topic?
2. **Professional quality** — is it suitable for a polished research deliverable?
3. **No text overlay** — no watermarks, labels, or UI chrome
4. **Composition** — balanced layout, appropriate for a 16:9 hero banner

If the score is below the threshold (default: 60), VISION generates a refined prompt incorporating the judge's feedback and tries again. Up to **3 attempts** are made. The best-scoring image is always returned even if the threshold is never met.

---

## Demo Mode (No API Key)

When `NANOBANANA_API_KEY` is not set, the endpoint returns a safe placeholder:

```json
{
  "demo": true,
  "imageUrl": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
  "attempts": 0,
  "passedQuality": false,
  "qualityReport": {
    "score": 0,
    "failed": ["NanoBanana not configured — returning demo placeholder"],
    "notes": "Demo mode: set NANOBANANA_API_KEY to enable real image generation"
  }
}
```

The Studio UI handles this gracefully — the placeholder is shown with the same banner UI but with `passedQuality: false` styling.

---

## Environment Variable

```env
# NanoBanana — VISION Agent Image Generation (optional)
# Powers the VISION agent: wraps Gemini image models at lower cost than direct API.
# Standard: Gemini 2.5 Flash Image — 24 credits/generation, max 3 attempts per job.
# Get your key at: https://nanobnana.com/dashboard/api-keys
# Without this key, /api/agents/vision returns a demo placeholder image safely.
NANOBANANA_API_KEY=
```

---

## Studio Integration

### Settings Panel

The **VISION Image Generation** toggle is in **Tool Settings → Agent Trading** section:

- **ON** (default) — VISION runs automatically after every Composer report
- **OFF** — image generation is skipped entirely; pipeline is faster

### Event Stream

When VISION completes, a `vision_complete` event appears in the Job & Events panel:

```
[IMAGE] Generated in 2 attempts · quality 84/100
```

### Sponsor Rail

`NanoBanana` appears as a gold sponsor badge in the Sponsor Proof Rail after any run that used VISION.

### DocumentView

The generated image is displayed as a **VisionImageBanner** above the report summary:
- Full 16:9 hero image with hover zoom
- Click to open full-screen lightbox
- Metadata bar showing: attempts, quality score, `✓ quality passed` indicator

---

## Judge Demo Preset

The **VISION Image Demo** preset in Judge Mode runs the Composer in researcher mode with `visionEnabled: true`, showcasing the full image generation flow including the quality loop.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/agents/vision/index.ts` | `runVisionAgent()` — main entrypoint |
| `src/lib/agents/vision/nanobanana.ts` | NanoBanana API client, `isNanobananaConfigured()` |
| `src/lib/agents/vision/types.ts` | `VisionRequest`, `VisionResult` types |
| `src/app/api/agents/vision/route.ts` | Next.js API route (`POST` + `GET`) |
| `src/lib/agent/pipeline.ts` | VISION Stage 6 — called after buyer, before `complete` |
| `src/components/pages/studio-page.tsx` | `triggerVision()`, `VisionImageBanner`, VISION agent card |
| `src/components/ui/judge-mode.tsx` | VISION Image Demo preset |
| `src/components/ui/settings-panel.tsx` | `visionEnabled` toggle |
| `src/lib/tool-settings.ts` | `TradingSettings.visionEnabled` flag |
| `src/lib/agent/config.ts` | `AGENT_CONFIG.vision` — colors and metadata |

---

## Credits & Pricing

| Operation | Credits |
|-----------|---------|
| Single image generation (NanoBanana standard) | ~24cr |
| Max per VISION job (3 attempts) | ~72cr |
| Judge evaluation (GPT-4o-mini vision) | ~1cr |

*Credits are approximate. Actual cost depends on NanoBanana pricing at time of use.*
