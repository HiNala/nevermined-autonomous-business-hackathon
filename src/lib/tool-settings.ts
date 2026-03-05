/**
 * Tool Settings — per-agent configuration for search & scrape providers.
 * Stored in localStorage on the client, passed to server via request body.
 */

export type SearchProvider = "exa" | "apify" | "duckduckgo";
export type ScrapeProvider = "exa" | "apify" | "raw";

export interface AgentToolSettings {
  search: SearchProvider;
  scrape: ScrapeProvider;
}

export interface TradingSettings {
  /** Allow internal agent-to-agent credit transactions (Strategist ↔ Researcher). Default: true */
  internalTrading: boolean;
  /** Allow external marketplace purchases from third-party agents via Nevermined. Default: true */
  externalTrading: boolean;
}

export interface ToolSettings {
  strategist: AgentToolSettings;
  researcher: AgentToolSettings;
  trading: TradingSettings;
}

const STORAGE_KEY = "auto_business_tool_settings";

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  strategist: { search: "exa", scrape: "exa" },
  researcher: { search: "apify", scrape: "apify" },
  trading: { internalTrading: true, externalTrading: true },
};

/** Load tool settings from localStorage (client-only). */
export function loadToolSettings(): ToolSettings {
  if (typeof window === "undefined") return DEFAULT_TOOL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOOL_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ToolSettings>;
    return {
      strategist: { ...DEFAULT_TOOL_SETTINGS.strategist, ...parsed.strategist },
      researcher: { ...DEFAULT_TOOL_SETTINGS.researcher, ...parsed.researcher },
      trading: { ...DEFAULT_TOOL_SETTINGS.trading, ...parsed.trading },
    };
  } catch {
    return DEFAULT_TOOL_SETTINGS;
  }
}

/** Save tool settings to localStorage (client-only). */
export function saveToolSettings(settings: ToolSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable
  }
}
