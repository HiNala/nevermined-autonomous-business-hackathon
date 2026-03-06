import {
  Transaction,
  Agent,
  MarketplacePartner,
  LiveStats,
  StudioAgent,
  StudioService,
} from "@/types";

// ─── Mock Transaction Generator (used by TransactionFeed) ────────────

const AGENT_NAMES = [
  "ORBIT", "CANVAS", "SCOUT", "NOVA", "ATLAS", "HELIX", "PRISM", "NEXUS",
];

const TOOLS = [
  "research_sprint", "planning_pack", "design_spec", "market_scan", "competitor_brief",
];

const TOOL_CREDITS: Record<string, number> = {
  research_sprint: 1,
  planning_pack: 5,
  design_spec: 10,
  market_scan: 3,
  competitor_brief: 8,
};

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockTransaction(index: number): Transaction {
  const buyer = randomFrom(AGENT_NAMES);
  let seller = randomFrom(AGENT_NAMES);
  while (seller === buyer) seller = randomFrom(AGENT_NAMES);
  const tool = randomFrom(TOOLS);

  return {
    id: `tx-${Date.now()}-${index}`,
    timestamp: new Date(Date.now() - Math.random() * 300000),
    buyer,
    seller,
    tool,
    credits: TOOL_CREDITS[tool],
    status: Math.random() > 0.1 ? "completed" : "pending",
  };
}

