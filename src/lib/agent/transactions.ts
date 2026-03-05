import "server-only";

export interface AgentTransaction {
  id: string;
  timestamp: string;
  from: { id: string; name: string };
  to: { id: string; name: string };
  credits: number;
  purpose: string;
  artifactId: string;
  status: "pending" | "completed" | "failed";
  durationMs?: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
  creditsEarned: number;
  creditsSpent: number;
  requestsHandled: number;
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  strategist: {
    id: "strategist",
    name: "Strategist",
    role: "Planning & Structuring",
    description: "Takes raw input and expands it into comprehensive structured briefs with search queries, scope, and deliverables.",
    avatar: "◆",
    color: "#7C3AED",
    creditsEarned: 0,
    creditsSpent: 0,
    requestsHandled: 0,
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    role: "Web Research & Reporting",
    description: "Searches and scrapes the web, analyzes sources, and produces detailed structured reports with citations.",
    avatar: "◈",
    color: "#0EA5E9",
    creditsEarned: 0,
    creditsSpent: 0,
    requestsHandled: 0,
  },
  buyer: {
    id: "buyer",
    name: "Buyer",
    role: "Marketplace Procurement",
    description: "Discovers, purchases, and retrieves outputs from third-party agents and services on the Nevermined marketplace.",
    avatar: "◎",
    color: "#F59E0B",
    creditsEarned: 0,
    creditsSpent: 0,
    requestsHandled: 0,
  },
  seller: {
    id: "seller",
    name: "Seller",
    role: "Marketplace Sales",
    description: "Receives external buyer orders, plans fulfillment using the internal pipeline, and delivers generated outputs to the marketplace.",
    avatar: "◇",
    color: "#EF4444",
    creditsEarned: 0,
    creditsSpent: 0,
    requestsHandled: 0,
  },
};

type TxListener = (tx: AgentTransaction) => void;

class TransactionLedger {
  private transactions: AgentTransaction[] = [];
  private listeners: Set<TxListener> = new Set();
  private maxTransactions = 200;

  record(tx: AgentTransaction) {
    this.transactions.push(tx);
    if (this.transactions.length > this.maxTransactions) {
      this.transactions = this.transactions.slice(-this.maxTransactions);
    }

    // Update agent profiles
    const from = AGENT_PROFILES[tx.from.id];
    const to = AGENT_PROFILES[tx.to.id];
    if (from && tx.status === "completed") {
      from.creditsSpent += tx.credits;
    }
    if (to && tx.status === "completed") {
      to.creditsEarned += tx.credits;
      to.requestsHandled += 1;
    }

    for (const listener of this.listeners) {
      try {
        listener(tx);
      } catch {
        // ignore
      }
    }
  }

  getRecent(count: number = 20): AgentTransaction[] {
    return this.transactions.slice(-count);
  }

  getByAgent(agentId: string, count: number = 20): AgentTransaction[] {
    return this.transactions
      .filter((tx) => tx.from.id === agentId || tx.to.id === agentId)
      .slice(-count);
  }

  subscribe(listener: TxListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  get stats() {
    const completed = this.transactions.filter((tx) => tx.status === "completed");
    return {
      totalTransactions: completed.length,
      totalCreditsFlowed: completed.reduce((sum, tx) => sum + tx.credits, 0),
      agents: { ...AGENT_PROFILES },
    };
  }
}

export const ledger = new TransactionLedger();
