import {
  StudioAgent,
  StudioService,
} from "@/types";

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
    name: "STRATEGIST",
    specialty: "Planning & Structuring",
    summary: "Expands raw input into comprehensive structured briefs with search queries, scope, deliverables, and constraints.",
    outputs: ["Structured brief", "Search queries", "Scope & deliverables"],
    accentColor: "#7C3AED",
    ctaLabel: "Generate a brief",
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
    name: "RESEARCHER",
    specialty: "Web Research & Reporting",
    summary: "Searches and scrapes the web, analyzes sources, and produces detailed reports with citations.",
    outputs: ["Research report", "Source citations", "Key findings"],
    accentColor: "#0EA5E9",
    ctaLabel: "Run research sprint",
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
    specialty: "Marketplace Procurement",
    summary: "Discovers and purchases outputs from third-party agents on the Nevermined marketplace to enrich deliverables.",
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
    specialty: "Autonomous Order Fulfillment",
    summary: "Receives external buyer orders, plans fulfillment using AI reasoning, and delivers generated outputs via the internal pipeline.",
    outputs: ["Research reports", "Market analyses", "Strategic plans"],
    accentColor: "#EF4444",
    ctaLabel: "View store",
    startingCredits: 0,
    stats: {
      totalSales: 8,
      repeatBuyers: 2,
      totalCreditsEarned: 96,
    },
  },
];

