// ─── Shared Pipeline Types ───────────────────────────────────────────
// Single source of truth for all pipeline-related interfaces.
// Import from "@/types/pipeline" in UI components instead of re-defining locally.

export interface ResearchSource {
  url: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
  /** Source quality scores from Researcher agent */
  relevanceScore?: number;
  authorityScore?: number;
  freshnessLabel?: "recent" | "moderate" | "stale" | "unknown";
  overallScore?: number;
}

export interface ResearchConfidence {
  level: "high" | "medium" | "low";
  score: number;
  sourceCount: number;
  avgFreshness: "recent" | "moderate" | "stale" | "unknown";
  contradictionsDetected: boolean;
  unresolvedUncertainties: string[];
  premiumDataUsed: boolean;
}

export interface BriefScore {
  clarity: number;
  specificity: number;
  answerability: number;
  sourceability: number;
  deliverableCompleteness: number;
  total: number;
  grade: "A" | "B" | "C" | "D";
  weaknesses: string[];
}

export interface BriefRouting {
  recommendedMode: "pipeline" | "researcher" | "strategist";
  recommendedDepth: "quick" | "standard" | "deep";
  enrichmentLikelihood: "high" | "medium" | "low";
  candidateTemplates: string[];
  isClarificationNeeded: boolean;
  clarificationQuestions: string[];
}

export interface ProvenanceInfo {
  jobId?: string;
  agentsInvolved: string[];
  modelsUsed: { agent: string; provider: string; model: string }[];
  sourcesFetchedAt?: string;
  externalDataPurchased: boolean;
  confidenceSummary?: ResearchConfidence;
  generatedAt: string;
  durationMs?: number;
  creditsUsed?: number;
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
  /** NEW: confidence summary from source scoring */
  confidence?: ResearchConfidence;
  /** NEW: unresolved uncertainties flagged by researcher */
  uncertainties?: string[];
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
  /** NEW: brief quality score */
  score?: BriefScore;
  /** NEW: routing recommendations */
  routing?: BriefRouting;
  /** NEW: whether workspace profile was applied */
  workspaceApplied?: boolean;
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

export interface BuyerRankedCandidate {
  asset: { did: string; name: string; description: string; provider: string; price: { credits: number }; type: string };
  relevanceScore: number;
  priceValueScore: number;
  informationGainScore: number;
  compositeScore: number;
  rankReason: string;
}

export interface BuyerPurchaseRationale {
  assetId: string;
  assetName: string;
  gapFilled: string;
  whyWorthIt: string;
  expectedImprovement: string;
  priceValueScore: number;
}

export interface BuyerApprovalRequired {
  assets: BuyerRankedCandidate["asset"][];
  totalCost: number;
  reason: string;
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
  /** NEW: full provenance for this run */
  provenance?: ProvenanceInfo;
  /** NEW: job ID for async tracking */
  jobId?: string;
  /** NEW: workspace ID that was used */
  workspaceId?: string;
  /** NEW: buyer agent result with ranked candidates and rationales */
  buyerResult?: {
    discovered: PurchasedAsset[];
    purchased: PurchasedAsset[];
    totalCreditsSpent: number;
    rankedCandidates?: BuyerRankedCandidate[];
    rationales?: BuyerPurchaseRationale[];
    requiresApproval?: BuyerApprovalRequired;
  };
}