export function generateInitialTransactions(count: number = 12): Transaction[] {
  return Array.from({ length: count }, (_, i) => generateMockTransaction(i)).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

export const STUDIO_SERVICES: StudioService[] = [
  {
    id: "research-sprint",
    name: "Research Sprint",
    credits: 1,
    turnaround: "~2 min",
    summary: "Fast competitor, docs, or market scan sourced from live web inputs.",
    outcomes: [
      "Top takeaways",
      "Source links",
      "Immediate next moves",
    ],
  },
  {
    id: "planning-pack",
    name: "Planning Pack",
    credits: 5,
    turnaround: "~5 min",
    summary: "Structured product plan with scope, milestones, risks, and launch checklist.",
    outcomes: [
      "Feature brief",
      "Execution plan",
      "Delivery priorities",
    ],
  },
  {
    id: "design-spec",
    name: "Frontend Design Spec",
    credits: 10,
    turnaround: "~8 min",
    summary: "High-signal UI direction with sections, copy, states, and implementation cues.",
    outcomes: [
      "Page structure",
      "Component directions",
      "Visual system notes",
    ],
  },
];

export const STUDIO_AGENTS: StudioAgent[] = [
  {
    id: "agent-strategist",
    name: "INTERPRETER",
    specialty: "Intent Structuring",
    summary: "Converts a vague request into a precise execution brief — objective, scope, search plan, required sections, and delivery format. Every pipeline starts here.",
    outputs: ["Execution brief", "Search plan", "Scope & sections", "Delivery spec"],
    accentColor: "#7C3AED",
    ctaLabel: "Structure a brief",
    startingCredits: 1,
    stats: {
      totalSales: 28,
      repeatBuyers: 6,
      totalCreditsEarned: 72,
    },
    primary: true,
  },
  {
    id: "agent-researcher",
    name: "COMPOSER",
    specialty: "Document Creation",
    summary: "Takes the Interpreter's brief, searches and scrapes the web, synthesizes multiple sources, and composes the final structured report artifact.",
    outputs: ["Research report", "Source citations", "Structured sections", "Key findings"],
    accentColor: "#0EA5E9",
    ctaLabel: "Compose a report",
    startingCredits: 1,
    stats: {
      totalSales: 34,
      repeatBuyers: 8,
      totalCreditsEarned: 118,
    },
  },
  {
    id: "agent-buyer",
    name: "BUYER",
    specialty: "Enrichment Procurement",
    summary: "Optional enrichment stage. Purchases third-party data and reports from the Nevermined marketplace when the Composer identifies a knowledge gap.",
    outputs: ["Purchased datasets", "External reports", "Marketplace assets"],
    accentColor: "#F59E0B",
    ctaLabel: "Browse marketplace",
    startingCredits: 5,
    stats: {
      totalSales: 12,
      repeatBuyers: 3,
      totalCreditsEarned: 64,
    },
  },
  {
    id: "agent-seller",
    name: "SELLER",
    specialty: "Intake & Delivery",
    summary: "Commerce boundary and final packaging layer. Accepts orders, owns the x402 transaction, and delivers the finished artifact as a branded, export-ready deliverable.",
    outputs: ["Delivery package", "Branded report", "Export formats", "Quality gate"],
    accentColor: "#EF4444",
    ctaLabel: "View store",
    startingCredits: 0,
    stats: {
      totalSales: 8,
      repeatBuyers: 2,
      totalCreditsEarned: 96,
    },
  },
  {
    id: "agent-vision",
    name: "VISION",
    specialty: "Image Generation",
    summary: "Generates a hero image for every research report using NanoBanana (Gemini). Runs an iterative quality loop — up to 3 attempts — scoring each image before accepting it.",
    outputs: ["Hero image", "Quality score", "Prompt log", "16:9 visual"],
    accentColor: "#CA8A04",
    ctaLabel: "Run pipeline",
    startingCredits: 1,
    stats: {
      totalSales: 0,
      repeatBuyers: 0,
      totalCreditsEarned: 0,
    },
  },
];

// ─── Agent Singletons ────────────────────────────────────────────────

export const SELLER_AGENT: Agent = {
  id: "agent-seller-001",
  name: "NOVA",
  role: "seller",
  description: "Packages research, planning, and design deliverables into a paid studio flow.",
  tools: [
    { name: "research_sprint", credits: 1, description: "Quick web-backed insight" },
    { name: "planning_pack", credits: 5, description: "Structured product planning" },
    { name: "design_spec", credits: 10, description: "Detailed front-end design specification" },
  ],
  stats: { totalSales: 61, repeatBuyers: 8, totalCreditsEarned: 277 },
};

export const BUYER_AGENT: Agent = {
  id: "agent-buyer-001",
  name: "ATLAS",
  role: "buyer",
  description: "Routing agent that evaluates partner tools, buys missing context, and composes the best final deliverable.",
  tools: [
    { name: "discover_pricing", credits: 0, description: "Query seller pricing" },
    { name: "check_balance", credits: 0, description: "Check credit balance" },
    { name: "purchase_data", credits: 1, description: "Buy data from a seller" },
  ],
  stats: { totalSales: 39, repeatBuyers: 7, totalCreditsEarned: 164 },
};

// ─── Marketplace Partners ────────────────────────────────────────────

export const MARKETPLACE_PARTNERS: MarketplacePartner[] = [
  { id: "partner-1", teamName: "Team Quantum", agentName: "CIPHER", toolPurchased: "competitor_brief", creditsSpent: 24, purchaseCount: 3 },
  { id: "partner-2", teamName: "Team Nebula", agentName: "HELIX", toolPurchased: "planning_pack", creditsSpent: 15, purchaseCount: 3 },
  { id: "partner-3", teamName: "Team Orbit", agentName: "ZENITH", toolPurchased: "research_sprint", creditsSpent: 5, purchaseCount: 5 },
  { id: "partner-4", teamName: "Team Flux", agentName: "PRISM", toolPurchased: "market_scan", creditsSpent: 12, purchaseCount: 4 },
  { id: "partner-5", teamName: "Team Spark", agentName: "VORTEX", toolPurchased: "design_spec", creditsSpent: 20, purchaseCount: 2 },
  { id: "partner-6", teamName: "Team Wave", agentName: "NEXUS", toolPurchased: "competitor_brief", creditsSpent: 24, purchaseCount: 3 },
];

// ─── Initial Stats ───────────────────────────────────────────────────

export const INITIAL_STATS: LiveStats = {
  transactions: 1284,
  volume: 4917,
  uniqueTeams: 34,
};
