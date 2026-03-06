import type { Metadata } from "next";
import { ResearchPage } from "@/components/pages/research-page";

export const metadata: Metadata = {
  title: "Research | Auto Business",
  description: "Run web research requests and get structured intelligence documents. Powered by the Composer AI agent.",
};

export default function Page() {
  return <ResearchPage />;
}
