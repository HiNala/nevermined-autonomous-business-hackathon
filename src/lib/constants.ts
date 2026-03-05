export const SITE_NAME = "AUTO BUSINESS";
export const SITE_DESCRIPTION =
  "A multi-agent studio — Strategist plans, Researcher discovers, Buyer procures, Seller fulfills — powered by Nevermined payments.";

export const NAV_HEIGHT = 56;
export const MAX_FEED_ITEMS = 20;
export const STAT_UPDATE_INTERVAL_MS = 3000;
export const FEED_UPDATE_INTERVAL_MS = 4000;

export const AGENT_ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
} as const;

export const TX_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  FAILED: "failed",
} as const;
