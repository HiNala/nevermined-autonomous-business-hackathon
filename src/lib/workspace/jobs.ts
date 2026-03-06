/**
 * Persistent Job model — every pipeline run creates a durable job record.
 * Jobs are the single source of truth for status, artifacts, and costs.
 */

import type { StructuredBrief, ResearchDocument, PurchasedAsset, PipelineEvent, AgentTransaction } from "@/types/pipeline";

// ── Job status states ─────────────────────────────────────────────────
export type JobStatus =
  | "queued"
  | "planning"
  | "researching"
  | "enriching"
  | "packaging"
  | "delivered"
  | "failed"
  | "awaiting_approval";

// ── Delivery package ──────────────────────────────────────────────────
export interface DeliveryPackage {
  jobId: string;
  title: string;
  executiveSummary: string;
  body: string;               // full markdown
  sourceAppendix: string;     // formatted sources
  provenanceBlock: ProvenanceBlock;
  externalAssetDisclosure: string[];
  costSummary: CostSummary;
  deliveredAt: string;
  variants: {
    fullReport: string;
    executiveBrief: string;
    summaryOnly: string;
    jsonArtifact: string;     // JSON-serialised document
  };
}

export interface ProvenanceBlock {
  jobId: string;
  agentsInvolved: string[];
  modelsUsed: { agent: string; provider: string; model: string }[];
  sourcesFetchedAt: string;
  externalDataPurchased: boolean;
  confidenceSummary: ConfidenceSummary;
  generatedAt: string;
}

export interface ConfidenceSummary {
  level: "high" | "medium" | "low";
  score: number;               // 0-100
  sourceCount: number;
  avgSourceFreshness: "recent" | "moderate" | "stale" | "unknown";
  unresolvedUncertainties: string[];
  contradictionsDetected: boolean;
  premiumDataUsed: boolean;
}

export interface CostSummary {
  totalCredits: number;
  breakdown: { agent: string; credits: number; reason: string }[];
  externalPurchases: number;
  durationMs: number;
}

// ── Core Job record ───────────────────────────────────────────────────
export interface Job {
  jobId: string;
  workspaceId: string;
  mode: "pipeline" | "strategist" | "researcher" | "seller";
  input: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** Unique idempotency key — re-submitting same key returns existing job */
  idempotencyKey?: string;
  brief?: StructuredBrief;
  document?: ResearchDocument;
  purchasedAssets?: PurchasedAsset[];
  deliveryPackage?: DeliveryPackage;
  events: PipelineEvent[];
  transactions: AgentTransaction[];
  costs: CostSummary;
  error?: string;
  /** Approval required before expensive external purchases */
  pendingApproval?: { assets: { did: string; name: string; credits: number }[]; totalCredits: number };
}

// ── In-memory job store ───────────────────────────────────────────────
const jobStore = new Map<string, Job>();
const idempotencyIndex = new Map<string, string>(); // key → jobId

function makeJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createJob(params: {
  workspaceId?: string;
  mode: Job["mode"];
  input: string;
  idempotencyKey?: string;
}): Job {
  // Return existing job if idempotency key matches
  if (params.idempotencyKey) {
    const existingId = idempotencyIndex.get(params.idempotencyKey);
    if (existingId) {
      const existing = jobStore.get(existingId);
      if (existing) return existing;
    }
  }

  const jobId = makeJobId();
  const now = new Date().toISOString();
  const job: Job = {
    jobId,
    workspaceId: params.workspaceId ?? "default",
    mode: params.mode,
    input: params.input,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    events: [],
    transactions: [],
    costs: { totalCredits: 0, breakdown: [], externalPurchases: 0, durationMs: 0 },
    idempotencyKey: params.idempotencyKey,
  };

  jobStore.set(jobId, job);
  if (params.idempotencyKey) {
    idempotencyIndex.set(params.idempotencyKey, jobId);
  }

  return job;
}

export function getJob(jobId: string): Job | undefined {
  return jobStore.get(jobId);
}

export function updateJob(jobId: string, updates: Partial<Job>): Job | undefined {
  const job = jobStore.get(jobId);
  if (!job) return undefined;
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobStore.set(jobId, updated);
  return updated;
}

export function listJobs(workspaceId = "default", limit = 20): Job[] {
  const all = Array.from(jobStore.values())
    .filter((j) => j.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  return all;
}

export function getRecentJobs(limit = 10): Job[] {
  return Array.from(jobStore.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

// ── Artifact library ─────────────────────────────────────────────────
export interface ArtifactRecord {
  id: string;
  jobId: string;
  workspaceId: string;
  type: "brief" | "document" | "purchased_asset" | "delivery_package";
  title: string;
  createdAt: string;
  tags: string[];
  data: StructuredBrief | ResearchDocument | PurchasedAsset | DeliveryPackage;
}

const artifactStore = new Map<string, ArtifactRecord>();

export function saveArtifact(record: Omit<ArtifactRecord, "id">): ArtifactRecord {
  const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const artifact = { ...record, id };
  artifactStore.set(id, artifact);
  return artifact;
}

export function getArtifact(id: string): ArtifactRecord | undefined {
  return artifactStore.get(id);
}

export function findArtifacts(workspaceId = "default", type?: ArtifactRecord["type"], limit = 20): ArtifactRecord[] {
  return Array.from(artifactStore.values())
    .filter((a) => a.workspaceId === workspaceId && (!type || a.type === type))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/**
 * Build a delivery package from a completed job's artifacts.
 * Called by Seller once pipeline execution finishes.
 */
export function buildDeliveryPackage(
  job: Job,
  document: ResearchDocument,
  provenanceBlock: ProvenanceBlock
): DeliveryPackage {
  const sources = document.sources
    .map((s, i) => `[${i + 1}] ${s.title}\n    ${s.url}\n    Fetched: ${s.fetchedAt}`)
    .join("\n\n");

  const body = [
    `# ${document.title}`,
    "",
    `## Executive Summary`,
    document.summary,
    "",
    ...document.sections.flatMap((s) => [`## ${s.heading}`, "", s.content, ""]),
  ].join("\n");

  const executiveBrief = [
    `# ${document.title} — Executive Brief`,
    "",
    document.summary,
    "",
    `**Key Findings:**`,
    ...document.sections.slice(0, 3).map((s) => `- **${s.heading}**: ${s.content.slice(0, 200)}…`),
  ].join("\n");

  const externalAssetDisclosure = (job.purchasedAssets ?? [])
    .filter((a) => a.status === "success")
    .map((a) => `${a.name} (${a.provider}) — ${a.creditsPaid}cr`);

  return {
    jobId: job.jobId,
    title: document.title,
    executiveSummary: document.summary,
    body,
    sourceAppendix: sources,
    provenanceBlock,
    externalAssetDisclosure,
    costSummary: job.costs,
    deliveredAt: new Date().toISOString(),
    variants: {
      fullReport: body,
      executiveBrief,
      summaryOnly: document.summary,
      jsonArtifact: JSON.stringify({ title: document.title, summary: document.summary, sections: document.sections, sources: document.sources }, null, 2),
    },
  };
}
