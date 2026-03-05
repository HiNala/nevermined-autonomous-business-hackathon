import "server-only";

import { Payments } from "@nevermined-io/payments";
import type { PaymentStatus } from "@/types";

const SUPPORTED_ENVIRONMENTS = ["sandbox", "live"] as const;
type NeverminedEnvironment = (typeof SUPPORTED_ENVIRONMENTS)[number];

function normalizeEnvValue(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getEnvironment(): NeverminedEnvironment {
  const env = normalizeEnvValue(process.env.NVM_ENVIRONMENT)?.toLowerCase();

  if (env === "live") {
    return "live";
  }

  return "sandbox";
}

export function getPaymentStatus(): PaymentStatus {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);
  const planId = normalizeEnvValue(process.env.NVM_PLAN_ID);
  const agentId = normalizeEnvValue(process.env.NVM_AGENT_ID);
  const sellerEndpoint = normalizeEnvValue(process.env.NVM_SELLER_ENDPOINT);
  const ready = Boolean(apiKey && planId && agentId && sellerEndpoint);

  return {
    ready,
    environment: getEnvironment(),
    mode: ready ? "live" : "demo",
    configured: {
      apiKey: Boolean(apiKey),
      planId: Boolean(planId),
      agentId: Boolean(agentId),
      sellerEndpoint: Boolean(sellerEndpoint),
    },
    references: {
      planId,
      agentId,
      sellerEndpoint,
    },
  };
}

export function getSellerConfig() {
  const status = getPaymentStatus();

  if (!status.ready) {
    return null;
  }

  return {
    planId: status.references.planId!,
    agentId: status.references.agentId!,
    sellerEndpoint: status.references.sellerEndpoint!,
  };
}

export function getPaymentsClient() {
  const apiKey = normalizeEnvValue(process.env.NVM_API_KEY);

  if (!apiKey) {
    return null;
  }

  return Payments.getInstance({
    nvmApiKey: apiKey,
    environment: getEnvironment() as string as Parameters<typeof Payments.getInstance>[0]["environment"],
  });
}
