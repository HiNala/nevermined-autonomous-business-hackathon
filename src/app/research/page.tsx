import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Research",
  description: "Run web research requests and get structured intelligence documents. Powered by the Composer AI agent.",
};

export default function Page() {
  redirect("/studio?mode=researcher");
}
