"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Nav } from "@/components/layout/nav";
import {
  Send,
  FileText,
  Globe,
  Clock,
  Zap,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Bot,
  Sparkles,
  Search,
  LayoutList,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Volume2,
  VolumeX,
  Package,
  Settings,
  Download,
  Award,
  ChevronDown,
  CreditCard,
  GitBranch,
  PackageCheck,
  Brain,
  PenLine,
  ShoppingBag,
  ShoppingCart,
  BookOpen,
  Building2,
  MessageSquare,
  ImageIcon,
} from "lucide-react";
import { ZeroClickAd, type ZeroClickSignal } from "@/components/ui/zeroclick-ad";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { loadToolSettings, saveToolSettings, type ToolSettings } from "@/lib/tool-settings";
import { PurchasedAssetGrid } from "@/components/ui/purchased-asset-card";
import { SponsorRail } from "@/components/ui/sponsor-rail";
import { JudgeMode, type JudgePreset } from "@/components/ui/judge-mode";
import { VGSCheckoutModal } from "@/components/ui/vgs-checkout-modal";
import { WorkspaceProfilePanel } from "@/components/ui/workspace-profile-panel";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { BriefScoreCard } from "@/components/ui/brief-score-card";
import { BuyerRationalePanel } from "@/components/ui/buyer-rationale-panel";
import { ProvenanceBlockCard } from "@/components/ui/provenance-block";
import { DeliveryPackageView } from "@/components/ui/delivery-package-view";
import { EnrichmentSummaryBadge } from "@/components/ui/enrichment-summary-badge";
import { ClarificationDialog } from "@/components/ui/clarification-dialog";
import { ArtifactLibrary, saveArtifact, type ArtifactEntry } from "@/components/ui/artifact-library";
import { BuyerApprovalModal } from "@/components/ui/buyer-approval-modal";
import { ActionPanel, type ActionIntelligence } from "@/components/ui/action-panel";
import { FollowUpAssistant } from "@/components/ui/followup-assistant";
import { VisionImageBanner } from "@/components/ui/vision-image-banner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AgentCard, AgentConnector, type AgentStatus } from "@/components/ui/agent-card";
import { PipelineStages, TransactionFeed } from "@/components/ui/pipeline-stages";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState, EXAMPLE_PROMPTS } from "@/components/ui/empty-state";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { SourcesPanel } from "@/components/ui/sources-panel";
import { DocumentView } from "@/components/pages/document-view";
import { BriefView } from "@/components/pages/brief-view";
import { useTransactionStream } from "@/hooks/use-transaction-stream";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { SmartSuggestions, type InputSuggestion } from "@/components/ui/smart-suggestions";
import type { BriefRouting } from "@/lib/agent/strategist";
import type { MarketplaceAsset } from "@/lib/agent/buyer";
import type { ResearchConfidence, ProvenanceInfo, EnrichmentSummary } from "@/types/pipeline";
import type {
  ResearchSource,
  ResearchDocument,
  StructuredBrief,
  AgentTransaction,
  PipelineEvent,
  PurchasedAsset,
  PipelineResult,
  SponsorToolUsage,
} from "@/types/pipeline";
import { AGENT_CONFIG } from "@/lib/agent/config";

type ViewMode = "pipeline" | "strategist" | "researcher" | "seller";
type OutputType = "research" | "prd" | "plan" | "analysis" | "general";

const OUTPUT_TYPES: { value: OutputType; label: string; icon: typeof FileText }[] = [
  { value: "research", label: "Research Report", icon: Search },
  { value: "prd", label: "PRD", icon: FileText },
  { value: "plan", label: "Strategic Plan", icon: LayoutList },
  { value: "analysis", label: "Analysis", icon: Sparkles },
  { value: "general", label: "General", icon: Globe },
];


// ─── Ad Context Extraction ──────────────────────────────────────────
function extractAdContext(brief?: StructuredBrief, purchasedAssets?: PurchasedAsset[]): { query: string; signals: ZeroClickSignal[] } {
  if (!brief) return { query: "", signals: [] };

  const query = [brief.title, ...brief.scope.slice(0, 2)].filter(Boolean).join(" · ");

  const signals: ZeroClickSignal[] = [];

  if (brief.title) {
    signals.push({
      category: "interest",
      confidence: 0.9,
      subject: brief.title,
      relatedSubjects: brief.scope.slice(0, 4),
      sentiment: "positive",
    });
  }

  if (brief.keyQuestions.length > 0) {
    signals.push({
      category: "evaluation",
      confidence: 0.75,
      subject: brief.keyQuestions[0],
      relatedSubjects: brief.keyQuestions.slice(1, 3),
      sentiment: "neutral",
    });
  }

  if (brief.deliverables.length > 0) {
    signals.push({
      category: "recommendation_request",
      confidence: 0.8,
      subject: brief.deliverables[0],
      sentiment: "positive",
    });
  }

  // Agentic: when Buyer purchased marketplace assets, inject purchase_intent signals
  if (purchasedAssets && purchasedAssets.length > 0) {
    signals.push({
      category: "purchase_intent",
      confidence: 0.95,
      subject: purchasedAssets[0].name,
      relatedSubjects: purchasedAssets.slice(1, 4).map((a) => a.name),
      sentiment: "positive",
    });
  }

  return { query, signals };
}

