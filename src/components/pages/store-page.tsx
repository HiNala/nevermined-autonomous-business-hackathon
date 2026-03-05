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
} from "lucide-react";

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

const CATEGORY_LABELS: Record<string, string> = {
  research_report: "Research Report",
  market_analysis: "Market Analysis",
  competitive_intel: "Competitive Intel",
  strategic_plan: "Strategic Plan",
  prd: "PRD",
  technical_report: "Technical Report",
  custom: "Custom",
};

// ─── Product Card ────────────────────────────────────────────────────

function ProductCard({
  product,
  onOrder,
  isOrdering,
}: {
  product: CatalogProduct;
  onOrder: (product: CatalogProduct) => void;
  isOrdering: boolean;
}) {
  const Icon = CATEGORY_ICONS[product.category] ?? Package;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-xl border p-5 transition-all hover:shadow-lg"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Category badge */}
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase"
          style={{ background: "rgba(239, 68, 68, 0.08)", color: "#EF4444" }}
        >
          <Icon size={10} />
          {CATEGORY_LABELS[product.category] ?? product.category}
        </div>
        <div
          className="rounded-md px-2 py-1 font-mono text-[11px] font-bold"
          style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--accent-400)" }}
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

      {/* Tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {product.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 font-mono text-[9px]"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
          >
            {tag}
          </span>
        ))}
        {product.mayRequireExternalData && (
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9px]"
            style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.20)", color: "#F59E0B" }}
          >
            may use 3rd-party data
          </span>
        )}
      </div>

      {/* Order button */}
      <button
        onClick={() => onOrder(product)}
        disabled={isOrdering}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #EF4444, #DC2626)",
          color: "white",
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
        style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: "var(--gray-900)" }}>
            Order: {product.name}
          </h3>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--gray-400)" }}>
            ✕
          </button>
        </div>

        <p className="mb-4 text-[13px]" style={{ color: "var(--gray-500)" }}>
          Describe what you need. The Seller agent will match your request to this product, plan fulfillment,
          and generate the output using our Strategist → Researcher → Buyer pipeline.
        </p>

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
          className="mb-4 w-full resize-none rounded-xl px-4 py-3 text-[13px] leading-relaxed outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
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
            style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
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
        style={{ background: "var(--bg-primary)", borderColor: "var(--border-default)" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} style={{ color: "var(--green-500)" }} />
            <h3 className="text-lg font-semibold" style={{ color: "var(--gray-900)" }}>
              Order Fulfilled
            </h3>
          </div>
          <button onClick={onClose} className="text-sm" style={{ color: "var(--gray-400)" }}>✕</button>
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
                (used 3rd-party data)
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

export function StorePage() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [orderingProductId, setOrderingProductId] = useState<string | null>(null);
  const [toolSettings, setToolSettings] = useState<ToolSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    <main className="min-h-screen pt-20 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.20)" }}
            >
              <Store size={18} style={{ color: "#EF4444" }} />
            </div>
            <div>
              <h1
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: "var(--gray-900)" }}
              >
                Agent <span className="text-gradient-accent">Store</span>
              </h1>
            </div>
          </div>
          <p
            className="max-w-xl text-[15px] leading-relaxed"
            style={{ color: "var(--gray-500)" }}
          >
            Browse products generated on-the-fly by our autonomous Seller agent.
            Each order triggers a full pipeline: Strategist plans, Researcher discovers,
            and the Buyer procures external data when needed.
          </p>
        </motion.div>

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
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-[13px] transition-all"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border-default)", color: "var(--gray-800)" }}
              />
            </div>
          </motion.div>
        )}

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
            <button
              onClick={fetchInventory}
              className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[10px] transition-all hover:opacity-80"
              style={{ border: "1px solid var(--border-default)", color: "var(--gray-400)" }}
            >
              <RefreshCw size={10} />
              Refresh
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--gray-400)" }} />
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
          const filtered = q ? inventory.products.filter((p) =>
            p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
          ) : inventory.products;
          return filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOrder={setSelectedProduct}
                  isOrdering={orderingProductId === product.id}
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
    <Footer />
    </>
  );
}
