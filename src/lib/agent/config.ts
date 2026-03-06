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
    name: "Interpreter",
    role: "Intent Structuring",
    description: "Converts a vague request into a precise execution brief — objective, scope, search plan, required sections, and delivery format.",
    avatar: "◆",
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.08)",
    borderColor: "rgba(124, 58, 237, 0.20)",
  },
  researcher: {
    id: "researcher",
    name: "Composer",
    role: "Document Creation",
    description: "Takes the Interpreter's brief, searches the web, synthesizes sources, and composes the final structured report artifact.",
    avatar: "◈",
    color: "#0EA5E9",
    bgColor: "rgba(14, 165, 233, 0.08)",
    borderColor: "rgba(14, 165, 233, 0.20)",
  },
  buyer: {
    id: "buyer",
    name: "Buyer",
    role: "Enrichment Procurement",
    description: "Optional enrichment stage. Purchases third-party data assets from the Nevermined marketplace when the Composer needs external evidence.",
    avatar: "◎",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.20)",
  },
  seller: {
    id: "seller",
    name: "Seller",
    role: "Intake & Delivery",
    description: "Commerce boundary and final packaging layer. Accepts orders, owns the transaction, and delivers the finished artifact as a branded deliverable package.",
    avatar: "◇",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.20)",
  },
};
