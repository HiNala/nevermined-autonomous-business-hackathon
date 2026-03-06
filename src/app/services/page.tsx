import type { Metadata } from "next";
import { ServicesPage } from "@/components/pages/services-page";

export const metadata: Metadata = {
  title: "Services",
  description: "Research sprints, planning packs, and design specs — pay per deliverable with USDC. No subscription required.",
  openGraph: {
    title: "Undermind Services — AI-powered deliverables",
    description: "Research sprints, planning packs, and design specs — pay per deliverable with USDC.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undermind Services",
    description: "Research sprints, planning packs, design specs. Pay per deliverable with USDC. No subscription.",
  },
};

export default function Page() {
  return <ServicesPage />;
}
