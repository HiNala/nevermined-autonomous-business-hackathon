import type { Metadata } from "next";
import { StorePage } from "@/components/pages/store-page";

export const metadata: Metadata = {
  title: "Store",
  description: "Browse and order AI-generated deliverables from the autonomous Seller agent. Each order triggers a full multi-agent research pipeline.",
  openGraph: {
    title: "Auto Business Store — AI-generated deliverables",
    description: "Browse and order AI-generated deliverables. Each order triggers a full multi-agent pipeline.",
  },
};

export default function Page() {
  return <StorePage />;
}
