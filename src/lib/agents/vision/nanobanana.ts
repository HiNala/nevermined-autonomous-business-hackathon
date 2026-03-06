const NANOBANANA_BASE = "https://nanobnana.com/api";

function getApiKey(): string {
  const key = process.env.NANOBANANA_API_KEY;
  if (!key) throw new Error("NANOBANANA_API_KEY is not set");
  return key;
}

export function isNanobananaConfigured(): boolean {
  return Boolean(process.env.NANOBANANA_API_KEY);
}

interface GenerateRequest {
  prompt: string;
  aspect_ratio?: string;
  size?: string;
  format?: string;
  images?: string[];
}

interface GenerateResponse {
  code: number;
  message: string;
  data: { task_id: string };
}

interface TaskResult {
  code: number;
  message: string;
  data: {
    status: "pending" | "processing" | "completed" | "failed";
    image_url?: string;
    error?: string;
  };
}

export async function generateImage(params: GenerateRequest): Promise<string> {
  const res = await fetch(`${NANOBANANA_BASE}/v2/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`NanoBanana generate HTTP ${res.status}: ${res.statusText}`);
  }

  const data: GenerateResponse = await res.json();

  if (data.code !== 200) {
    throw new Error(`NanoBanana generate failed: ${data.message}`);
  }

  return data.data.task_id;
}

export async function pollForResult(
  taskId: string,
  maxWaitMs = 90_000,
  intervalMs = 2_500
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    const res = await fetch(`${NANOBANANA_BASE}/v2/status/${taskId}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });

    if (!res.ok) {
      throw new Error(`NanoBanana poll HTTP ${res.status}: ${res.statusText}`);
    }

    const data: TaskResult = await res.json();

    if (data.data.status === "completed" && data.data.image_url) {
      return data.data.image_url;
    }

    if (data.data.status === "failed") {
      throw new Error(`NanoBanana task failed: ${data.data.error ?? "unknown"}`);
    }
  }

  throw new Error(`NanoBanana poll timeout after ${maxWaitMs}ms for task ${taskId}`);
}

export async function generateAndWait(params: GenerateRequest): Promise<string> {
  const taskId = await generateImage(params);
  return pollForResult(taskId);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
