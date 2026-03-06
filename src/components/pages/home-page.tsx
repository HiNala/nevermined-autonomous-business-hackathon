"use client";

import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaSection } from "@/components/sections/cta-section";
import { OutputShowcase } from "@/components/sections/output-showcase";
import { SectionDivider } from "@/components/ui/section-divider";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Nav />
      <main>
        <HeroSection />
        <SectionDivider />
        <OutputShowcase />
        <SectionDivider />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
