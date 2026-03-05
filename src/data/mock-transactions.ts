import {
  Transaction,
  Agent,
  MarketplacePartner,
  LiveStats,
  StudioAgent,
  StudioService,
} from "@/types";

const AGENT_NAMES = [
  "ORBIT",
  "CANVAS",
  "SCOUT",
  "NOVA",
  "ATLAS",
  "HELIX",
  "PRISM",
  "NEXUS",
];

const TOOLS = [
  "research_sprint",
  "planning_pack",
  "design_spec",
  "market_scan",
  "competitor_brief",
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
    id: "agent-scout",
    name: "SCOUT",
    specialty: "Research Agent",
    summary: "Scrapes and distills websites, docs, and market signals into usable intelligence.",
    outputs: ["Live crawl summary", "Competitor notes", "Source-backed findings"],
    accentColor: "var(--green-500)",
    ctaLabel: "Run research sprint",
    startingCredits: 1,
    stats: {
      totalSales: 28,
      repeatBuyers: 4,
      totalCreditsEarned: 66,
    },
  },
  {
    id: "agent-orbit",
    name: "ORBIT",
    specialty: "Planning Agent",
    summary: "Turns raw inputs into roadmap-ready plans, milestones, and execution docs.",
    outputs: ["Launch plan", "Decision matrix", "Risk + dependency map"],
    accentColor: "#0EA5E9",
    ctaLabel: "Generate planning pack",
    startingCredits: 5,
    stats: {
      totalSales: 19,
      repeatBuyers: 5,
      totalCreditsEarned: 93,
    },
    primary: true,
  },
  {
    id: "agent-canvas",
    name: "CANVAS",
    specialty: "UI Agent",
    summary: "Produces page architecture, interaction ideas, and detailed front-end design specs.",
    outputs: ["Hero + page sections", "Component states", "Copy + visual direction"],
    accentColor: "#7C3AED",
    ctaLabel: "Draft design spec",
    startingCredits: 10,
    stats: {
      totalSales: 14,
      repeatBuyers: 3,
      totalCreditsEarned: 118,
    },
  },
];

export const SELLER_AGENT: Agent = {
  id: "agent-seller-001",
  name: "NOVA",
  role: "seller",
  description: "Packages research, planning, and design deliverables into a paid studio flow.",
  tools: [
    { name: "research_sprint", credits: 1, description: "Quick web-backed insight" },
    { name: "planning_pack", credits: 5, description: "Structured product planning" },
    {
      name: "design_spec",
      credits: 10,
      description: "Detailed front-end design specification",
    },
  ],
  stats: {
    totalSales: 61,
    repeatBuyers: 8,
    totalCreditsEarned: 277,
  },
};

export const BUYER_AGENT: Agent = {
  id: "agent-buyer-001",
  name: "ATLAS",
  role: "buyer",
  description:
    "Routing agent that evaluates partner tools, buys missing context, and composes the best final deliverable.",
  tools: [
    {
      name: "discover_pricing",
      credits: 0,
      description: "Query seller pricing",
    },
    { name: "check_balance", credits: 0, description: "Check credit balance" },
    {
      name: "purchase_data",
      credits: 1,
      description: "Buy data from a seller",
    },
  ],
  stats: {
    totalSales: 39,
    repeatBuyers: 7,
    totalCreditsEarned: 164,
  },
};

export const MARKETPLACE_PARTNERS: MarketplacePartner[] = [
  {
    id: "partner-1",
    teamName: "Team Quantum",
    agentName: "CIPHER",
    toolPurchased: "competitor_brief",
    creditsSpent: 24,
    purchaseCount: 3,
  },
  {
    id: "partner-2",
    teamName: "Team Nebula",
    agentName: "HELIX",
    toolPurchased: "planning_pack",
    creditsSpent: 15,
    purchaseCount: 3,
  },
  {
    id: "partner-3",
    teamName: "Team Orbit",
    agentName: "ZENITH",
    toolPurchased: "research_sprint",
    creditsSpent: 5,
    purchaseCount: 5,
  },
  {
    id: "partner-4",
    teamName: "Team Flux",
    agentName: "PRISM",
    toolPurchased: "market_scan",
    creditsSpent: 12,
    purchaseCount: 4,
  },
  {
    id: "partner-5",
    teamName: "Team Spark",
    agentName: "VORTEX",
    toolPurchased: "design_spec",
    creditsSpent: 20,
    purchaseCount: 2,
  },
  {
    id: "partner-6",
    teamName: "Team Wave",
    agentName: "NEXUS",
    toolPurchased: "competitor_brief",
    creditsSpent: 24,
    purchaseCount: 3,
  },
];

export const INITIAL_STATS: LiveStats = {
  transactions: 62,
  volume: 277,
  uniqueTeams: 6,
};
