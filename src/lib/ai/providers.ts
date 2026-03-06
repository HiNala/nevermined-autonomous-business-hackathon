import "server-only";

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "openai" | "gemini" | "anthropic";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  provider?: AIProvider;
  model?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  anthropic: "claude-sonnet-4-20250514",
};

function getAvailableProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_AI_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  throw new Error("No AI provider API key configured. Set OPENAI_API_KEY, GOOGLE_AI_KEY, or ANTHROPIC_API_KEY.");
}

async function completeWithOpenAI(options: AICompletionOptions): Promise<AICompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey });
  const model = options.model ?? DEFAULT_MODELS.openai;

  const response = await client.chat.completions.create({
    model,
    messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.3,
  });

  return {
    content: response.choices[0]?.message?.content ?? "",
    provider: "openai",
    model,
    tokensUsed: response.usage?.total_tokens,
  };
}

async function completeWithGemini(options: AICompletionOptions): Promise<AICompletionResult> {
  const googleKey = process.env.GOOGLE_AI_KEY;
  if (!googleKey) throw new Error("GOOGLE_AI_KEY is not configured");
  const genAI = new GoogleGenerativeAI(googleKey);
  const model = options.model ?? DEFAULT_MODELS.gemini;
  const geminiModel = genAI.getGenerativeModel({ model });

  const systemMsg = options.messages.find((m) => m.role === "system")?.content ?? "";
  const userMessages = options.messages.filter((m) => m.role !== "system");

  const prompt = [
    systemMsg ? `System: ${systemMsg}\n\n` : "",
    ...userMessages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`),
  ].join("\n");

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  return {
    content: text,
    provider: "gemini",
    model,
  };
}

async function completeWithAnthropic(options: AICompletionOptions): Promise<AICompletionResult> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey: anthropicKey });
  const model = options.model ?? DEFAULT_MODELS.anthropic;

  const systemMsg = options.messages.find((m) => m.role === "system")?.content;
  const nonSystemMessages = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    ...(systemMsg ? { system: systemMsg } : {}),
    messages: nonSystemMessages,
  });

  const textBlock = response.content.find((b) => b.type === "text");

  return {
    content: textBlock?.text ?? "",
    provider: "anthropic",
    model,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

const AI_TIMEOUT_MS = 120_000; // 2 minute timeout per AI call

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`AI call timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export async function complete(options: AICompletionOptions): Promise<AICompletionResult> {
  const provider = options.provider ?? getAvailableProvider();

  switch (provider) {
    case "openai":
      return withTimeout(completeWithOpenAI(options), AI_TIMEOUT_MS);
    case "gemini":
      return withTimeout(completeWithGemini(options), AI_TIMEOUT_MS);
    case "anthropic":
      return withTimeout(completeWithAnthropic(options), AI_TIMEOUT_MS);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export function listAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.GOOGLE_AI_KEY) providers.push("gemini");
  if (process.env.ANTHROPIC_API_KEY) providers.push("anthropic");
  return providers;
}
