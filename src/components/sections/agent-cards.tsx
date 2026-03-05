"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import type { Agent } from "@/types";
import { SELLER_AGENT, BUYER_AGENT } from "@/data/mock-transactions";
import { Bot } from "lucide-react";

function AgentCard({ agent, isPrimary = false }: { agent: Agent; isPrimary?: boolean }) {
  const isSeller = agent.role === "seller";
  const borderColor = isPrimary
    ? "var(--green-600)"
    : isSeller
    ? "var(--green-500)"
    : "#60A5FA";

  return (
    <GlowingEffect disabled={!isPrimary} glowColor={borderColor}>
      <div
        className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        style={{
          borderColor: "var(--border-default)",
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-lg"
            style={{ background: "var(--green-50)" }}
          >
            <Bot size={20} color="var(--green-600)" />
          </div>
          <div>
            <h3
              className="font-mono text-sm font-bold uppercase tracking-wider"
              style={{ color: "var(--gray-900)" }}
            >
              {agent.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="text-xs"
                style={{ color: "var(--gray-600)" }}
              >
                {agent.description.split(".")[0]}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: isSeller ? "var(--green-50)" : "#EFF6FF",
                  color: isSeller ? "var(--green-700)" : "#1D4ED8",
                  border: `1px solid ${isSeller ? "var(--green-200)" : "#BFDBFE"}`,
                }}
              >
                {agent.role}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          className="mb-4 text-sm"
          style={{ color: "var(--gray-600)" }}
        >
          &ldquo;{agent.description}&rdquo;
        </p>

        {/* Pricing tiers */}
        <div
          className="mb-4 divide-y rounded-lg border"
          style={{ borderColor: "var(--border-default)" }}
        >
          {agent.tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between px-3 py-2"
            >
              <span
                className="font-mono text-xs"
                style={{ color: "var(--gray-800)" }}
              >
                {tool.name}
              </span>
              <span
                className="font-mono text-xs font-bold"
                style={{ color: "var(--green-600)" }}
              >
                {tool.credits === 0 ? "free" : `${tool.credits} credit${tool.credits > 1 ? "s" : ""}`}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center gap-4">
          <span
            className="font-mono text-xs"
            style={{ color: "var(--gray-400)" }}
          >
            {agent.stats.totalSales} sales
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--gray-400)" }}
          >
            {agent.stats.repeatBuyers} repeat buyers
          </span>
        </div>

        {/* CTA */}
        <button
          className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: isSeller ? "var(--green-500)" : "transparent",
            color: isSeller ? "white" : "var(--green-700)",
            border: isSeller ? "none" : "1px solid var(--green-200)",
          }}
        >
          {isSeller ? `Buy from ${agent.name} →` : `View ${agent.name} Activity →`}
        </button>
      </div>
    </GlowingEffect>
  );
}

export function AgentCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2
        className="mb-6 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--gray-400)" }}
      >
        Our Agents
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AgentCard agent={SELLER_AGENT} isPrimary />
        <AgentCard agent={BUYER_AGENT} />
      </div>
    </section>
  );
}
