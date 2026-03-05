export interface Transaction {
  id: string;
  timestamp: Date;
  buyer: string;
  seller: string;
  tool: string;
  credits: number;
  status: "completed" | "pending" | "failed";
}

export interface Agent {
  id: string;
  name: string;
  role: "buyer" | "seller";
  description: string;
  tools: AgentTool[];
  stats: AgentStats;
}

export interface AgentTool {
  name: string;
  credits: number;
  description: string;
}

export interface AgentStats {
  totalSales: number;
  repeatBuyers: number;
  totalCreditsEarned: number;
}

export interface MarketplacePartner {
  id: string;
  teamName: string;
  agentName: string;
  toolPurchased: string;
  creditsSpent: number;
  purchaseCount: number;
}

export interface LiveStats {
  transactions: number;
  volume: number;
  uniqueTeams: number;
}