// ─── Main Studio Page ───────────────────────────────────────────────
export function StudioPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useLocalStorage<ViewMode>("ab:viewMode", "pipeline");
  const [outputType, setOutputType] = useLocalStorage<OutputType>("ab:outputType", "research");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [pipelineEvents, setPipelineEvents] = useState<PipelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rightTab, setRightTab] = useState<"document" | "brief" | "purchases" | "provenance" | "delivery" | "sources">("document");
  const [bottomTab, setBottomTab] = useState<"stages" | "transactions">("stages");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [initialStats, setInitialStats] = useState<{ strategist: { earned: number; handled: number }; researcher: { earned: number; handled: number }; buyer: { earned: number; handled: number }; seller: { earned: number; handled: number } }>({
    strategist: { earned: 0, handled: 0 },
    researcher: { earned: 0, handled: 0 },
    buyer: { earned: 0, handled: 0 },
    seller: { earned: 0, handled: 0 },
  });
  const transactions = useTransactionStream();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [adsMuted, setAdsMuted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolSettings, setToolSettings] = useLocalStorage<ToolSettings>("ab:toolSettings", loadToolSettings());
  const [judgeMode, setJudgeMode] = useState(false);
  const [adToolsUsed, setAdToolsUsed] = useState<SponsorToolUsage[]>([]);
  const [workspaceId] = useState<string>("default");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Clarification dialog state
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const [clarifyRouting, setClarifyRouting] = useState<BriefRouting | undefined>(undefined);
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  // Artifact library state
  const [libraryOpen, setLibraryOpen] = useState(false);
  // Buyer approval state
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAssets, setApprovalAssets] = useState<MarketplaceAsset[]>([]);
  const [approvalCost, setApprovalCost] = useState(0);
  const [approvalReason, setApprovalReason] = useState("");
  // Clarification pre-check loading state
  const [isCheckingClarify, setIsCheckingClarify] = useState(false);
  // Action intelligence (extracted from report)
  const [actionIntelligence, setActionIntelligence] = useState<ActionIntelligence | null>(null);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  // Follow-up assistant
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState<string | undefined>(undefined);
  // Smart suggestions visible when input focused
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  // VISION agent state
  const [visionResult, setVisionResult] = useState<{ imageUrl: string; attempts: number; passedQuality: boolean; qualityScore: number; finalPrompt: string } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleAdServed = useCallback(() => {
    setAdToolsUsed((prev) => {
      if (prev.some((t) => t.tool === "zeroclick-ad")) return prev;
      return [...prev, { tool: "zeroclick-ad", label: "ZeroClick Contextual Ad Served", sponsor: "ZeroClick", timestamp: new Date().toISOString() }];
    });
  }, []);

  const handleJudgePreset = useCallback((preset: JudgePreset) => {
    setInput(preset.prompt);
    setMode(preset.mode);
    setOutputType(preset.outputType);
    // Apply tool overrides
    setToolSettings((prev) => ({
      ...prev,
      ...(preset.toolOverrides.researcher ? { researcher: { ...prev.researcher, ...preset.toolOverrides.researcher } } : {}),
      ...(preset.toolOverrides.trading ? { trading: { ...prev.trading, ...preset.toolOverrides.trading } } : {}),
    }));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("zc_ads_muted");
    if (stored === "true") setAdsMuted(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const m = params.get("mode");
    if (q) {
      setInput(decodeURIComponent(q));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (m === "strategist" || m === "researcher" || m === "seller") setMode(m);
    if (params.get("checkout") === "true") {
      setCheckoutOpen(true);
      // Clean up URL without reload
      window.history.replaceState({}, "", "/studio" + (q ? `?q=${encodeURIComponent(q)}` : "") + (m ? `${q ? "&" : "?"}mode=${m}` : ""));
    }

    // Clear legacy localStorage result so stale data never persists across visits
    try { localStorage.removeItem("ab_last_result"); } catch { /* noop */ }

    // ?fresh param = force clean slate (useful for demos)
    const isFresh = params.get("fresh") !== null;
    if (isFresh) {
      try { sessionStorage.removeItem("ab_last_result"); } catch { /* noop */ }
      window.history.replaceState({}, "", "/studio");
    }

    // Restore last result from sessionStorage (tab-scoped, not cross-visit)
    try {
      const saved = !isFresh ? sessionStorage.getItem("ab_last_result") : null;
      if (saved && !q) {
        const parsed = JSON.parse(saved) as { result: PipelineResult; input: string; mode: ViewMode };
        setResult(parsed.result);
        setInput(parsed.input);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.result.document) setRightTab("document");
        else if (parsed.result.brief) setRightTab("brief");
      }
    } catch { /* ignore corrupt data */ }
  }, []);

  const toggleAdsMuted = useCallback(() => {
    setAdsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("zc_ads_muted", String(next));
      return next;
    });
  }, []);

  const adContext = useMemo(() => extractAdContext(result?.brief, result?.purchasedAssets), [result?.brief, result?.purchasedAssets]);

  // Fetch persisted stats on mount
  useEffect(() => {
    fetch("/api/pipeline/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.agents) {
          setInitialStats({
            strategist: { earned: data.agents.strategist?.creditsEarned ?? 0, handled: data.agents.strategist?.requestsHandled ?? 0 },
            researcher: { earned: data.agents.researcher?.creditsEarned ?? 0, handled: data.agents.researcher?.requestsHandled ?? 0 },
            buyer: { earned: data.agents.buyer?.creditsEarned ?? 0, handled: data.agents.buyer?.requestsHandled ?? 0 },
            seller: { earned: data.agents.seller?.creditsEarned ?? 0, handled: data.agents.seller?.requestsHandled ?? 0 },
          });
        }
      })
      .catch(() => { /* stats unavailable */ });
  }, []);

  // Aggregate stats: initial + live SSE transactions
  const agentStats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const sum = (id: string) => completed.filter((t) => t.to.id === id).reduce((s, t) => s + t.credits, 0);
    const count = (id: string) => completed.filter((t) => t.to.id === id).length;
    return {
      strategist: { earned: initialStats.strategist.earned + sum("strategist"), handled: initialStats.strategist.handled + count("strategist") },
      researcher: { earned: initialStats.researcher.earned + sum("researcher"), handled: initialStats.researcher.handled + count("researcher") },
      buyer:      { earned: initialStats.buyer.earned      + sum("buyer"),      handled: initialStats.buyer.handled      + count("buyer") },
      seller:     { earned: initialStats.seller.earned     + sum("seller"),     handled: initialStats.seller.handled     + count("seller") },
    };
  }, [initialStats, transactions]);

  // Derive live agent statuses from pipeline events, result, mode, and settings
  const agentStatuses = useMemo((): Record<string, { status: AgentStatus; skipReason?: string }> => {
    const stages = new Set(pipelineEvents.map((e) => e.stage));
    const agents = new Set(pipelineEvents.map((e) => e.agent));

    // Not running and no result — everything is pending
    if (!isLoading && !result) {
      return {
        strategist: { status: "pending" },
        researcher: { status: "pending" },
        buyer: { status: "pending" },
        seller: { status: "pending" },
        vision: { status: "pending" },
      };
    }

    // Helper: has any event for this agent?
    const hasAgent = (a: string) => agents.has(a);
    const hasStage = (s: string) => stages.has(s);

    // --- Strategist ---
    let strategist: AgentStatus = "pending";
    let strategistSkip: string | undefined;
    if (mode === "researcher") {
      strategist = "skipped";
      strategistSkip = "Researcher-only mode";
    } else if (hasStage("strategist_complete") || result?.brief) {
      strategist = "completed";
    } else if (hasStage("strategist_working") || hasAgent("strategist")) {
      strategist = "active";
    } else if (isLoading) {
      strategist = "pending";
    }

    // --- Researcher ---
    let researcher: AgentStatus = "pending";
    let researcherSkip: string | undefined;
    if (mode === "strategist") {
      researcher = "skipped";
      researcherSkip = "Strategist-only mode";
    } else if (hasStage("researcher_followup") || hasStage("complete") || result?.document) {
      researcher = "completed";
    } else if (hasStage("researcher_working") || hasStage("researcher_evaluating") || hasStage("researcher_buying") || hasAgent("researcher")) {
      researcher = "active";
    } else if (isLoading && strategist === "completed") {
      researcher = "active";
    }

    // --- Buyer ---
    let buyer: AgentStatus = "pending";
    let buyerSkip: string | undefined;
    if (mode !== "pipeline" && mode !== "seller") {
      buyer = "skipped";
      buyerSkip = `${mode === "strategist" ? "Strategist" : "Researcher"}-only mode`;
    } else if (!toolSettings.trading.externalTrading) {
      buyer = "skipped";
      buyerSkip = "External trading disabled";
    } else if (hasStage("buyer_complete")) {
      buyer = "completed";
    } else if (result && !hasAgent("buyer") && (result.purchasedAssets?.length ?? 0) === 0) {
      buyer = "skipped";
      buyerSkip = "No enrichment needed";
    } else if (hasStage("buyer_discovering") || hasStage("buyer_purchasing") || hasAgent("buyer")) {
      buyer = "active";
    } else if (result && (result.purchasedAssets?.length ?? 0) > 0) {
      buyer = "completed";
    }

    // --- Seller ---
    let seller: AgentStatus = "pending";
    let sellerSkip: string | undefined;
    if (mode === "strategist" || mode === "researcher") {
      seller = "skipped";
      sellerSkip = `${mode === "strategist" ? "Strategist" : "Researcher"}-only mode`;
    } else if (hasStage("seller_complete") || result?.deliveryPackage) {
      seller = "completed";
    } else if (hasStage("seller_received") || hasStage("seller_planning") || hasStage("seller_fulfilling") || hasAgent("seller")) {
      seller = "active";
    } else if (isLoading && (researcher === "completed" || buyer === "completed")) {
      seller = "pending";
    }

    // --- Vision ---
    let vision: AgentStatus = "pending";
    let visionSkip: string | undefined;
    if (toolSettings.trading.visionEnabled === false) {
      vision = "skipped";
      visionSkip = "Vision disabled in settings";
    } else if (hasStage("vision_complete") || visionResult) {
      vision = "completed";
    } else if (isGeneratingImage) {
      vision = "active";
    } else if (result && !visionResult && !isGeneratingImage) {
      vision = "skipped";
      visionSkip = "Not triggered for this run";
    }

    return {
      strategist: { status: strategist, skipReason: strategistSkip },
      researcher: { status: researcher, skipReason: researcherSkip },
      buyer: { status: buyer, skipReason: buyerSkip },
      seller: { status: seller, skipReason: sellerSkip },
      vision: { status: vision, skipReason: visionSkip },
    };
  }, [pipelineEvents, isLoading, result, mode, toolSettings.trading.externalTrading, toolSettings.trading.visionEnabled, visionResult, isGeneratingImage]);

  const handleNewRequest = useCallback(() => {
    setInput("");
    setResult(null);
    setPipelineEvents([]);
    setError(null);
    setAdToolsUsed([]);
    try { sessionStorage.removeItem("ab_last_result"); } catch { /* noop */ }
    inputRef.current?.focus();
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(false);
    setError("Request cancelled");
  }, []);

  const triggerVision = useCallback(async function triggerVision(title: string, summary: string) {
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/agents/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: `${title}. ${summary.slice(0, 200)}`,
          outputContext: "research_report",
          requirements: ["Professional quality", "No text overlay", "Relevant to topic"],
          aspectRatio: "16:9",
          style: { mood: "professional" },
          calledBy: "composer",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.imageUrl) {
        setVisionResult({
          imageUrl: data.imageUrl,
          attempts: data.attempts ?? 1,
          passedQuality: data.passedQuality ?? false,
          qualityScore: data.qualityReport?.score ?? 0,
          finalPrompt: data.finalPrompt ?? "",
        });
        setAdToolsUsed((prev) => {
          const already = prev.some((t) => t.tool === "nanobanana-generate");
          if (already) return prev;
          const tools: SponsorToolUsage[] = [
            ...prev,
            {
              tool: "nanobanana-generate",
              label: "Image Generation",
              sponsor: "NanoBanana",
              timestamp: new Date().toISOString(),
              detail: `${data.attempts ?? 1} attempt${(data.attempts ?? 1) !== 1 ? "s" : ""} · score ${data.qualityReport?.score ?? "?"}/100`,
            },
          ];
          if (data.attempts > 1) {
            tools.push({
              tool: "nanobanana-judge",
              label: "Quality Judge",
              sponsor: "NanoBanana",
              timestamp: new Date().toISOString(),
              detail: `GPT-4o-mini vision · ${data.passedQuality ? "passed" : "best-of-" + data.attempts}`,
            });
          }
          return tools;
        });
        setPipelineEvents((prev) => [
          ...prev,
          {
            id: `vision-${Date.now()}`,
            timestamp: new Date().toISOString(),
            stage: "vision_complete",
            agent: "vision",
            message: `[IMAGE] Generated in ${data.attempts ?? 1} attempt${(data.attempts ?? 1) !== 1 ? "s" : ""} · quality ${data.qualityReport?.score ?? "?"}/100`,
            data: { imageUrl: data.imageUrl, passedQuality: data.passedQuality },
          },
        ]);
      }
    } catch { /* silent — vision is non-critical */ }
    finally { setIsGeneratingImage(false); }
  }, [toolSettings.trading.visionEnabled]);

  const runPipeline = useCallback(async function runPipeline(overrideInput?: string) {
    const finalInput = overrideInput ?? input;
    if (!finalInput.trim() || isLoading) return;

    setClarifyOpen(false);
    setPendingInput(null);

    const controller = new AbortController();
    abortRef.current = controller;

    // Clear any leftover timer from a previous run
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPipelineEvents([]);
    setElapsed(0);
    setVisionResult(null);
    setActionIntelligence(null);
    setAdToolsUsed([]);
    setFollowUpOpen(false);
    setFollowUpPrompt(undefined);

    // Start elapsed timer
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    // Open SSE stream
    const eventSource = new EventSource("/api/agent/events");
    eventSource.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data) as { id: string; type: string; timestamp: string; data: Record<string, unknown> };
        const mapped: PipelineEvent = {
          id: raw.id,
          timestamp: raw.timestamp,
          stage: String(raw.data?.stage ?? raw.type ?? "unknown"),
          agent: String(raw.data?.agent ?? "pipeline"),
          message: String(raw.data?.message ?? raw.type?.replace(/_/g, " ") ?? ""),
          data: raw.data,
        };
        setPipelineEvents((prev) => [...prev.slice(-49), mapped]);
      } catch { /* ignore parse errors */ }
    };

    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: finalInput.trim(),
          outputType,
          mode,
          toolSettings,
          workspaceId,
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      setResult(data);
      setActionIntelligence(null);
      if (data.events) setPipelineEvents(data.events);
      if (data.deliveryPackage) setRightTab("delivery");
      else if (data.document) setRightTab("document");
      // Auto-extract action intelligence from the composed document
      if (data.document) {
        extractActionsFromResult(data.document);
        if (data.visionResult) {
          // Server already ran VISION — apply result directly, no second call
          setVisionResult(data.visionResult);
          setAdToolsUsed((prev) => {
            if (prev.some((t) => t.tool === "nanobanana-generate")) return prev;
            const tools: SponsorToolUsage[] = [
              ...prev,
              {
                tool: "nanobanana-generate",
                label: "Image Generation",
                sponsor: "NanoBanana",
                timestamp: new Date().toISOString(),
                detail: `${data.visionResult.attempts} attempt${data.visionResult.attempts !== 1 ? "s" : ""} · score ${data.visionResult.qualityScore}/100`,
              },
            ];
            return tools;
          });
        } else if (toolSettings.trading.visionEnabled !== false) {
          // Server did not run VISION (researcher/strategist standalone modes) — run client-side
          triggerVision(data.document.title ?? finalInput, data.document.summary ?? "");
        }
      }
      else if (data.brief) setRightTab("brief");

      // Check if Buyer requires approval for next run context
      if (data.buyerResult?.requiresApproval) {
        const req = data.buyerResult.requiresApproval;
        setApprovalAssets(req.assets ?? []);
        setApprovalCost(req.totalCost ?? 0);
        setApprovalReason(req.reason ?? "Cost exceeds threshold");
        setApprovalOpen(true);
      }

      // Save to artifact library
      try {
        saveArtifact({
          input: finalInput.trim(),
          mode,
          outputType,
          title: data.document?.title ?? data.brief?.title ?? data.deliveryPackage?.title ?? finalInput.slice(0, 60),
          summary: data.document?.summary ?? data.brief?.objective ?? "",
          creditsUsed: data.totalCredits ?? 0,
          durationMs: data.totalDurationMs ?? 0,
          hasBrief: !!data.brief,
          hasDocument: !!data.document,
          hasDelivery: !!data.deliveryPackage,
          sourceCount: data.document?.sources?.length ?? 0,
          enriched: (data.purchasedAssets?.length ?? 0) > 0,
        });
      } catch { /* quota exceeded */ }

      // Persist last result to sessionStorage (tab-scoped only)
      try { sessionStorage.setItem("ab_last_result", JSON.stringify({ result: data, input: finalInput.trim(), mode })); } catch { /* quota exceeded */ }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // already handled by handleCancel
      } else {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      eventSource.close();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false);
    }
  }, [input, outputType, mode, toolSettings, workspaceId, triggerVision]);

  const extractActionsFromResult = useCallback(async function extractActionsFromResult(doc: ResearchDocument) {
    if (!doc.summary && !doc.sections?.length) return;
    setIsExtractingActions(true);
    setActionIntelligence(null);
    setFollowUpOpen(false);
    try {
      const res = await fetch("/api/pipeline/extract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.query,
          summary: doc.summary,
          sections: doc.sections?.slice(0, 6),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.actions) setActionIntelligence(data.actions);
      }
    } catch { /* silent — action extraction is non-critical */ }
    finally { setIsExtractingActions(false); }
  }, []);

  const handleSubmit = useCallback(async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Immediately clear stale output from any previous run so the UI doesn't
    // show old content while the new request is being prepared / clarified.
    setResult(null);
    setPipelineEvents([]);
    setError(null);
    setVisionResult(null);
    setActionIntelligence(null);
    setAdToolsUsed([]);

    // For pipeline/strategist mode — check if clarification is needed first
    if ((mode === "pipeline" || mode === "strategist") && input.trim().length < 40) {
      setIsCheckingClarify(true);
      try {
        const res = await fetch("/api/pipeline/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: input.trim(), outputType, workspaceId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isClarificationNeeded && data.clarificationQuestions?.length > 0) {
            setClarifyQuestions(data.clarificationQuestions);
            setClarifyRouting(data.routing);
            setPendingInput(input.trim());
            setClarifyOpen(true);
            setIsCheckingClarify(false);
            return;
          }
        }
      } catch { /* fall through to normal run on error */ } finally {
        setIsCheckingClarify(false);
      }
    }

    await runPipeline();
  }, [input, isLoading, mode, outputType, workspaceId, runPipeline]);

  // Keyboard shortcuts: Escape to cancel, Cmd/Ctrl+K to open settings
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Escape: cancel running pipeline
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        handleCancel();
      }
      // Cmd/Ctrl+K: toggle settings
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSettingsOpen((v) => !v);
      }
      // Cmd/Ctrl+N: new request (when not loading)
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isLoading) {
        e.preventDefault();
        handleNewRequest();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading]);

  function handleRestoreArtifact(entry: ArtifactEntry) {
    setInput(entry.input);
    setMode(entry.mode as ViewMode);
    setLibraryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <>
    <ClarificationDialog
      open={clarifyOpen}
      questions={clarifyQuestions}
      routing={clarifyRouting}
      onAnswer={(answers) => {
        const enriched = pendingInput
          ? `${pendingInput}\n\nContext: ${answers.filter(Boolean).join(" | ")}`
          : input;
        setInput(enriched);
        runPipeline(enriched);
      }}
      onSkip={() => runPipeline(pendingInput ?? undefined)}
    />
    <ArtifactLibrary
      open={libraryOpen}
      onClose={() => setLibraryOpen(false)}
      onRestore={handleRestoreArtifact}
    />
    <BuyerApprovalModal
      open={approvalOpen}
      assets={approvalAssets}
      totalCost={approvalCost}
      reason={approvalReason}
      onApprove={() => setApprovalOpen(false)}
      onDeny={() => setApprovalOpen(false)}
    />
    <SettingsPanel
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      settings={toolSettings}
      onChange={(next) => {
        setToolSettings(next);
        saveToolSettings(next);
      }}
    />
    <div className="flex h-screen flex-col" style={{ background: "var(--bg-base)" }}>
      <Nav />

      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar toggle (mobile) */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-expanded={sidebarOpen}
          className="absolute left-3 top-[68px] z-20 flex size-8 items-center justify-center rounded-lg lg:hidden"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
        >
          {sidebarOpen ? <PanelLeftClose size={14} style={{ color: "var(--gray-400)" }} /> : <PanelLeftOpen size={14} style={{ color: "var(--gray-400)" }} />}
        </button>

        {/* Mobile backdrop — tap outside to close sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/30 backdrop-blur-[1px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── LEFT PANE: Controls ── */}
        <div
          className={`flex w-[380px] max-lg:w-full shrink-0 flex-col border-r transition-all duration-200 max-lg:absolute max-lg:inset-y-14 max-lg:left-0 max-lg:z-20 ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
          style={{ borderColor: "var(--border-default)", background: "var(--bg-base)" }}
        >

          {/* Agent flow + output type + settings — single bar */}
          <div className="border-b px-3 py-2.5" style={{ borderColor: "var(--border-default)" }}>
            {/* Agent flow row */}
            <div className="flex items-center gap-0.5">
              {([
                { key: "strategist", label: "Interpret", config: AGENT_CONFIG.strategist },
                { key: "researcher", label: "Compose", config: AGENT_CONFIG.researcher },
                { key: "buyer", label: "Enrich", config: AGENT_CONFIG.buyer },
                { key: "seller", label: "Deliver", config: AGENT_CONFIG.seller },
                { key: "vision", label: "Image", config: AGENT_CONFIG.vision },
              ] as const).map((agent, i, arr) => {
                const s = agentStatuses[agent.key];
                const isActive = s.status === "active";
                const isDone = s.status === "completed";
                const isSkipped = s.status === "skipped";
                const dotColor = isDone ? "#22C55E" : isActive ? agent.config.color : isSkipped ? "var(--gray-300)" : "var(--gray-400)";
                return (
                  <div key={agent.key} className="flex items-center gap-0.5">
                    <div
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all duration-300"
                      style={{
                        background: isActive ? `${agent.config.color}14` : isDone ? "rgba(34,197,94,0.06)" : "transparent",
                        border: isActive ? `1px solid ${agent.config.color}30` : "1px solid transparent",
                        opacity: isSkipped ? 0.35 : 1,
                      }}
                      title={s.skipReason || agent.label}
                    >
                      {isActive ? (
                        <span className="relative flex size-2 shrink-0">
                          <span className="absolute inline-flex size-full animate-ping rounded-full opacity-50" style={{ background: agent.config.color }} />
                          <span className="relative inline-flex size-2 rounded-full" style={{ background: agent.config.color }} />
                        </span>
                      ) : isDone ? (
                        <CheckCircle2 size={10} style={{ color: "#22C55E" }} />
                      ) : (
                        <span className="flex size-2 shrink-0 rounded-full" style={{ background: dotColor }} />
                      )}
                      <span
                        className="font-mono text-[9px] font-semibold"
                        style={{ color: isActive ? agent.config.color : isDone ? "#22C55E" : "var(--gray-400)" }}
                      >
                        {agent.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <ArrowRight size={8} style={{ color: isDone ? "rgba(34,197,94,0.4)" : "var(--gray-250)", flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
              <div className="ml-auto flex items-center gap-1">
                {mode !== "pipeline" && (
                  <button
                    onClick={() => setMode("pipeline")}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[8px] transition-all hover:opacity-80"
                    style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <RefreshCw size={8} /> Full
                  </button>
                )}
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  title="Tool Settings"
                >
                  <Settings size={10} />
                </button>
              </div>
            </div>
            {/* Output type chips */}
            {mode !== "researcher" && (
              <div className="flex flex-wrap gap-1 mt-2">
                {OUTPUT_TYPES.map((ot) => {
                  const active = outputType === ot.value;
                  return (
                    <button
                      key={ot.value}
                      onClick={() => setOutputType(ot.value)}
                      className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-medium transition-all duration-150"
                      style={{
                        background: active ? "rgba(201, 125, 78, 0.10)" : "transparent",
                        border: `1px solid ${active ? "rgba(201, 125, 78, 0.22)" : "var(--border-default)"}`,
                        color: active ? "var(--accent-400)" : "var(--gray-500)",
                      }}
                    >
                      <ot.icon size={9} />
                      {ot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── PRIMARY ACTION: Cost estimate + Input ── */}
          <div className="border-b p-3" style={{ borderColor: "var(--border-default)" }}>
            {input.trim() && !isLoading && (
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md px-2 py-0.5 font-mono text-[9px]" style={{ background: "rgba(201,125,78,0.08)", border: "1px solid rgba(201,125,78,0.18)", color: "var(--accent-400)" }}>
                  ~{mode === "pipeline" ? "6–16" : mode === "seller" ? "6–16" : mode === "researcher" ? "1–10" : "1"} credits
                </span>
                <span className="text-[9px]" style={{ color: "var(--gray-300)" }}>estimated cost</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  aria-label="Describe your request"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={
                    mode === "researcher"
                      ? "What should the Composer research and write?"
                      : mode === "seller"
                      ? "Describe what the buyer ordered…"
                      : mode === "strategist"
                      ? "What should the Interpreter structure into a brief?"
                      : "Describe what you need. The full pipeline handles the rest."
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl px-4 py-3 pr-12 text-[13px] leading-relaxed outline-none transition-all duration-200"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-800)", caretColor: "var(--accent-400)" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.08)";
                    setSuggestionsVisible(true);
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.boxShadow = "none";
                    setTimeout(() => setSuggestionsVisible(false), 200);
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isCheckingClarify}
                  aria-label={isCheckingClarify ? "Checking brief quality…" : "Send request"}
                  className="absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                  style={{ background: isCheckingClarify ? "rgba(124,58,237,0.7)" : "linear-gradient(135deg, var(--accent-600), var(--accent-400))", boxShadow: "0 2px 8px -2px rgba(201,125,78,0.25)" }}
                >
                  {isLoading || isCheckingClarify ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                </button>
                {isCheckingClarify && (
                  <div className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-md px-2 py-1" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
                    <Loader2 size={9} className="animate-spin" style={{ color: "#7C3AED" }} />
                    <span className="font-mono text-[9px]" style={{ color: "#7C3AED" }}>checking brief quality…</span>
                  </div>
                )}
              </div>
              {/* Smart suggestions — appear on focus when typing */}
              {suggestionsVisible && !isLoading && (
                <div className="mt-2">
                  <SmartSuggestions
                    input={input}
                    workspaceMarket={undefined}
                    visible={suggestionsVisible && !isLoading}
                    onApply={(suggestion) => {
                      const modeMap: Record<string, ViewMode> = {
                        pipeline: "pipeline",
                        researcher: "researcher",
                        strategist: "strategist",
                        seller: "seller",
                      };
                      const newMode = modeMap[suggestion.mode] ?? mode;
                      setMode(newMode);
                      const typeMap: Record<string, OutputType> = {
                        research: "research",
                        analysis: "analysis",
                        plan: "plan",
                        spec: "prd",
                        brief: "general",
                        report: "research",
                        comparison: "analysis",
                      };
                      setOutputType((typeMap[suggestion.outputType] ?? outputType) as OutputType);
                      setSuggestionsVisible(false);
                      inputRef.current?.focus();
                    }}
                  />
                </div>
              )}
              {error && (
                <div className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[12px] font-medium" style={{ color: "#EF4444" }}>{error}</p>
                      {pipelineEvents.length > 0 && (
                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--gray-400)" }}>
                          Failed after {pipelineEvents.length} stage{pipelineEvents.length !== 1 ? "s" : ""}
                          {elapsed > 0 && ` · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleSubmit as unknown as React.MouseEventHandler}
                      className="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[10px] transition-all hover:opacity-80"
                      style={{ background: "rgba(201,125,78,0.10)", border: "1px solid rgba(201,125,78,0.22)", color: "var(--accent-400)" }}
                    >
                      <RefreshCw size={10} /> Retry
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Agent Cards — collapsible, secondary to prompt */}
          <details className="border-b group" style={{ borderColor: "var(--border-default)" }}>
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 select-none" style={{ color: "var(--gray-400)" }}>
              <ChevronDown size={10} className="transition-transform group-open:rotate-180" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-widest">Agents</span>
              <span className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.preventDefault(); setLibraryOpen(true); }}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{ color: "var(--gray-400)", background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  title="Artifact Library"
                >
                  <BookOpen size={9} /> library
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); setJudgeMode((v) => !v); }}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] transition-all hover:opacity-80"
                  style={{
                    color: judgeMode ? "var(--accent-400)" : "var(--gray-400)",
                    background: judgeMode ? "rgba(201, 125, 78, 0.10)" : "var(--bg-surface)",
                    border: `1px solid ${judgeMode ? "rgba(201, 125, 78, 0.22)" : "var(--border-default)"}`,
                  }}
                  title="Judge Presets"
                >
                  <Award size={9} /> judge
                </button>
              </span>
            </summary>
            <div className="flex flex-col gap-0 px-3 pb-3">
              <AgentCard
                agent={AGENT_CONFIG.strategist}
                isActive={agentStatuses.strategist.status === "active"}
                isSelected={mode === "strategist"}
                onClick={() => setMode(mode === "strategist" ? "pipeline" : "strategist")}
                stats={agentStats.strategist}
                toolLabel={toolSettings.strategist.search}
                index={0}
                status={agentStatuses.strategist.status}
                skipReason={agentStatuses.strategist.skipReason}
              />
              {mode === "pipeline" && (
                <AgentConnector
                  isActive={agentStatuses.strategist.status === "active" || agentStatuses.researcher.status === "active"}
                  color={agentStatuses.strategist.status === "completed" ? "#22C55E" : AGENT_CONFIG.strategist.color}
                />
              )}
              <AgentCard
                agent={AGENT_CONFIG.researcher}
                isActive={agentStatuses.researcher.status === "active"}
                isSelected={mode === "researcher"}
                onClick={() => setMode(mode === "researcher" ? "pipeline" : "researcher")}
                stats={agentStats.researcher}
                toolLabel={toolSettings.researcher.search}
                index={1}
                status={agentStatuses.researcher.status}
                skipReason={agentStatuses.researcher.skipReason}
              />
              {mode === "pipeline" && (
                <AgentConnector
                  isActive={agentStatuses.researcher.status === "active" || agentStatuses.buyer.status === "active"}
                  color={agentStatuses.researcher.status === "completed" ? "#22C55E" : AGENT_CONFIG.researcher.color}
                />
              )}
              <AgentCard
                agent={AGENT_CONFIG.buyer}
                isActive={agentStatuses.buyer.status === "active"}
                isSelected={false}
                onClick={() => {}}
                stats={agentStats.buyer}
                toolLabel="nevermined"
                index={2}
                status={agentStatuses.buyer.status}
                skipReason={agentStatuses.buyer.skipReason}
              />
              {mode === "pipeline" && (
                <AgentConnector
                  isActive={agentStatuses.seller.status === "active"}
                  color={agentStatuses.buyer.status === "skipped" ? "var(--gray-200)" : agentStatuses.buyer.status === "completed" ? "#22C55E" : AGENT_CONFIG.buyer.color}
                />
              )}
              <AgentCard
                agent={AGENT_CONFIG.seller}
                isActive={agentStatuses.seller.status === "active"}
                isSelected={mode === "seller"}
                onClick={() => setMode(mode === "seller" ? "pipeline" : "seller")}
                stats={agentStats.seller}
                toolLabel="nevermined"
                index={3}
                status={agentStatuses.seller.status}
                skipReason={agentStatuses.seller.skipReason}
              />
              {mode === "pipeline" && (
                <>
                  <AgentConnector
                    isActive={agentStatuses.vision.status === "active"}
                    color={agentStatuses.vision.status === "skipped" ? "var(--gray-200)" : agentStatuses.vision.status === "completed" ? "#22C55E" : AGENT_CONFIG.vision.color}
                  />
                  <AgentCard
                    agent={AGENT_CONFIG.vision}
                    isActive={agentStatuses.vision.status === "active"}
                    isSelected={false}
                    onClick={() => {}}
                    stats={{ earned: 0, handled: visionResult ? 1 : 0 }}
                    toolLabel="nanobanana"
                    index={4}
                    status={agentStatuses.vision.status}
                    skipReason={agentStatuses.vision.skipReason}
                  />
                </>
              )}
            </div>
          </details>

          {/* Judge Mode Presets — collapsed into details for cleanliness */}
          {judgeMode && (
            <div className="border-b p-3" style={{ borderColor: "var(--border-default)", background: "rgba(201, 125, 78, 0.02)" }}>
              <JudgeMode onSelect={handleJudgePreset} />
            </div>
          )}

          {/* Seller marketplace-off info banner */}
          {mode === "seller" && !toolSettings.trading.externalTrading && (
            <div
              className="flex items-start gap-2.5 border-b px-3 py-2"
              style={{ borderColor: "var(--border-default)", background: "rgba(99,102,241,0.05)" }}
            >
              <span
                className="mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold"
                style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.22)" }}
              >
                INFO
              </span>
              <p className="text-[10px] leading-snug" style={{ color: "#6366F1" }}>
                External Marketplace is off. The Buyer will evaluate enrichment but not transact. Enable <span className="font-semibold">External Marketplace</span> in Settings to allow third-party procurement.
              </p>
            </div>
          )}

          {/* Bottom section: Stages / Transactions toggle */}
          <div role="tablist" className="flex border-b" style={{ borderColor: "var(--border-default)" }}>
            {(["stages", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={bottomTab === tab}
                onClick={() => setBottomTab(tab)}
                className="flex-1 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors"
                style={{
                  color: bottomTab === tab ? "var(--accent-400)" : "var(--gray-400)",
                  borderBottom: bottomTab === tab ? "2px solid var(--accent-400)" : "2px solid transparent",
                }}
              >
                {tab === "stages" ? "Job & Events" : `Transactions (${transactions.length})`}
              </button>
            ))}
          </div>

          {/* Bottom panel content */}
          <div className="flex-1 overflow-hidden scrollbar-thin">
            {bottomTab === "stages" ? (
              <PipelineStages events={pipelineEvents} isRunning={isLoading} />
            ) : (
              <TransactionFeed transactions={transactions} />
            )}
          </div>

          {/* Stats bar */}
          <div
            className="flex items-center gap-3 border-t px-3 py-2 overflow-x-auto scrollbar-hide"
            style={{ borderColor: "var(--border-default)", background: "var(--bg-surface)", boxShadow: "0 -1px 3px rgba(0,0,0,0.02)" }}
          >
            <div className="flex items-center gap-1.5" title="Credits used">
              <Zap size={10} style={{ color: "var(--accent-400)" }} />
              <span className="font-mono text-[9px] font-medium" style={{ color: "var(--gray-500)" }}>
                {result?.totalCredits ?? 0}cr
              </span>
            </div>
            <div className="h-2.5 w-px" style={{ background: "var(--border-default)" }} />
            <div className="flex items-center gap-1.5" title="Duration">
              <Clock size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.totalDurationMs ? `${(result.totalDurationMs / 1000).toFixed(1)}s` : "—"}
              </span>
            </div>
            <div className="h-2.5 w-px" style={{ background: "var(--border-default)" }} />
            <div className="flex items-center gap-1.5" title="Sources">
              <Globe size={10} style={{ color: "var(--gray-400)" }} />
              <span className="font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                {result?.document?.sources.length ?? 0} sources
              </span>
            </div>
            {result?.enrichmentSummary && (
              <>
                <div className="h-2.5 w-px" style={{ background: "var(--border-default)" }} />
                <EnrichmentSummaryBadge
                  summary={result.enrichmentSummary as EnrichmentSummary}
                  compact={true}
                  expandable={false}
                />
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setCheckoutOpen(true)}
                title="Buy credits"
                className="flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(201, 125, 78, 0.08)",
                  border: "1px solid rgba(201, 125, 78, 0.18)",
                  color: "var(--accent-400)",
                }}
              >
                <CreditCard size={10} />
                <span>buy credits</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: Output ── */}
        <ErrorBoundary>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div role="tablist" className="flex items-center gap-1 border-b px-3 py-1.5 overflow-x-auto scrollbar-hide" style={{ borderColor: "var(--border-default)" }}>
            {result?.document && (
              <button
                role="tab"
                aria-selected={rightTab === "document"}
                onClick={() => setRightTab("document")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "document" ? AGENT_CONFIG.researcher.color : "var(--gray-400)",
                  background: rightTab === "document" ? `${AGENT_CONFIG.researcher.color}10` : "transparent",
                }}
              >
                <FileText size={12} /> Report
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px]"
                  style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9" }}
                >
                  Composer
                </span>
              </button>
            )}
            {result?.brief && (
              <button
                role="tab"
                aria-selected={rightTab === "brief"}
                onClick={() => setRightTab("brief")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "brief" ? AGENT_CONFIG.strategist.color : "var(--gray-400)",
                  background: rightTab === "brief" ? `${AGENT_CONFIG.strategist.color}10` : "transparent",
                }}
              >
                <Sparkles size={12} /> Brief
              </button>
            )}
            {(result?.purchasedAssets?.length ?? 0) > 0 && (
              <button
                role="tab"
                aria-selected={rightTab === "purchases"}
                onClick={() => setRightTab("purchases")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "purchases" ? AGENT_CONFIG.buyer.color : "var(--gray-400)",
                  background: rightTab === "purchases" ? `${AGENT_CONFIG.buyer.color}10` : "transparent",
                }}
              >
                <Package size={12} /> Purchases ({result?.purchasedAssets?.length})
              </button>
            )}
            {result?.deliveryPackage && (
              <button
                role="tab"
                aria-selected={rightTab === "delivery"}
                onClick={() => setRightTab("delivery")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "delivery" ? AGENT_CONFIG.seller.color : "var(--gray-400)",
                  background: rightTab === "delivery" ? `${AGENT_CONFIG.seller.color}10` : "transparent",
                }}
              >
                <PackageCheck size={12} /> Delivery
                <span
                  className="rounded px-1 py-0.5 font-mono text-[7px]"
                  style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}
                >
                  Seller
                </span>
                {result.deliveryPackage.qualityGate.passed ? (
                  <span className="ml-0.5 size-1.5 rounded-full" style={{ background: "#22C55E", display: "inline-block" }} />
                ) : (
                  <span className="ml-0.5 size-1.5 rounded-full" style={{ background: "#EF4444", display: "inline-block" }} />
                )}
              </button>
            )}
            {result && (
              <button
                role="tab"
                aria-selected={rightTab === "provenance"}
                onClick={() => setRightTab("provenance")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "provenance" ? "#818CF8" : "var(--gray-400)",
                  background: rightTab === "provenance" ? "rgba(99,102,241,0.10)" : "transparent",
                }}
              >
                <GitBranch size={12} /> Provenance
              </button>
            )}
            {result?.document?.sources?.length ? (
              <button
                role="tab"
                aria-selected={rightTab === "sources"}
                onClick={() => setRightTab("sources")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === "sources" ? "#0EA5E9" : "var(--gray-400)",
                  background: rightTab === "sources" ? "rgba(14,165,233,0.10)" : "transparent",
                }}
              >
                <Globe size={12} /> Sources
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[7px] font-bold"
                  style={{ background: "rgba(14,165,233,0.12)", color: "#0EA5E9" }}
                >
                  {result.document.sources.length}
                </span>
              </button>
            ) : null}
            {(actionIntelligence || isExtractingActions) && (
              <button
                role="tab"
                aria-selected={rightTab === ("actions" as typeof rightTab)}
                onClick={() => setRightTab("actions" as typeof rightTab)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-semibold transition-all duration-150"
                style={{
                  color: rightTab === ("actions" as typeof rightTab) ? "var(--accent-400)" : "var(--gray-400)",
                  background: rightTab === ("actions" as typeof rightTab) ? "rgba(201,125,78,0.10)" : "transparent",
                }}
              >
                {isExtractingActions ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                Actions
                {actionIntelligence && (
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-[7px] font-bold" style={{ background: "rgba(201,125,78,0.15)", color: "var(--accent-400)" }}>
                    {Object.values(actionIntelligence).reduce((s, a) => s + a.length, 0)}
                  </span>
                )}
              </button>
            )}

            {/* Follow-up + New Request buttons */}
            <div className="ml-auto flex items-center gap-1.5">
              {result?.document && (
                <button
                  onClick={() => { setFollowUpOpen((v) => !v); setFollowUpPrompt(undefined); }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150"
                  style={{
                    background: followUpOpen ? "rgba(14,165,233,0.10)" : "var(--bg-surface)",
                    border: `1px solid ${followUpOpen ? "rgba(14,165,233,0.25)" : "var(--border-default)"}`,
                    color: followUpOpen ? "#0EA5E9" : "var(--gray-500)",
                  }}
                >
                  <MessageSquare size={11} /> Ask
                </button>
              )}
              {(result || isLoading) && (
                <button
                  onClick={handleNewRequest}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150 hover:scale-[1.02] disabled:opacity-30"
                  style={{
                    background: result ? "rgba(201, 125, 78, 0.08)" : "var(--bg-surface)",
                    border: result ? "1px solid rgba(201, 125, 78, 0.20)" : "1px solid var(--border-default)",
                    color: result ? "var(--accent-400)" : "var(--gray-500)",
                  }}
                >
                  <RotateCcw size={11} /> New Request
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <LoadingSkeleton mode={mode} events={pipelineEvents} elapsed={elapsed} onCancel={handleCancel} />
            ) : !result ? (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            ) : rightTab === "document" && result.document ? (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <DocumentView
                    doc={result.document}
                    adQuery={adContext.query || result.brief?.title || result.document?.query}
                    adSignals={adContext.signals}
                    adsMuted={adsMuted}
                    onAdServed={handleAdServed}
                    visionResult={visionResult}
                    isGeneratingImage={isGeneratingImage}
                    toolsUsed={result.toolsUsed ?? result.document?.toolsUsed}
                  />
                </div>
                {/* Action panel + follow-up below document */}
                {(actionIntelligence || followUpOpen) && (
                  <div className="shrink-0 space-y-2 overflow-y-auto border-t p-4" style={{ borderColor: "var(--border-default)", maxHeight: "400px" }}>
                    {actionIntelligence && (
                      <ActionPanel
                        actions={actionIntelligence}
                        reportTitle={result.document.query}
                        onFollowUp={(prompt) => {
                          setFollowUpPrompt(prompt);
                          setFollowUpOpen(true);
                        }}
                      />
                    )}
                    {followUpOpen && (
                      <FollowUpAssistant
                        reportTitle={result.document.query}
                        reportSummary={result.document.summary}
                        reportContent={result.document.sections?.map((s) => `## ${s.heading}\n${s.content}`).join("\n\n")}
                        initialPrompt={followUpPrompt}
                        onClose={() => setFollowUpOpen(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : rightTab === "brief" && result.brief ? (
              <BriefView brief={result.brief} adsMuted={adsMuted} onAdServed={handleAdServed} />
            ) : rightTab === "purchases" && result.purchasedAssets?.length ? (
              <div className="h-full overflow-y-auto p-6 space-y-5">
                {/* Buyer Intelligence panel — ranking + rationale */}
                {(result as PipelineResult & { buyerResult?: { rankedCandidates?: import("@/components/ui/buyer-rationale-panel").RankedAsset[]; rationales?: import("@/components/ui/buyer-rationale-panel").PurchaseRationale[]; requiresApproval?: import("@/components/ui/buyer-rationale-panel").RequiresApproval; totalCreditsSpent?: number } }).buyerResult && (
                  <BuyerRationalePanel
                    rankedCandidates={(result as PipelineResult & { buyerResult?: { rankedCandidates?: import("@/components/ui/buyer-rationale-panel").RankedAsset[] } }).buyerResult?.rankedCandidates}
                    rationales={(result as PipelineResult & { buyerResult?: { rationales?: import("@/components/ui/buyer-rationale-panel").PurchaseRationale[] } }).buyerResult?.rationales}
                    requiresApproval={(result as PipelineResult & { buyerResult?: { requiresApproval?: import("@/components/ui/buyer-rationale-panel").RequiresApproval } }).buyerResult?.requiresApproval}
                    totalCreditsSpent={(result as PipelineResult & { buyerResult?: { totalCreditsSpent?: number } }).buyerResult?.totalCreditsSpent}
                  />
                )}
                <PurchasedAssetGrid assets={result.purchasedAssets} />
                <ZeroClickAd
                  query={result.brief?.title || result.document?.query || input}
                  muted={adsMuted}
                  signals={[{ category: "purchase_intent" as const, confidence: 0.85, subject: result.purchasedAssets[0]?.name || "marketplace asset", sentiment: "positive" as const }]}
                  onAdServed={handleAdServed}
                />
              </div>
            ) : rightTab === "delivery" && result?.deliveryPackage ? (
              <DeliveryPackageView
                pkg={result.deliveryPackage as import("@/lib/agent/seller").DeliveryPackage}
                enrichmentSummary={result.enrichmentSummary as EnrichmentSummary | undefined}
              />
            ) : rightTab === "provenance" ? (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                {/* Agent chain timeline */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <p className="mb-3 font-mono text-[8px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                    Agent chain
                  </p>
                  <div className="flex flex-col gap-0">
                    {[
                      { agent: "Seller", role: "Intake & payment", color: "#EF4444", icon: ShoppingCart, always: true },
                      { agent: "Interpreter", role: "Structured brief", color: "#7C3AED", icon: Brain, always: !!result.brief },
                      { agent: "Composer", role: "Document composed", color: "#0EA5E9", icon: PenLine, always: !!result.document },
                      { agent: "Buyer", role: "Enrichment", color: "#F59E0B", icon: ShoppingBag, always: (result.purchasedAssets?.length ?? 0) > 0, optional: true },
                      { agent: "Seller", role: "Quality gate + delivery", color: "#EF4444", icon: PackageCheck, always: !!result.deliveryPackage },
                    ].map((step, i, arr) => {
                      if (!step.always && !step.optional) return null;
                      const skipped = step.optional && !step.always;
                      return (
                        <div key={`${step.agent}-${i}`}>
                          <div className="flex items-center gap-3 py-2">
                            <div
                              className="flex size-6 shrink-0 items-center justify-center rounded-md"
                              style={{
                                background: skipped ? "var(--bg-elevated)" : `${step.color}12`,
                                border: `1px solid ${skipped ? "var(--border-default)" : `${step.color}25`}`,
                                opacity: skipped ? 0.4 : 1,
                              }}
                            >
                              <step.icon size={11} style={{ color: skipped ? "var(--gray-400)" : step.color }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-semibold" style={{ color: skipped ? "var(--gray-400)" : step.color }}>
                                  {step.agent}
                                </span>
                                <span className="text-[10px]" style={{ color: "var(--gray-500)" }}>{step.role}</span>
                                {skipped && (
                                  <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>skipped</span>
                                )}
                                {step.agent === "Interpreter" && result.brief && (
                                  <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                    {result.brief.creditsUsed}cr · {(result.brief.durationMs / 1000).toFixed(1)}s
                                  </span>
                                )}
                                {step.agent === "Composer" && result.document && (
                                  <span className="ml-auto font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                    {result.document.creditsUsed}cr · {(result.document.durationMs / 1000).toFixed(1)}s · {result.document.sources.length} sources
                                  </span>
                                )}
                              </div>
                              {step.agent === "Interpreter" && result.brief && (
                                <p className="mt-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                  {result.brief.provider}/{result.brief.model}
                                </p>
                              )}
                              {step.agent === "Composer" && result.document && (
                                <p className="mt-0.5 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                  {result.document.provider}/{result.document.model}
                                </p>
                              )}
                            </div>
                          </div>
                          {i < arr.length - 1 && (
                            <div className="ml-[11px] h-3 w-px" style={{ background: "var(--border-default)" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {result.enrichmentSummary && (
                  <EnrichmentSummaryBadge
                    summary={result.enrichmentSummary as EnrichmentSummary}
                    expandable={true}
                  />
                )}
                {result.provenance && (
                  <ProvenanceBlockCard provenance={result.provenance as ProvenanceInfo} />
                )}
                {result.buyerResult && (
                  <BuyerRationalePanel
                    rankedCandidates={result.buyerResult.rankedCandidates}
                    rationales={result.buyerResult.rationales}
                    requiresApproval={result.buyerResult.requiresApproval}
                    totalCreditsSpent={result.buyerResult.totalCreditsSpent}
                  />
                )}
              </div>
            ) : rightTab === "sources" && result?.document?.sources?.length ? (
              <div className="h-full overflow-y-auto p-4">
                <SourcesPanel
                  sources={result.document.sources}
                  toolsUsed={result.toolsUsed ?? result.document.toolsUsed}
                />
              </div>
            ) : (
              <EmptyState mode={mode} onExample={(p) => { setInput(p); setTimeout(() => inputRef.current?.focus(), 50); }} />
            )}
          </div>
        </div>
        </ErrorBoundary>
      </div>
    </div>
    <VGSCheckoutModal
      open={checkoutOpen}
      onClose={() => setCheckoutOpen(false)}
      onSuccess={(_credits, _paymentId) => {
        setCheckoutOpen(false);
      }}
    />
    </>
  );
}

