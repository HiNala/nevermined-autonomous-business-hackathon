export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2";
export type ImageSize = "1K" | "2K" | "4K";

export interface VisionRequest {
  brief: string;
  outputContext: string;
  requirements: string[];
  style?: {
    mood?: string;
    palette?: string;
    composition?: string;
  };
  aspectRatio?: AspectRatio;
  size?: ImageSize;
  referenceImages?: string[];
  calledBy: "interpreter" | "composer";
}

export interface VisionResult {
  success: boolean;
  imageUrl: string;
  attempts: number;
  passedQuality: boolean;
  qualityReport: {
    score: number;
    passed: string[];
    failed: string[];
    notes: string;
  };
  finalPrompt: string;
  attemptHistory: AttemptRecord[];
  error?: string;
}

export interface AttemptRecord {
  attempt: number;
  prompt: string;
  taskId: string;
  imageUrl: string;
  qualityScore: number;
  passed: boolean;
  failureReasons?: string[];
  refinementReasoning?: string;
}
