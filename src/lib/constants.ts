export const SITE_NAME = "NVM MARKET";
export const SITE_DESCRIPTION =
  "A live agent economy running on Nevermined. Watch your agents transact — or build something that trades with ours.";

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
