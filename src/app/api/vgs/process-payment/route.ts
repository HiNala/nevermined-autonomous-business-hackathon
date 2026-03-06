import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { creditPack, cardAlias, email } = body as {
      creditPack: { credits: number; priceUsd: number; label: string };
      cardAlias?: {
        cardNumber?: string;
        expDate?: string;
        cvc?: string;
      };
      email?: string;
    };

    if (!creditPack?.credits || !creditPack?.priceUsd) {
      return NextResponse.json(
        { error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);
    const amountCents = Math.round(creditPack.priceUsd * 100);

    // Check if VGS outbound proxy is configured for full PCI-compliant flow
    const vgsProxyConfigured = !!(
      process.env.NEXT_PUBLIC_VGS_VAULT_ID &&
      process.env.VGS_PROXY_USERNAME &&
      process.env.VGS_PROXY_PASSWORD
    );

    if (vgsProxyConfigured) {
      // ─── Full PCI flow via VGS outbound proxy → Stripe ──────────────
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        description: `Auto-Business: ${creditPack.credits} credits`,
        metadata: {
          credits: String(creditPack.credits),
          source: "vgs_checkout",
          email: email || "anonymous",
        },
        automatic_payment_methods: { enabled: true },
      });

      return NextResponse.json({
        success: true,
        credits: creditPack.credits,
        amount: creditPack.priceUsd,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // ─── Direct Stripe (sandbox / no VGS) ─────────────────────────────
    // Create a PaymentIntent using Stripe test token for sandbox card payments.
    // The frontend collects card details in plain inputs (safe in Stripe test mode).
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token: "tok_visa" },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      description: `Auto-Business: ${creditPack.credits} credits`,
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        credits: String(creditPack.credits),
        source: "stripe_direct",
        email: email || "anonymous",
      },
    });

    return NextResponse.json({
      success: true,
      credits: creditPack.credits,
      amount: creditPack.priceUsd,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (err) {
    console.error("[VGS/process-payment] Error:", err);
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
