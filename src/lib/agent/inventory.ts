import "server-only";

// ─── Product Catalog ─────────────────────────────────────────────────
// Products are prompt-backed outputs the Seller agent can generate on-the-fly
// using the internal pipeline (Strategist → Researcher → optional Buyer).

export type ProductCategory =
  | "research_report"
  | "market_analysis"
  | "competitive_intel"
  | "strategic_plan"
  | "prd"
  | "technical_report"
  | "custom";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  /** The prompt template used to generate this product on demand */
  promptTemplate: string;
  /** Output type passed to the Strategist */
  outputType: "research" | "prd" | "plan" | "analysis" | "general";
  /** Base credit cost to the buyer */
  price: number;
  /** Whether the researcher may need to buy from 3rd parties */
  mayRequireExternalData: boolean;
  /** Tags for marketplace discovery */
  tags: string[];
  /** Whether this product is currently available */
  active: boolean;
}

export interface ThirdPartyService {
  id: string;
  did: string;
  name: string;
  description: string;
  provider: string;
  endpoint?: string;
  priceCredits: number;
  type: "dataset" | "report" | "model" | "service" | "other";
  tags: string[];
  /** When this entry was last updated */
  updatedAt: string;
  /** Whether this service is currently reachable */
  active: boolean;
}

// ─── Default Product Catalog ─────────────────────────────────────────

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-research-report",
    name: "Deep Research Report",
    description:
      "Comprehensive multi-source research report with citations, key findings, and actionable recommendations on any topic.",
    category: "research_report",
    promptTemplate:
      "Produce a comprehensive research report on: {{query}}. Include market data, trends, key players, and citations.",
    outputType: "research",
    price: 10,
    mayRequireExternalData: true,
    tags: ["research", "report", "analysis", "citations"],
    active: true,
  },
  {
    id: "prod-market-analysis",
    name: "Market Analysis",
    description:
      "In-depth market analysis including TAM/SAM/SOM, competitive landscape, market trends, and entry strategy recommendations.",
    category: "market_analysis",
    promptTemplate:
      "Produce a detailed market analysis for: {{query}}. Include market size, growth trends, competitive landscape, and strategic recommendations.",
    outputType: "analysis",
    price: 12,
    mayRequireExternalData: true,
    tags: ["market", "analysis", "competitive", "strategy"],
    active: true,
  },
  {
    id: "prod-competitive-intel",
    name: "Competitive Intelligence Brief",
    description:
      "Detailed competitive intelligence report comparing key players, their strengths, weaknesses, pricing, and positioning.",
    category: "competitive_intel",
    promptTemplate:
      "Produce a competitive intelligence brief for: {{query}}. Compare top players, analyze positioning, pricing, strengths, and weaknesses.",
    outputType: "analysis",
    price: 10,
    mayRequireExternalData: true,
    tags: ["competitive", "intelligence", "comparison", "positioning"],
    active: true,
  },
  {
    id: "prod-strategic-plan",
    name: "Strategic Plan",
    description:
      "Go-to-market or strategic plan with milestones, dependencies, risk assessment, and resource allocation.",
    category: "strategic_plan",
    promptTemplate:
      "Create a strategic plan for: {{query}}. Include milestones, dependencies, risk assessment, and key decision points.",
    outputType: "plan",
    price: 15,
    mayRequireExternalData: false,
    tags: ["strategy", "plan", "roadmap", "milestones"],
    active: true,
  },
  {
    id: "prod-prd",
    name: "Product Requirements Document",
    description:
      "Full PRD with user stories, technical requirements, acceptance criteria, and implementation timeline.",
    category: "prd",
    promptTemplate:
      "Write a comprehensive Product Requirements Document for: {{query}}. Include user stories, technical specs, and acceptance criteria.",
    outputType: "prd",
    price: 12,
    mayRequireExternalData: false,
    tags: ["prd", "product", "requirements", "engineering"],
    active: true,
  },
  {
    id: "prod-technical-report",
    name: "Technical Research Report",
    description:
      "Deep technical report covering architecture, implementation approaches, benchmarks, and trade-off analysis.",
    category: "technical_report",
    promptTemplate:
      "Produce a technical research report on: {{query}}. Include architecture options, implementation approaches, benchmarks, and trade-offs.",
    outputType: "research",
    price: 10,
    mayRequireExternalData: true,
    tags: ["technical", "engineering", "architecture", "benchmarks"],
    active: true,
  },
];

// ─── In-memory catalog store ─────────────────────────────────────────

class Catalog {
  private products: Map<string, Product> = new Map();
  private thirdPartyServices: Map<string, ThirdPartyService> = new Map();

  constructor() {
    for (const p of DEFAULT_PRODUCTS) {
      this.products.set(p.id, p);
    }
  }

  // ── Products ──────────────────────────────────────────────────────

  listProducts(activeOnly = true): Product[] {
    const all = Array.from(this.products.values());
    return activeOnly ? all.filter((p) => p.active) : all;
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  findProducts(query: string, tags?: string[]): Product[] {
    const q = query.toLowerCase();
    return this.listProducts().filter((p) => {
      const textMatch =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q));
      const tagMatch = !tags?.length || tags.some((t) => p.tags.includes(t));
      return textMatch && tagMatch;
    });
  }

  addProduct(product: Product): void {
    this.products.set(product.id, product);
  }

  removeProduct(id: string): boolean {
    return this.products.delete(id);
  }

  // ── Third-Party Services ──────────────────────────────────────────

  listServices(activeOnly = true): ThirdPartyService[] {
    const all = Array.from(this.thirdPartyServices.values());
    return activeOnly ? all.filter((s) => s.active) : all;
  }

  getService(id: string): ThirdPartyService | undefined {
    return this.thirdPartyServices.get(id);
  }

  findServices(query: string): ThirdPartyService[] {
    const q = query.toLowerCase();
    return this.listServices().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q))
    );
  }

  addService(service: ThirdPartyService): void {
    this.thirdPartyServices.set(service.id, service);
  }

  removeService(id: string): boolean {
    return this.thirdPartyServices.delete(id);
  }

  /**
   * Bulk-import services (used when hackathon organizer updates the list).
   * Merges with existing — new entries added, existing entries updated.
   */
  importServices(services: ThirdPartyService[]): number {
    let count = 0;
    for (const s of services) {
      this.thirdPartyServices.set(s.id, s);
      count++;
    }
    return count;
  }
}

export const catalog = new Catalog();
