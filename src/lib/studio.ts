import { STUDIO_SERVICES } from "@/data/mock-transactions";
import type { IntakePreview, StudioService } from "@/types";

export function getStudioService(serviceId: string): StudioService | undefined {
  return STUDIO_SERVICES.find((service) => service.id === serviceId);
}

export function buildStudioPreview(
  service: StudioService,
  brief: string,
  contextUrl?: string | null
): IntakePreview {
  const normalizedBrief = brief.trim();
  const shortBrief =
    normalizedBrief.length > 180
      ? `${normalizedBrief.slice(0, 177).trimEnd()}...`
      : normalizedBrief;

  const contextLabel = contextUrl?.trim()
    ? `Context source provided: ${contextUrl.trim()}`
    : "No external source provided. The studio will work from the prompt alone.";

  return {
    serviceId: service.id,
    title: `${service.name} ready for delivery`,
    summary: `${service.summary} This run focuses on: ${shortBrief}`,
    highlights: [...service.outcomes, contextLabel],
    nextSteps: [
      "Confirm the scope and success criteria.",
      "Run the paid studio flow or test in demo mode.",
      `Expect delivery in ${service.turnaround}.`,
    ],
  };
}
