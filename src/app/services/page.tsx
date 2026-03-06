import type { Metadata } from "next";
import { ServicesPage } from "@/components/pages/services-page";

export const metadata: Metadata = {
  title: "Services",
  description: "Research sprints, planning packs, and design specs — pay per deliverable with USDC. No subscription required.",
  openGraph: {
    title: "Auto Business Services — AI-powered deliverables",
    description: "Research sprints, planning packs, and design specs — pay per deliverable with USDC.",
  },
};

export default function Page() {
  return <ServicesPage />;
}
