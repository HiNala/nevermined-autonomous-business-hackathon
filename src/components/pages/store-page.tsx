"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadToolSettings, type ToolSettings } from "@/lib/tool-settings";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import {
  Store,
  Package,
  Tag,
  CreditCard,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Globe,
  Sparkles,
  Bot,
  ExternalLink,
  RefreshCw,
  Search,
  Brain,
  PenLine,
  ShoppingBag,
  PackageCheck,
  Zap,
  FileText,
  ChevronDown,
} from "lucide-react";
import { ZeroClickAd } from "@/components/ui/zeroclick-ad";
import { VGSCheckoutModal } from "@/components/ui/vgs-checkout-modal";
import { EnrichmentSummaryBadge } from "@/components/ui/enrichment-summary-badge";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import type { EnrichmentSummary } from "@/types/pipeline";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

// ─── Types ───────────────────────────────────────────────────────────

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
  outputType: string;
  mayRequireExternalData: boolean;
}

interface ThirdPartyServiceItem {
  id: string;
  did: string;
  name: string;
  description: string;
  provider: string;
  priceCredits: number;
  type: string;
  tags: string[];
  updatedAt: string;
}

interface InventoryData {
  products: CatalogProduct[];
  thirdPartyServices: ThirdPartyServiceItem[];
  counts: { products: number; thirdPartyServices: number };
}

interface OrderResult {
  status: string;
  orderId: string;
  product: { id: string; name: string };
  fulfillmentPlan: { reasoning: string; usedExternalData: boolean };
  document?: { title: string; summary: string; sections: { heading: string; content: string }[]; sources: { url: string; title: string }[] };
  totalCredits: number;
  totalDurationMs: number;
  enrichmentSummary?: EnrichmentSummary;
}

// ─── Category config ─────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, typeof Package> = {
  research_report: Globe,
  market_analysis: Sparkles,
  competitive_intel: Bot,
  strategic_plan: ArrowRight,
  prd: Package,
  technical_report: Tag,
  custom: Store,
};

const CATEGORY_COLORS: Record<string, string> = {
  research_report: "#0EA5E9",
  market_analysis: "#7C3AED",
  competitive_intel: "#EF4444",
  strategic_plan: "#F59E0B",
  prd: "#10B981",
  technical_report: "#6366F1",
  custom: "#c97d4e",
};

const CATEGORY_LABELS: Record<string, string> = {
  research_report: "Research Report",
  market_analysis: "Market Analysis",
  competitive_intel: "Competitive Intel",
  strategic_plan: "Strategic Plan",
  prd: "PRD",
  technical_report: "Technical Report",
  custom: "Custom",
};

// ─── How-it-works steps ──────────────────────────────────────────────
const HOW_IT_WORKS = [
  { step: "01", label: "Pick a product", desc: "Browse the catalog — research, analysis, competitive intel, strategic plans.", color: "#EF4444" },
  { step: "02", label: "Describe the scope", desc: "Add a short brief. The Interpreter structures it into a precise execution plan.", color: "#7C3AED" },
  { step: "03", label: "Agents build it", desc: "Composer researches, Buyer enriches with marketplace data, Seller quality-gates.", color: "#0EA5E9" },
  { step: "04", label: "Receive your report", desc: "Delivered in Markdown, summary, and JSON. Saved to your artifact library.", color: "#F59E0B" },
];

// ─── Product Card ────────────────────────────────────────────────────

