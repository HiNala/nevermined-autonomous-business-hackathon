import type { Metadata } from "next";
import { ResearchPage } from "@/components/pages/research-page";

export const metadata: Metadata = {
  title: "Research",
  description: "Run web research requests and get structured intelligence documents. Powered by the Composer AI agent.",
  openGraph: {
    title: "Research | Undermind",
    description: "Run web research requests and get structured intelligence documents.",
  },
};

export default function Page() {
  return <ResearchPage />;
}
