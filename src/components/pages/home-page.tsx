"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsBar } from "@/components/sections/stats-bar";
import { TransactionFeed } from "@/components/sections/transaction-feed";
import { AgentCards } from "@/components/sections/agent-cards";
import { MarketplaceConnections } from "@/components/sections/marketplace-connections";
import { DecisionLogic } from "@/components/sections/decision-logic";
import { STAT_UPDATE_INTERVAL_MS } from "@/lib/constants";
import { INITIAL_STATS } from "@/data/mock-transactions";
import type { LiveStats } from "@/types";

export function HomePage() {
  const [stats, setStats] = useState<LiveStats>(INITIAL_STATS);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        transactions: prev.transactions + Math.floor(Math.random() * 2),
        volume: prev.volume + Math.floor(Math.random() * 8),
        uniqueTeams: prev.uniqueTeams + (Math.random() > 0.95 ? 1 : 0),
      }));
    }, STAT_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav txCount={stats.transactions} />
      <main>
        <HeroSection />
        <StatsBar stats={stats} />
        <TransactionFeed />
        <AgentCards />
        <MarketplaceConnections />
        <DecisionLogic />
      </main>
      <Footer />
    </div>
  );
}