function ProductCard({
  product,
  onOrder,
  isOrdering,
  externalTrading,
}: {
  product: CatalogProduct;
  onOrder: (product: CatalogProduct) => void;
  isOrdering: boolean;
  externalTrading: boolean;
}) {
  const Icon = CATEGORY_ICONS[product.category] ?? Package;
  const accentColor = CATEGORY_COLORS[product.category] ?? "#c97d4e";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      className="group relative flex flex-col rounded-xl border p-5 cursor-default"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-default)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px -8px ${accentColor}28, 0 2px 8px rgba(0,0,0,0.06)`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}35`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
      }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: `linear-gradient(90deg, ${accentColor}60, ${accentColor}20)` }} />
      {/* Category badge */}
      <div className="mt-2 mb-3 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase"
          style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}25` }}
        >
          <Icon size={10} />
          {CATEGORY_LABELS[product.category] ?? product.category}
        </div>
        <div
          className="rounded-md px-2 py-1 font-mono text-[11px] font-bold"
          style={{ background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}20` }}
        >
          {product.price} cr
        </div>
      </div>

      {/* Title + description */}
      <h3
        className="mb-1.5 text-[15px] font-semibold leading-snug"
        style={{ color: "var(--gray-900)" }}
      >
        {product.name}
      </h3>
      <p
        className="mb-4 flex-1 text-[12px] leading-relaxed"
        style={{ color: "var(--gray-500)" }}
      >
        {product.description}
      </p>

      {/* Agent flow mini-map */}
      <div
        className="mb-4 rounded-lg px-3 py-2.5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <p className="mb-1.5 font-mono text-[7px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
          Pipeline
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { label: "Interpreter", icon: Brain, color: "#7C3AED" },
            { label: "Composer", icon: PenLine, color: "#0EA5E9" },
            ...(product.mayRequireExternalData
              ? [{ label: "Buyer", icon: ShoppingBag, color: "#F59E0B", optional: true }]
              : []),
            { label: "Seller", icon: PackageCheck, color: "#EF4444" },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-1">
              <div
                className="flex items-center gap-1 rounded px-1.5 py-0.5"
                style={{
                  background: `${step.color}10`,
                  border: `1px solid ${step.color}25`,
                  opacity: (step as { optional?: boolean }).optional ? 0.75 : 1,
                }}
              >
                <step.icon size={8} style={{ color: step.color }} />
                <span className="font-mono text-[8px] font-semibold" style={{ color: step.color }}>
                  {step.label}
                  {(step as { optional?: boolean }).optional && <span className="opacity-60"> opt</span>}
                </span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={8} style={{ color: "var(--gray-300)" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {product.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 font-mono text-[9px]"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Order button */}
      <button
        onClick={() => onOrder(product)}
        disabled={isOrdering}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50 btn-press"
        style={{
          background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
          color: "white",
          boxShadow: `0 2px 12px -4px ${accentColor}40`,
        }}
      >
        {isOrdering ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <ShoppingCart size={12} />
            Order Now
          </>
        )}
      </button>

      {/* Enrichment demo notice when externalTrading is off */}
      {product.mayRequireExternalData && !externalTrading && (
        <div
          className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)" }}
        >
          <span className="shrink-0 font-mono text-[8px] font-bold" style={{ color: "#6366F1" }}>DEMO</span>
          <p className="text-[9px] leading-snug" style={{ color: "#6366F1" }}>
            External Marketplace OFF — enrichment planned but Buyer won’t transact. Enable in Settings for live procurement.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Order Modal ─────────────────────────────────────────────────────

function OrderModal({
  product,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  product: CatalogProduct;
  onClose: () => void;
  onSubmit: (query: string) => void;
  isSubmitting: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl border p-6"
        style={{ background: "var(--bg-base)", borderColor: "var(--border-default)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: "var(--gray-900)" }}>
            Order: {product.name}
          </h3>
          <button onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded-md text-sm transition-colors hover:bg-black/5" style={{ color: "var(--gray-400)" }}>
            ✕
          </button>
        </div>

        <p className="mb-3 text-[13px]" style={{ color: "var(--gray-500)" }}>
          The Seller routes your request through the full canonical pipeline:
          Interpreter structures the brief → Composer builds the report → optional Buyer enrichment → Seller packages and delivers.
        </p>

        {/* Pipeline flow visual */}
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto rounded-lg px-3 py-2.5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}>
          {["Seller", "Interpreter", "Composer", "Buyer?", "Seller"].map((step, i, arr) => (
            <div key={i} className="flex shrink-0 items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold"
                style={{
                  background: step === "Buyer?" ? "rgba(245,158,11,0.10)" : step === "Seller" ? "rgba(239,68,68,0.10)" : step === "Interpreter" ? "rgba(124,58,237,0.10)" : "rgba(14,165,233,0.10)",
                  color: step === "Buyer?" ? "#F59E0B" : step === "Seller" ? "#EF4444" : step === "Interpreter" ? "#7C3AED" : "#0EA5E9",
                  border: `1px solid ${step === "Buyer?" ? "rgba(245,158,11,0.20)" : step === "Seller" ? "rgba(239,68,68,0.20)" : step === "Interpreter" ? "rgba(124,58,237,0.20)" : "rgba(14,165,233,0.20)"}`,
                }}
              >
                {step}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight size={9} style={{ color: "var(--gray-300)" }} />
              )}
            </div>
          ))}
        </div>

        {product.mayRequireExternalData && (
          <div className="mb-3 flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <Sparkles size={11} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
            <p className="text-[10px] leading-snug" style={{ color: "#F59E0B" }}>
              <span className="font-semibold">Buyer enrichment eligible</span> — Seller may instruct the Buyer to purchase third-party data from Nevermined to improve this report.
              Requires <span className="font-mono">External Marketplace</span> enabled in Settings.
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center gap-2 rounded-lg p-3" style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
          <CreditCard size={14} style={{ color: "#EF4444" }} />
          <span className="font-mono text-[11px]" style={{ color: "#EF4444" }}>
            {product.price} credits — generated on-the-fly
          </span>
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="E.g. 'Research the AI agent marketplace landscape and key players in 2025'"
          rows={4}
          className="mb-4 w-full resize-none rounded-xl px-4 py-3 text-[13px] leading-relaxed outline-none transition-all"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-default)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
            style={{ border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => query.trim() && onSubmit(query.trim())}
            disabled={!query.trim() || isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Fulfilling…
              </>
            ) : (
              <>
                <ArrowRight size={12} />
                Submit Order
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Order Result View ───────────────────────────────────────────────

function OrderResultView({ result, onClose }: { result: OrderResult; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6"
        style={{ background: "var(--bg-base)", borderColor: "var(--border-default)" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} style={{ color: "var(--green-500)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--gray-900)" }}>
              Order Fulfilled
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded-md text-sm transition-colors hover:bg-black/5" style={{ color: "var(--gray-400)" }}>✕</button>
        </div>

        {/* Stats bar */}
        <div
          className="mb-4 flex flex-wrap gap-4 rounded-lg p-3"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-1.5">
            <Package size={11} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {result.product.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={11} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {result.totalCredits}cr
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe size={11} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {result.document?.sources.length ?? 0} sources
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} style={{ color: "var(--gray-400)" }} />
            <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
              {(result.totalDurationMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Enrichment Summary */}
        {result.enrichmentSummary && (
          <div className="mb-4">
            <EnrichmentSummaryBadge summary={result.enrichmentSummary} expandable={true} />
          </div>
        )}

        {/* AI Reasoning */}
        <div
          className="mb-4 rounded-lg p-3"
          style={{ background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.12)" }}
        >
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase" style={{ color: "#EF4444" }}>
            Seller Reasoning
          </p>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
            {result.fulfillmentPlan.reasoning}
            {result.fulfillmentPlan.usedExternalData && (
              <span className="ml-1 font-mono text-[10px]" style={{ color: "#F59E0B" }}>
                ✦ enriched with external data
              </span>
            )}
          </p>
        </div>

        {/* Document content */}
        {result.document && (
          <div className="space-y-3">
            <h4 className="text-[15px] font-semibold" style={{ color: "var(--gray-900)" }}>
              {result.document.title}
            </h4>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--gray-600)" }}>
              {result.document.summary}
            </p>
            {result.document.sections.map((section, i) => (
              <div key={i}>
                <h5 className="mb-1 text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
                  {section.heading}
                </h5>
                <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--gray-500)" }}>
                  {section.content}
                </p>
              </div>
            ))}
            {result.document.sources.length > 0 && (
              <div className="border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase" style={{ color: "var(--gray-400)" }}>
                  Sources ({result.document.sources.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.document.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] transition-colors hover:opacity-80"
                      style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
                    >
                      <ExternalLink size={8} />
                      {s.title.slice(0, 40)}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <ZeroClickAd
          query={result.product.name + (result.document?.title ? " " + result.document.title : "")}
          muted={false}
          signals={[{ category: "purchase_intent" as const, confidence: 0.85, subject: result.product.name, sentiment: "positive" as const }]}
        />

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
          style={{ border: "1px solid var(--border-default)", color: "var(--gray-500)" }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Store Page ─────────────────────────────────────────────────

function useStoreLiveStats() {
  const [tx, setTx] = useState(0);
  const [credits, setCredits] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch("/api/pipeline/stats");
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled) { setTx(d.totalTransactions ?? 0); setCredits(d.totalCreditsFlowed ?? 0); }
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return { tx, credits };
}

export function StorePage() {
  const { tx, credits } = useStoreLiveStats();
  const animTx      = useAnimatedCounter(tx, 1200, 300);
  const animCredits = useAnimatedCounter(credits, 1400, 400);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderingProductId, setOrderingProductId] = useState<string | null>(null);
  const [toolSettings, setToolSettings] = useState<ToolSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    setToolSettings(loadToolSettings());
  }, []);

  async function fetchInventory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/inventory");
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load store");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  async function handleOrder(query: string) {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    setOrderingProductId(selectedProduct.id);

    try {
      const res = await fetch("/api/agent/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-request": "true" },
        body: JSON.stringify({
          query,
          productId: selectedProduct.id,
          maxCredits: 50,
          ...(toolSettings ? { toolSettings } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Order failed");
      }

      const result = await res.json();
      setOrderResult(result);
      setSelectedProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setIsSubmitting(false);
      setOrderingProductId(null);
    }
  }

  return (
    <>
    <Nav />
    <ErrorBoundary>
    <main className="min-h-screen pt-20 pb-24" style={{ background: "var(--bg-base)" }}>
      <div className="mx-auto max-w-6xl px-6">
        {/* ── Compact hero — storefront first ─────────────────────────── */}
        <div
          className="mb-6 rounded-2xl px-6 py-5 relative overflow-hidden"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", boxShadow: "0 2px 16px -4px rgba(0,0,0,0.06)" }}
        >
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <Store size={16} style={{ color: "#EF4444" }} />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl" style={{ color: "var(--gray-900)" }}>
                  Agent <span className="text-gradient-accent">Store</span>
                </h1>
              </div>
              <p className="max-w-lg text-[14px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                Browse deliverables and order on-demand. Agents handle the rest.
              </p>
            </div>
            {/* Trust bar — compact inline */}
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {mounted && animTx > 0 && (
                <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: "rgba(201,125,78,0.06)", border: "1px solid rgba(201,125,78,0.14)" }}>
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-400)" }} />
                  <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: "var(--accent-400)" }}>{animTx} fulfilled</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "var(--gray-500)" }}>
                <Zap size={10} style={{ color: "var(--accent-400)" }} /> From 5cr · ≈ $0.50
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: "var(--gray-500)" }}>
                <FileText size={10} style={{ color: "var(--gray-400)" }} /> Markdown · Summary · JSON
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        {inventory && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--gray-400)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, tags, categories..."
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none transition-all"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,125,78,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Category filter tabs */}
        {inventory && inventory.products.length > 0 && (() => {
          const cats = Array.from(new Set(inventory.products.map((p) => p.category)));
          return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className="rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all btn-press"
                style={{ background: activeCategory === "all" ? "var(--accent-400)" : "var(--bg-elevated)", color: activeCategory === "all" ? "white" : "var(--gray-500)", border: "1px solid", borderColor: activeCategory === "all" ? "var(--accent-400)" : "var(--border-default)" }}
              >
                All ({inventory.products.length})
              </button>
              {cats.map((cat) => {
                const color = CATEGORY_COLORS[cat] ?? "#c97d4e";
                const active = activeCategory === cat;
                const count = inventory.products.filter((p) => p.category === cat).length;
                return (
                  <button key={cat}
                    onClick={() => setActiveCategory(active ? "all" : cat)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition-all btn-press"
                    style={{ background: active ? `${color}18` : "var(--bg-elevated)", color: active ? color : "var(--gray-500)", border: `1px solid ${active ? color + "40" : "var(--border-default)"}` }}
                  >
                    {(() => { const I = CATEGORY_ICONS[cat] ?? Package; return <I size={9} />; })()}
                    {CATEGORY_LABELS[cat] ?? cat} ({count})
                  </button>
                );
              })}
            </motion.div>
          );
        })()}

        {/* Stats bar */}
        {inventory && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border p-4"
            style={{ background: "var(--glass-bg)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center gap-2">
              <Package size={14} style={{ color: "var(--accent-400)" }} />
              <span className="font-mono text-[11px]" style={{ color: "var(--gray-600)" }}>
                {inventory.counts.products} products
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} style={{ color: "#F59E0B" }} />
              <span className="font-mono text-[11px]" style={{ color: "var(--gray-600)" }}>
                {inventory.counts.thirdPartyServices} third-party services
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setCheckoutOpen(true)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "rgba(201, 125, 78, 0.08)", border: "1px solid rgba(201, 125, 78, 0.18)", color: "var(--accent-400)" }}
              >
                <CreditCard size={10} />
                Buy Credits
              </button>
              <button
                onClick={fetchInventory}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] transition-all hover:opacity-80"
                style={{ border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
              >
                <RefreshCw size={10} />
                Refresh
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="relative flex flex-col rounded-xl border p-5"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
              >
                {/* Top accent bar skeleton */}
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl skeleton" />
                {/* Badge row */}
                <div className="mt-2 mb-3 flex items-center justify-between">
                  <div className="skeleton h-5 w-24 rounded-md" />
                  <div className="skeleton h-5 w-12 rounded-md" />
                </div>
                {/* Title */}
                <div className="skeleton mb-1.5 h-4 w-3/4 rounded" />
                {/* Description lines */}
                <div className="mb-1 skeleton h-3 w-full rounded" />
                <div className="mb-4 skeleton h-3 w-5/6 rounded" />
                {/* Pipeline strip */}
                <div className="mb-4 rounded-lg px-3 py-2.5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
                  <div className="skeleton mb-1.5 h-2 w-16 rounded" />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="skeleton h-4 w-14 rounded-md" />
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div className="mb-4 flex gap-1.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="skeleton h-4 w-14 rounded-full" />
                  ))}
                </div>
                {/* CTA button */}
                <div className="skeleton h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mb-6 flex items-center gap-2 rounded-lg p-4"
            style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)" }}
          >
            <AlertCircle size={14} style={{ color: "#EF4444" }} />
            <span className="text-[13px]" style={{ color: "#EF4444" }}>{error}</span>
          </div>
        )}

        {/* Product grid */}
        {inventory && (() => {
          const q = searchQuery.toLowerCase().trim();
          const catFiltered = activeCategory === "all" ? inventory.products : inventory.products.filter((p) => p.category === activeCategory);
          const filtered = q ? catFiltered.filter((p) =>
            p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
          ) : catFiltered;
          return filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOrder={setSelectedProduct}
                  isOrdering={orderingProductId === product.id}
                  externalTrading={toolSettings?.trading?.externalTrading ?? true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={28} style={{ color: "var(--gray-300)" }} />
              <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--gray-500)" }}>No products match &ldquo;{searchQuery}&rdquo;</p>
              <button onClick={() => setSearchQuery("")} className="mt-2 text-[12px] underline" style={{ color: "var(--accent-400)" }}>Clear search</button>
            </div>
          );
        })()}

        {/* How fulfillment works — collapsible, below products */}
        <details className="mt-10 mb-8 rounded-xl border group" style={{ borderColor: "var(--border-default)", background: "var(--glass-bg)" }}>
          <summary className="flex cursor-pointer items-center gap-2.5 px-5 py-3.5 select-none" style={{ color: "var(--gray-500)" }}>
            <ChevronDown size={12} className="transition-transform group-open:rotate-180" style={{ color: "var(--gray-400)" }} />
            <span className="text-[13px] font-medium">How fulfillment works</span>
          </summary>
          <div className="grid grid-cols-2 gap-4 border-t px-5 py-4 sm:grid-cols-4" style={{ borderColor: "var(--border-default)" }}>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex items-start gap-2.5">
                <span className="font-mono text-[11px] font-bold shrink-0" style={{ color: step.color }}>{step.step}</span>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>{step.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--gray-400)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </details>

        {/* Third-party services section */}
        {inventory && inventory.thirdPartyServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "var(--gray-900)" }}
            >
              Third-Party Services
            </h2>
            <p className="mb-6 text-[13px]" style={{ color: "var(--gray-500)" }}>
              External agent services available on the marketplace. The Seller and Buyer agents can purchase from these to enrich outputs.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inventory.thirdPartyServices.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg border p-4"
                  style={{ background: "var(--glass-bg)", borderColor: "var(--border-default)" }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                      {service.name}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: "#F59E0B" }}>
                      {service.priceCredits}cr
                    </span>
                  </div>
                  <p className="mb-2 text-[11px]" style={{ color: "var(--gray-500)" }}>
                    {service.description}
                  </p>
                  <div className="flex items-center gap-2 text-[9px]" style={{ color: "var(--gray-400)" }}>
                    <span>{service.provider}</span>
                    <span>·</span>
                    <span>{service.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state for no third-party services */}
        {inventory && inventory.thirdPartyServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 rounded-xl border p-8 text-center"
            style={{ background: "var(--glass-bg)", borderColor: "var(--border-default)" }}
          >
            <Globe size={24} className="mx-auto mb-3" style={{ color: "var(--gray-300)" }} />
            <p className="mb-1 text-[13px] font-medium" style={{ color: "var(--gray-600)" }}>
              No third-party services registered yet
            </p>
            <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
              Import services from the hackathon event board via the inventory API to enable external data procurement.
            </p>
          </motion.div>
        )}
      </div>

      {/* Order modal */}
      <AnimatePresence>
        {selectedProduct && (
          <OrderModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSubmit={handleOrder}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Order result modal */}
      <AnimatePresence>
        {orderResult && (
          <OrderResultView
            result={orderResult}
            onClose={() => setOrderResult(null)}
          />
        )}
      </AnimatePresence>
    </main>
    </ErrorBoundary>
    <Footer />
    <VGSCheckoutModal
      open={checkoutOpen}
      onClose={() => setCheckoutOpen(false)}
      onSuccess={(_credits, _paymentId) => {
        setCheckoutOpen(false);
      }}
    />
    <ScrollToTop />
    </>
  );
}
