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

export interface StudioService {
  id: string;
  name: string;
  credits: number;
  turnaround: string;
  summary: string;
  outcomes: string[];
}

export interface StudioAgent {
  id: string;
  name: string;
  specialty: string;
  summary: string;
  outputs: string[];
  accentColor: string;
  ctaLabel: string;
  startingCredits: number;
  stats: AgentStats;
  primary?: boolean;
}

export interface PaymentStatus {
  ready: boolean;
  environment: string;
  mode: "live" | "demo";
  configured: {
    apiKey: boolean;
    planId: boolean;
    agentId: boolean;
    sellerEndpoint: boolean;
  };
  references: {
    planId: string | null;
    agentId: string | null;
    sellerEndpoint: string | null;
  };
}

export interface IntakePreview {
  serviceId: string;
  title: string;
  summary: string;
  highlights: string[];
  nextSteps: string[];
}

export interface StudioSellerResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

export interface StudioRequestResponse {
  mode: "live" | "demo";
  paymentStatus: PaymentStatus;
  preview: IntakePreview;
  sellerResponse: StudioSellerResponse | null;
  error?: string;
}
