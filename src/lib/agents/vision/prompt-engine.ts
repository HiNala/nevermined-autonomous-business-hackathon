import { VisionRequest } from "./types";

const CONTEXT_TEMPLATES: Record<string, string> = {
  research_report:
    "Clean, professional infographic style. Minimal UI illustration. " +
    "Corporate data visualization aesthetic. Flat design with subtle depth.",

  marketplace_listing:
    "Modern SaaS product screenshot aesthetic. Clean interface preview. " +
    "Light background, crisp typography visible in mockup, " +
    "subtle drop shadow, photographed on neutral surface.",

  agent_card:
    "Minimal tech icon / avatar. Abstract geometric. " +
    "Single color family, high contrast. Suitable as a square profile image. " +
    "No text, symbolic representation.",

  hero_banner:
    "Cinematic wide-format digital illustration. Dramatic lighting. " +
    "Depth of field. Professional editorial quality. 16:9 composition.",

  data_visualization:
    "Clean chart or diagram illustration. " +
    "Minimal color palette, maximum data clarity. " +
    "Infographic-style but polished and printable.",

  agent_transaction:
    "Abstract digital illustration of two geometric AI nodes exchanging a glowing token. " +
    "Network graph aesthetic. Dark background with neon accent nodes. " +
    "Clean, symbolic, no text.",

  default:
    "High quality, professional, modern. Clean composition. " +
    "Suitable for a tech product or financial platform.",
};

const MOOD_MODIFIERS: Record<string, string> = {
  professional: "corporate, trustworthy, clean lines, business context",
  vibrant: "bold colors, energetic, dynamic composition, saturated palette",
  dark: "dark background, high contrast, moody, sophisticated",
  minimal: "whitespace, sparse elements, zen, restrained palette",
  futuristic: "sci-fi, holographic, neon accents, digital abstract",
};

const QUALITY_SUFFIX =
  "Photorealistic quality where applicable. No watermarks. No text overlays unless specified. " +
  "Sharp focus. Professional output. Appropriate for a B2B tech product.";

export function buildInitialPrompt(request: VisionRequest): string {
  const template =
    CONTEXT_TEMPLATES[request.outputContext] ?? CONTEXT_TEMPLATES.default;

  const moodMod = request.style?.mood
    ? (MOOD_MODIFIERS[request.style.mood] ?? request.style.mood)
    : "";

  const paletteMod = request.style?.palette
    ? `Color palette: ${request.style.palette}.`
    : "";

  const compositionMod = request.style?.composition
    ? `Composition: ${request.style.composition}.`
    : "";

  const requirementsMod =
    request.requirements.length > 0
      ? `Must include: ${request.requirements.join(", ")}.`
      : "";

  // Extract a short subject from the brief (before the first period or 120 chars)
  const briefText = request.brief.trim();
  const shortSubject = briefText.includes(".")
    ? briefText.slice(0, briefText.indexOf(".")).trim()
    : briefText.slice(0, 120).trim();

  // Build a prompt that explicitly tells the model WHAT to depict
  const subjectDirective =
    `Create an illustration that visually represents: "${shortSubject}". ` +
    `The image MUST be directly about this specific topic — show objects, symbols, or scenes that clearly relate to "${shortSubject}".`;

  const parts = [
    subjectDirective,
    template,
    moodMod,
    paletteMod,
    compositionMod,
    requirementsMod,
    QUALITY_SUFFIX,
  ].filter(Boolean);

  return parts.join(" ");
}

export function buildRefinementPrompt(
  originalRequest: VisionRequest,
  previousPrompt: string,
  failureReasons: string[]
): { prompt: string; reasoning: string } {
  void previousPrompt; // acknowledged — we re-build from scratch on refine

  const reasoning = `Attempt failed because: ${failureReasons.join("; ")}. Adjusting prompt.`;
  const fixes: string[] = [];

  for (const reason of failureReasons) {
    const r = reason.toLowerCase();

    if (r.includes("too dark") || r.includes("underexposed")) {
      fixes.push("bright, well-lit, high exposure");
    }
    if (r.includes("too busy") || r.includes("cluttered")) {
      fixes.push(
        "simplified composition, remove unnecessary elements, more negative space"
      );
    }
    if (r.includes("text") || r.includes("watermark") || r.includes("logo")) {
      fixes.push(
        "absolutely no text, no watermarks, no logos, no overlaid typography"
      );
    }
    if (r.includes("blurry") || r.includes("soft")) {
      fixes.push("tack sharp, high resolution, crisp detail, 4K quality");
    }
    if (r.includes("off brand") || r.includes("wrong style")) {
      fixes.push("modern professional tech aesthetic, clean, contemporary");
    }
    if (r.includes("wrong subject") || r.includes("missing element")) {
      fixes.push(`FOCUS ON: ${originalRequest.brief}`);
    }
  }

  const refinedParts = [
    `IMPORTANT: ${originalRequest.brief}`,
    CONTEXT_TEMPLATES[originalRequest.outputContext] ?? CONTEXT_TEMPLATES.default,
    ...fixes,
    originalRequest.style?.palette
      ? `Color scheme: ${originalRequest.style.palette}.`
      : "",
    originalRequest.requirements.length > 0
      ? `REQUIRED VISUAL ELEMENTS: ${originalRequest.requirements.join(", ")}.`
      : "",
    QUALITY_SUFFIX,
  ].filter(Boolean);

  return {
    prompt: refinedParts.join(" "),
    reasoning,
  };
}
