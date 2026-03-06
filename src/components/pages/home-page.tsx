"use client";

import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { DecisionLogic } from "@/components/sections/decision-logic";
import { StudioServices } from "@/components/sections/studio-services";
import { AgentCards } from "@/components/sections/agent-cards";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { OutputShowcase } from "@/components/sections/output-showcase";
import { HowToBuy } from "@/components/sections/how-to-buy";
import { SectionDivider } from "@/components/ui/section-divider";
import { TransactionFeed } from "@/components/sections/transaction-feed";
import { MarketplaceConnections } from "@/components/sections/marketplace-connections";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { StatsBar } from "@/components/sections/stats-bar";
import { INITIAL_STATS } from "@/data/mock-transactions";

export function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav />
      <main>
        <HeroSection />
        <StatsBar stats={INITIAL_STATS} />
        <SectionDivider />
        <OutputShowcase />
        <SectionDivider />
        <DecisionLogic />
        <SectionDivider />
        <HowToBuy />
        <SectionDivider />
        <AgentCards />
        <SectionDivider />
        <StudioServices />
        <SectionDivider />
        <TransactionFeed />
        <SectionDivider />
        <MarketplaceConnections />
        <SectionDivider />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
