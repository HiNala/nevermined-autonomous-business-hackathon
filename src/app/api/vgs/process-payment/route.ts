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

    // ─── Demo Mode (no VGS vault configured) ───────────────────────
    // If VGS proxy is not configured, simulate payment for demo/hackathon
    const vgsConfigured = !!(
      process.env.NEXT_PUBLIC_VGS_VAULT_ID &&
      process.env.VGS_PROXY_USERNAME &&
      process.env.VGS_PROXY_PASSWORD
    );

    if (!vgsConfigured) {
      // Demo mode — simulate a successful payment
      return NextResponse.json({
        success: true,
        demo: true,
        credits: creditPack.credits,
        amount: creditPack.priceUsd,
        message: `Demo: ${creditPack.credits} credits added (no real charge)`,
        paymentId: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      });
    }

    // ─── Real Payment via VGS → Stripe ──────────────────────────────
    // In production, the VGS outbound proxy intercepts the request to Stripe
    // and replaces aliased card data with real PAN before it reaches Stripe.
    // For now, we use Stripe PaymentIntents with automatic payment methods.

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      description: `Auto-Business: ${creditPack.credits} credits`,
      metadata: {
        credits: String(creditPack.credits),
        source: "vgs_checkout",
        email: email || "anonymous",
      },
      // In full VGS integration, we would create a PaymentMethod from the
      // aliased card data via the VGS outbound proxy. For the MVP, we
      // return the client_secret so the frontend can confirm with Stripe.js
      // if needed, or we process via VGS outbound proxy server-side.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      demo: false,
      credits: creditPack.credits,
      amount: creditPack.priceUsd,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("[VGS/process-payment] Error:", err);
    const message = err instanceof Error ? err.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
