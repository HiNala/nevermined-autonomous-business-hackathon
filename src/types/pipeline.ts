// ─── Shared Pipeline Types ───────────────────────────────────────────
// Single source of truth for all pipeline-related interfaces.
// Import from "@/types/pipeline" in UI components instead of re-defining locally.

export interface ResearchSource {
  url: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
}

export interface SponsorToolUsage {
  tool: "apify-search" | "apify-crawl" | "exa-search" | "exa-contents" | "duckduckgo" | "raw-fetch" | "nevermined-402" | "nevermined-settled" | "zeroclick-ad" | "llm-synthesis";
  label: string;
  sponsor: "Apify" | "Exa" | "Nevermined" | "ZeroClick" | "DuckDuckGo" | "LLM";
  timestamp: string;
  detail?: string;
}

export interface ResearchDocument {
  id: string;
  query: string;
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  sources: ResearchSource[];
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
  toolsUsed?: SponsorToolUsage[];
}

export interface StructuredBrief {
  id: string;
  originalInput: string;
  outputType: string;
  title: string;
  objective: string;
  scope: string[];
  searchQueries: string[];
  keyQuestions: string[];
  deliverables: string[];
  constraints: string[];
  context: string;
  provider: string;
  model: string;
  creditsUsed: number;
  createdAt: string;
  durationMs: number;
}

export interface AgentTransaction {
  id: string;
  timestamp: string;
  from: { id: string; name: string };
  to: { id: string; name: string };
  credits: number;
  purpose: string;
  artifactId: string;
  status: "pending" | "completed" | "failed";
  durationMs?: number;
}

export type PipelineStage =
  | "idle"
  | "strategist_working"
  | "strategist_complete"
  | "researcher_buying"
  | "researcher_working"
  | "researcher_evaluating"
  | "researcher_followup"
  | "buyer_discovering"
  | "buyer_purchasing"
  | "buyer_complete"
  | "seller_received"
  | "seller_planning"
  | "seller_fulfilling"
  | "seller_complete"
  | "complete"
  | "error";

export interface PipelineEvent {
  id: string;
  timestamp: string;
  stage: string;
  agent: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface PurchasedAsset {
  id: string;
  did: string;
  name: string;
  description: string;
  provider: string;
  type: "dataset" | "report" | "model" | "service" | "other";
  content: string;
  contentType: "text" | "json" | "markdown" | "html" | "binary";
  creditsPaid: number;
  purchasedAt: string;
  durationMs: number;
  status: "success" | "failed";
  error?: string;
}

export interface PipelineResult {
  mode?: string;
  brief?: StructuredBrief;
  document?: ResearchDocument;
  purchasedAssets?: PurchasedAsset[];
  transactions?: AgentTransaction[];
  events?: PipelineEvent[];
  totalCredits?: number;
  totalDurationMs?: number;
  iterations?: number;
  followUpBriefs?: StructuredBrief[];
  transaction?: AgentTransaction;
  toolsUsed?: SponsorToolUsage[];
}
