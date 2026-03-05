import { Transaction, Agent, MarketplacePartner, LiveStats } from "@/types";

const AGENT_NAMES = [
  "NOVA",
  "ATLAS",
  "CIPHER",
  "HELIX",
  "ZENITH",
  "PRISM",
  "VORTEX",
  "NEXUS",
];

const TOOLS = [
  "search_data",
  "summarize_data",
  "research_data",
  "analyze_market",
  "generate_report",
];

const TOOL_CREDITS: Record<string, number> = {
  search_data: 1,
  summarize_data: 5,
  research_data: 10,
  analyze_market: 3,
  generate_report: 8,
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

export const SELLER_AGENT: Agent = {
  id: "agent-seller-001",
  name: "NOVA",
  role: "seller",
  description: "Delivers deep multi-source research with citations.",
  tools: [
    { name: "search_data", credits: 1, description: "Quick data lookup" },
    { name: "summarize_data", credits: 5, description: "Summarize a topic" },
    {
      name: "research_data",
      credits: 10,
      description: "Deep research with citations",
    },
  ],
  stats: {
    totalSales: 47,
    repeatBuyers: 3,
    totalCreditsEarned: 234,
  },
};

export const BUYER_AGENT: Agent = {
  id: "agent-buyer-001",
  name: "ATLAS",
  role: "buyer",
  description:
    "Smart purchasing agent with ROI-based decision logic. Discovers, evaluates, and buys from the best sellers.",
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
    totalSales: 31,
    repeatBuyers: 5,
    totalCreditsEarned: 156,
  },
};

export const MARKETPLACE_PARTNERS: MarketplacePartner[] = [
  {
    id: "partner-1",
    teamName: "Team Quantum",
    agentName: "CIPHER",
    toolPurchased: "research_data",
    creditsSpent: 30,
    purchaseCount: 3,
  },
  {
    id: "partner-2",
    teamName: "Team Nebula",
    agentName: "HELIX",
    toolPurchased: "summarize_data",
    creditsSpent: 15,
    purchaseCount: 3,
  },
  {
    id: "partner-3",
    teamName: "Team Orbit",
    agentName: "ZENITH",
    toolPurchased: "search_data",
    creditsSpent: 5,
    purchaseCount: 5,
  },
  {
    id: "partner-4",
    teamName: "Team Flux",
    agentName: "PRISM",
    toolPurchased: "analyze_market",
    creditsSpent: 12,
    purchaseCount: 4,
  },
  {
    id: "partner-5",
    teamName: "Team Spark",
    agentName: "VORTEX",
    toolPurchased: "research_data",
    creditsSpent: 20,
    purchaseCount: 2,
  },
  {
    id: "partner-6",
    teamName: "Team Wave",
    agentName: "NEXUS",
    toolPurchased: "generate_report",
    creditsSpent: 24,
    purchaseCount: 3,
  },
];

export const INITIAL_STATS: LiveStats = {
  transactions: 47,
  volume: 234,
  uniqueTeams: 6,
};
