import type { Metadata } from "next";
import { AgentsPage } from "@/components/pages/agents-page";

export const metadata: Metadata = {
  title: "Agents",
  description: "Meet the specialist AI agents: Strategist, Researcher, Buyer, Seller, and VISION — powered by Nevermined, Apify, and NanoBanana.",
  openGraph: {
    title: "Auto Business Agents — Specialist AI Pipeline",
    description: "Five specialist AI agents that deliver structured work in minutes. Pay only for what you use.",
  },
};

export default function Page() {
  return <AgentsPage />;
}
