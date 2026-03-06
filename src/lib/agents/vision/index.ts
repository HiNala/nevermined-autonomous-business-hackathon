import { VisionRequest, VisionResult, AttemptRecord } from "./types";
import { generateAndWait } from "./nanobanana";
import { buildInitialPrompt, buildRefinementPrompt } from "./prompt-engine";
import { judgeImage } from "./quality-judge";

const MAX_ATTEMPTS = 3;

export async function runVisionAgent(request: VisionRequest): Promise<VisionResult> {
  const history: AttemptRecord[] = [];

  let currentPrompt = buildInitialPrompt(request);
  let bestAttempt: AttemptRecord | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[VISION] Attempt ${attempt}/${MAX_ATTEMPTS}`);
    console.log(`[VISION] Prompt: ${currentPrompt.slice(0, 120)}...`);

    let imageUrl = "";
    const taskId = `attempt_${attempt}_${Date.now()}`;

    // --- Generate ---
    try {
      imageUrl = await generateAndWait({
        prompt: currentPrompt,
        aspect_ratio: request.aspectRatio ?? "16:9",
        size: request.size ?? "1K",
        format: "png",
        ...(request.referenceImages?.length
          ? { images: request.referenceImages }
          : {}),
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown generation error";
      console.error(`[VISION] Generation failed on attempt ${attempt}: ${error}`);

      if (attempt === MAX_ATTEMPTS) {
        return {
          success: false,
          imageUrl: bestAttempt?.imageUrl ?? "",
          attempts: attempt,
          passedQuality: false,
          qualityReport: {
            score: 0,
            passed: [],
            failed: request.requirements,
            notes: `Generation failed: ${error}`,
          },
          finalPrompt: currentPrompt,
          attemptHistory: history,
          error,
        };
      }
      continue;
    }

    // --- Judge ---
    const judgement = await judgeImage(imageUrl, request, attempt);

    const record: AttemptRecord = {
      attempt,
      prompt: currentPrompt,
      taskId,
      imageUrl,
      qualityScore: judgement.score,
      passed: judgement.passed,
      failureReasons: judgement.failedCriteria,
    };

    history.push(record);

    if (!bestAttempt || judgement.score > (bestAttempt.qualityScore ?? 0)) {
      bestAttempt = record;
    }

    console.log(
      `[VISION] Attempt ${attempt} score: ${judgement.score} | passed: ${judgement.passed}`
    );

    // --- Pass: return immediately ---
    if (judgement.passed) {
      return {
        success: true,
        imageUrl,
        attempts: attempt,
        passedQuality: true,
        qualityReport: {
          score: judgement.score,
          passed: judgement.passedCriteria,
          failed: [],
          notes: judgement.notes,
        },
        finalPrompt: currentPrompt,
        attemptHistory: history,
      };
    }

    // --- Fail: prepare refined prompt for next attempt ---
    if (attempt < MAX_ATTEMPTS) {
      const { prompt: refinedPrompt, reasoning } = buildRefinementPrompt(
        request,
        currentPrompt,
        judgement.failedCriteria
      );

      record.refinementReasoning = reasoning;
      currentPrompt = refinedPrompt;

      console.log(`[VISION] Refining for attempt ${attempt + 1}: ${reasoning}`);
    }
  }

  // --- Hard stop: return best attempt with failure flag ---
  console.log(`[VISION] Hard stop. Returning best of ${MAX_ATTEMPTS} attempts.`);

  return {
    success: true,
    imageUrl: bestAttempt!.imageUrl,
    attempts: MAX_ATTEMPTS,
    passedQuality: false,
    qualityReport: {
      score: bestAttempt!.qualityScore,
      passed: [],
      failed: bestAttempt!.failureReasons ?? request.requirements,
      notes: `Best of ${MAX_ATTEMPTS} attempts. Quality threshold not met.`,
    },
    finalPrompt: bestAttempt!.prompt,
    attemptHistory: history,
  };
}
