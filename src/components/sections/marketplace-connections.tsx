"use client";

import { motion } from "framer-motion";
import { MARKETPLACE_PARTNERS } from "@/data/mock-transactions";
import type { MarketplacePartner } from "@/types";

function PartnerCard({ partner, index }: { partner: MarketplacePartner; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="glass p-4 transition-all duration-200"
      style={{ borderColor: "var(--glass-border)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(34, 197, 94, 0.18)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)";
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: "var(--gray-800)" }}>
          {partner.teamName}
        </span>
        <span
          className="font-mono text-[10px] font-bold tracking-wider"
          style={{ color: "var(--green-400)" }}
        >
          {partner.agentName}
        </span>
      </div>

      <p className="mb-3 font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
        {partner.toolPurchased}
      </p>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
          {partner.purchaseCount}× purchased
        </span>
        <span className="font-mono text-[11px] font-bold" style={{ color: "var(--green-400)" }}>
          {partner.creditsSpent}cr
        </span>
      </div>
    </motion.div>
  );
}

export function MarketplaceConnections() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          Network
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: "var(--gray-400)" }}>
            {MARKETPLACE_PARTNERS.length} teams connected
          </span>
          <div className="flex items-center gap-0.5">
            {MARKETPLACE_PARTNERS.map((p) => (
              <span
                key={p.id}
                className="size-1.5 rounded-full"
                style={{ background: "var(--green-500)", opacity: 0.6 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETPLACE_PARTNERS.map((partner, i) => (
          <PartnerCard key={partner.id} partner={partner} index={i} />
        ))}
      </div>
    </section>
  );
}
