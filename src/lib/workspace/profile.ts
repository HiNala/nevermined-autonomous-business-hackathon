/**
 * Workspace Profile — persistent memory layer for the Strategist agent.
 * Stores user/company context so every run feels smarter.
 * Server-side only; profile is held in memory (session-scoped) and
 * persisted via the /api/workspace/profile API route.
 */

export interface WorkspaceProfile {
  /** Short identifier, set by user */
  workspaceId: string;
  /** Company / team name */
  companyName?: string;
  /** Primary market or industry */
  market?: string;
  /** Product stage: idea | early | growth | scale */
  stage?: "idea" | "early" | "growth" | "scale";
  /** Primary geographic focus */
  geography?: string;
  /** Competitors the user tracks regularly */
  recurringCompetitors?: string[];
  /** Preferred depth: quick | standard | deep */
  preferredDepth?: "quick" | "standard" | "deep";
  /** Preferred output style: concise | balanced | detailed */
  preferredStyle?: "concise" | "balanced" | "detailed";
  /** Budget policy: conservative | normal | aggressive */
  budgetPolicy?: "conservative" | "normal" | "aggressive";
  /** Free-form extra context to inject into every brief */
  extraContext?: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

export const DEFAULT_PROFILE: WorkspaceProfile = {
  workspaceId: "default",
  updatedAt: new Date().toISOString(),
};

// ── In-memory store (one profile per workspace) ───────────────────────
const profiles = new Map<string, WorkspaceProfile>();

export function getProfile(workspaceId = "default"): WorkspaceProfile {
  return profiles.get(workspaceId) ?? { ...DEFAULT_PROFILE, workspaceId };
}

export function saveProfile(profile: WorkspaceProfile): WorkspaceProfile {
  const saved = { ...profile, updatedAt: new Date().toISOString() };
  profiles.set(profile.workspaceId, saved);
  return saved;
}

export function clearProfile(workspaceId = "default"): void {
  profiles.delete(workspaceId);
}

/**
 * Build a concise context string from the workspace profile to inject
 * into Strategist prompts. Returns empty string if nothing is set.
 */
export function buildProfileContext(profile: WorkspaceProfile): string {
  const parts: string[] = [];

  if (profile.companyName) parts.push(`Company: ${profile.companyName}`);
  if (profile.market) parts.push(`Market/industry: ${profile.market}`);
  if (profile.stage) parts.push(`Stage: ${profile.stage}`);
  if (profile.geography) parts.push(`Geographic focus: ${profile.geography}`);
  if (profile.recurringCompetitors?.length) {
    parts.push(`Recurring competitors to watch: ${profile.recurringCompetitors.join(", ")}`);
  }
  if (profile.preferredDepth) parts.push(`Preferred report depth: ${profile.preferredDepth}`);
  if (profile.preferredStyle) parts.push(`Preferred style: ${profile.preferredStyle}`);
  if (profile.budgetPolicy) parts.push(`Budget policy: ${profile.budgetPolicy}`);
  if (profile.extraContext) parts.push(`Additional context: ${profile.extraContext}`);

  if (parts.length === 0) return "";
  return `\n\nWorkspace context (apply to your brief):\n${parts.map((p) => `- ${p}`).join("\n")}`;
}
