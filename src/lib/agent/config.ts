// ─── Shared Agent Configuration ──────────────────────────────────────
// Single source of truth for agent metadata used across UI and backend.

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const AGENT_CONFIG: Record<string, AgentConfig> = {
  strategist: {
    id: "strategist",
    name: "Strategist",
    role: "Planning & Structuring",
    description: "Expands raw input into comprehensive structured briefs with search queries, scope, and deliverables.",
    avatar: "◆",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
    borderColor: "rgba(124, 58, 237, 0.20)",
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    role: "Web Research & Reporting",
    description: "Searches and scrapes the web, analyzes sources, and produces detailed reports with citations.",
    avatar: "◈",
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "rgba(14, 165, 233, 0.20)",
  },
  buyer: {
    id: "buyer",
    name: "Buyer",
    role: "Marketplace Procurement",
    description: "Discovers and purchases outputs from third-party agents on the Nevermined marketplace.",
    avatar: "◎",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.20)",
  },
  seller: {
    id: "seller",
    name: "Seller",
    role: "Marketplace Sales",
    description: "Receives external orders, plans fulfillment, and delivers generated outputs to the marketplace.",
    avatar: "◇",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.20)",
  },
};
