import type { Metadata } from "next";
import { StudioPage } from "@/components/pages/studio-page";

export const metadata: Metadata = {
  title: "Studio",
  description: "Describe any business task. Five AI agents — Strategist, Researcher, Buyer, Seller, and VISION — deliver structured research, plans, and images.",
  openGraph: {
    title: "Undermind Studio — AI Agent Pipeline",
    description: "Describe any business task. Five AI agents deliver structured research, plans, and images in minutes.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undermind Studio",
    description: "Describe the work. Agents build it.",
  },
};

export default function Page() {
  return <StudioPage />;
}
