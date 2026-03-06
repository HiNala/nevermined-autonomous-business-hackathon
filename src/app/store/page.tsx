import type { Metadata } from "next";
import { StorePage } from "@/components/pages/store-page";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse and order AI-generated deliverables from the autonomous Seller agent. Each order triggers a full multi-agent research pipeline.",
  openGraph: {
    title: "Undermind Store — AI-generated deliverables",
    description: "Browse and order AI-generated deliverables. Each order triggers a full multi-agent pipeline.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Undermind Store",
    description: "Order AI-generated research, plans, and reports. Powered by autonomous agents.",
  },
};

export default function Page() {
  return <StorePage />;
}
