// VGS + Stripe configuration helpers

export function isVGSConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VGS_VAULT_ID &&
    process.env.VGS_PROXY_USERNAME &&
    process.env.VGS_PROXY_PASSWORD &&
    process.env.STRIPE_SECRET_KEY
  );
}

export function getVGSConfig() {
  return {
    vaultId: process.env.NEXT_PUBLIC_VGS_VAULT_ID || "",
    environment: (process.env.VGS_ENVIRONMENT || "sandbox") as "sandbox" | "live",
    proxyUsername: process.env.VGS_PROXY_USERNAME || "",
    proxyPassword: process.env.VGS_PROXY_PASSWORD || "",
  };
}

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  };
}

// Credit pricing: 1 credit ≈ $0.10 USD
export const CREDIT_PACKS = [
  { credits: 10, priceUsd: 1.00, label: "10 credits", popular: false },
  { credits: 50, priceUsd: 4.50, label: "50 credits", popular: true },
  { credits: 100, priceUsd: 8.00, label: "100 credits", popular: false },
  { credits: 500, priceUsd: 35.00, label: "500 credits", popular: false },
] as const;

export type CreditPack = (typeof CREDIT_PACKS)[number];
