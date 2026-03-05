"use client";

import { useState, useEffect, useRef } from "react";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsBar } from "@/components/sections/stats-bar";
import { DecisionLogic } from "@/components/sections/decision-logic";
import { StudioServices } from "@/components/sections/studio-services";
import { AgentCards } from "@/components/sections/agent-cards";
import { TryStudio } from "@/components/sections/try-studio";
import { TransactionFeed } from "@/components/sections/transaction-feed";
import { MarketplaceConnections } from "@/components/sections/marketplace-connections";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { SectionDivider } from "@/components/ui/section-divider";
import { STAT_UPDATE_INTERVAL_MS } from "@/lib/constants";
import { INITIAL_STATS } from "@/data/mock-transactions";
import type { LiveStats } from "@/types";

export function HomePage() {
  const [stats, setStats] = useState<LiveStats>(INITIAL_STATS);

  const realStatsRef = useRef({ fetched: false, txOffset: 0, volOffset: 0 });

  useEffect(() => {
    // Fetch real pipeline stats once to seed the counters
    if (!realStatsRef.current.fetched) {
      realStatsRef.current.fetched = true;
      fetch("/api/pipeline/stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.totalTransactions > 0) {
            realStatsRef.current.txOffset = data.totalTransactions;
            realStatsRef.current.volOffset = data.totalCreditsFlowed ?? 0;
          }
        })
        .catch(() => { /* API not available, continue with mock */ });
    }

    const interval = setInterval(() => {
      setStats((prev) => ({
        transactions: prev.transactions + Math.floor(Math.random() * 2) + (realStatsRef.current.txOffset > 0 ? 1 : 0),
        volume: prev.volume + Math.floor(Math.random() * 8),
        uniqueTeams: prev.uniqueTeams + (Math.random() > 0.95 ? 1 : 0),
      }));
      // Only apply offset once
      if (realStatsRef.current.txOffset > 0) {
        realStatsRef.current.txOffset = 0;
      }
    }, STAT_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav txCount={stats.transactions} />
      <main>
        <HeroSection />
        <StatsBar stats={stats} />
        <SectionDivider />
        <DecisionLogic />
        <SectionDivider />
        <AgentCards />
        <SectionDivider />
        <StudioServices />
        <SectionDivider />
        <TryStudio />
        <SectionDivider />
        <TransactionFeed />
        <SectionDivider />
        <MarketplaceConnections />
        <SectionDivider />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
