"use client";

import { MARKETPLACE_PARTNERS } from "@/data/mock-transactions";
import type { MarketplacePartner } from "@/types";

function PartnerCard({ partner }: { partner: MarketplacePartner }) {
  return (
    <div
      className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--gray-900)" }}
        >
          {partner.teamName}
        </span>
        <span
          className="font-mono text-xs font-bold uppercase"
          style={{ color: "var(--green-600)" }}
        >
          {partner.agentName}
        </span>
      </div>

      <p
        className="mb-3 text-xs"
        style={{ color: "var(--gray-400)" }}
      >
        Purchased: {partner.toolPurchased}
      </p>

      <div className="flex items-center justify-between">
        <span
          className="font-mono text-xs"
          style={{ color: "var(--gray-600)" }}
        >
          {partner.purchaseCount} purchases
        </span>
        <span
          className="font-mono text-xs font-bold"
          style={{ color: "var(--green-600)" }}
        >
          {partner.creditsSpent}cr spent
        </span>
      </div>
    </div>
  );
}

export function MarketplaceConnections() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          Marketplace Connections
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "var(--gray-600)" }}
          >
            Your buyer has traded with {MARKETPLACE_PARTNERS.length} teams
          </span>
          <div className="flex items-center gap-1">
            {MARKETPLACE_PARTNERS.map((p) => (
              <span
                key={p.id}
                className="size-2 rounded-full"
                style={{ background: "var(--green-500)" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Partner grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETPLACE_PARTNERS.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    </section>
  );
}
