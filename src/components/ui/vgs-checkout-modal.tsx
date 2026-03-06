"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  X,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";

// ─── Credit Packs ───────────────────────────────────────────────────
const CREDIT_PACKS = [
  { credits: 10, priceUsd: 1.0, label: "10 credits", popular: false },
  { credits: 50, priceUsd: 4.5, label: "50 credits", popular: true },
  { credits: 100, priceUsd: 8.0, label: "100 credits", popular: false },
  { credits: 500, priceUsd: 35.0, label: "500 credits", popular: false },
] as const;

type CreditPack = (typeof CREDIT_PACKS)[number];

// ─── Types ──────────────────────────────────────────────────────────
interface VGSCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (credits: number, paymentId: string) => void;
  context?: {
    title?: string;
    description?: string;
  };
}

type CheckoutStep = "select" | "payment" | "processing" | "success" | "error";

// ─── VGS Collect types (loaded from CDN) ────────────────────────────
interface VGSCollectInstance {
  field: (selector: string, config: Record<string, unknown>) => VGSField;
  submit: (
    path: string,
    options: Record<string, unknown>,
    successCb: (status: number, data: unknown) => void,
    errorCb: (errors: unknown) => void
  ) => void;
}

interface VGSField {
  loadingState: "loading" | "loaded" | "failed";
}

declare global {
  interface Window {
    VGSCollect?: {
      create: (
        vaultId: string,
        environment: string,
        callback?: (state: unknown) => void
      ) => VGSCollectInstance;
    };
  }
}

// ─── Component ──────────────────────────────────────────────────────
export function VGSCheckoutModal({
  open,
  onClose,
  onSuccess,
  context,
}: VGSCheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>("select");
  const [selectedPack, setSelectedPack] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState<{
    credits: number;
    paymentId: string;
    demo: boolean;
  } | null>(null);
  const [vgsReady, setVgsReady] = useState(false);
  const [vgsConfigured, setVgsConfigured] = useState<boolean | null>(null);
  const formRef = useRef<VGSCollectInstance | null>(null);
  const scriptLoadedRef = useRef(false);

  // Check if VGS is configured
  useEffect(() => {
    if (!open) return;
    fetch("/api/vgs/config")
      .then((r) => r.json())
      .then((d) => setVgsConfigured(d.configured))
      .catch(() => setVgsConfigured(false));
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("select");
      setError("");
      setPaymentResult(null);
      setSelectedPack(CREDIT_PACKS[1]);
    }
  }, [open]);

  // Load VGS Collect.js script
  const loadVGSScript = useCallback(() => {
    if (scriptLoadedRef.current || typeof window === "undefined") return;
    if (document.querySelector('script[src*="vgs-collect"]')) {
      scriptLoadedRef.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://js.verygoodvault.com/vgs-collect/2.24.0/vgs-collect.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
    };
    document.head.appendChild(script);
  }, []);

  // Initialize VGS form when entering payment step
  useEffect(() => {
    if (step !== "payment" || !vgsConfigured) return;

    loadVGSScript();

    // Wait for script to load then init form
    const interval = setInterval(() => {
      if (window.VGSCollect) {
        clearInterval(interval);
        initVGSForm();
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.VGSCollect) {
        // Script failed to load — still allow demo mode
        setVgsReady(true);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, vgsConfigured]);

  function initVGSForm() {
    const vaultId = process.env.NEXT_PUBLIC_VGS_VAULT_ID;
    const env = process.env.VGS_ENVIRONMENT || "sandbox";

    if (!vaultId || !window.VGSCollect) {
      setVgsReady(true); // Fall through to demo mode
      return;
    }

    try {
      const form = window.VGSCollect.create(vaultId, env, () => {});
      formRef.current = form;

      const fieldCSS = {
        "box-sizing": "border-box",
        "&::placeholder": { color: "#9ca3af" },
        color: "#1f2937",
        "font-family": "ui-monospace, SFMono-Regular, monospace",
        "font-size": "14px",
        padding: "0 12px",
        height: "100%",
        width: "100%",
      };

      form.field("#cc-number", {
        type: "card-number",
        name: "card_number",
        placeholder: "4111 1111 1111 1111",
        validations: ["required", "validCardNumber"],
        showCardIcon: true,
        css: fieldCSS,
      });

      form.field("#cc-expiry", {
        type: "card-expiration-date",
        name: "card_expiry",
        placeholder: "MM / YY",
        validations: ["required", "validCardExpirationDate"],
        yearLength: 2,
        css: fieldCSS,
      });

      form.field("#cc-cvc", {
        type: "card-security-code",
        name: "card_cvc",
        placeholder: "CVC",
        validations: ["required", "validCardSecurityCode"],
        css: fieldCSS,
      });

      setVgsReady(true);
    } catch (e) {
      console.error("[VGS] Init error:", e);
      setVgsReady(true); // Allow demo fallback
    }
  }

  // ─── Process Payment ──────────────────────────────────────────────
  async function handlePayment() {
    setStep("processing");
    setError("");

    try {
      const res = await fetch("/api/vgs/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creditPack: {
            credits: selectedPack.credits,
            priceUsd: selectedPack.priceUsd,
            label: selectedPack.label,
          },
          email: email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Payment failed");
      }

      setPaymentResult({
        credits: data.credits,
        paymentId: data.paymentIntentId || data.paymentId || "unknown",
        demo: data.demo || false,
      });
      setStep("success");
      onSuccess?.(data.credits, data.paymentIntentId || data.paymentId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStep("error");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl animate-fade-up"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-lg"
              style={{
                background: "rgba(201, 125, 78, 0.10)",
                border: "1px solid rgba(201, 125, 78, 0.20)",
              }}
            >
              <CreditCard size={16} style={{ color: "var(--accent-400)" }} />
            </div>
            <div>
              <h3
                className="text-[15px] font-semibold"
                style={{ color: "var(--gray-800)" }}
              >
                {step === "success"
                  ? "Payment Complete"
                  : step === "error"
                  ? "Payment Failed"
                  : "Buy Credits"}
              </h3>
              {context?.title && step === "select" && (
                <p
                  className="text-[11px]"
                  style={{ color: "var(--gray-400)" }}
                >
                  {context.title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-70"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
            }}
          >
            <X size={14} style={{ color: "var(--gray-500)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {step === "select" && (
            <SelectStep
              selected={selectedPack}
              onSelect={setSelectedPack}
              onNext={() => setStep("payment")}
            />
          )}

          {step === "payment" && (
            <PaymentStep
              pack={selectedPack}
              email={email}
              onEmailChange={setEmail}
              vgsReady={vgsReady}
              vgsConfigured={!!vgsConfigured}
              onBack={() => setStep("select")}
              onPay={handlePayment}
            />
          )}

          {step === "processing" && (
            <ProcessingStep pack={selectedPack} />
          )}

          {step === "success" && paymentResult && (
            <SuccessStep result={paymentResult} onClose={onClose} />
          )}

          {step === "error" && (
            <ErrorStep
              error={error}
              onRetry={() => setStep("payment")}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer — security badge */}
        <div
          className="flex items-center justify-center gap-2 border-t px-5 py-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          <Shield size={11} style={{ color: "var(--gray-400)" }} />
          <span
            className="text-[10px]"
            style={{ color: "var(--gray-400)" }}
          >
            Secured by VGS · PCI DSS Level 1 · Card data never touches our
            servers
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SelectStep({
  selected,
  onSelect,
  onNext,
}: {
  selected: CreditPack;
  onSelect: (p: CreditPack) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p
        className="mb-4 text-[13px] leading-relaxed"
        style={{ color: "var(--gray-500)" }}
      >
        Choose a credit pack. Credits are used to run agent tasks —
        research, strategy, marketplace operations.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {CREDIT_PACKS.map((pack) => {
          const active = selected.credits === pack.credits;
          return (
            <button
              key={pack.credits}
              onClick={() => onSelect(pack)}
              className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-4 transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: active
                  ? "rgba(201, 125, 78, 0.08)"
                  : "var(--bg-elevated)",
                border: `1.5px solid ${
                  active
                    ? "rgba(201, 125, 78, 0.35)"
                    : "var(--border-default)"
                }`,
                boxShadow: active
                  ? "0 2px 12px -4px rgba(201, 125, 78, 0.15)"
                  : "none",
              }}
            >
              {pack.popular && (
                <span
                  className="absolute -top-2 right-2 rounded-full px-2 py-0.5 font-mono text-[8px] font-bold uppercase"
                  style={{
                    background: "rgba(201, 125, 78, 0.12)",
                    color: "var(--accent-400)",
                    border: "1px solid rgba(201, 125, 78, 0.22)",
                  }}
                >
                  popular
                </span>
              )}
              <Zap
                size={16}
                style={{
                  color: active ? "var(--accent-400)" : "var(--gray-400)",
                }}
              />
              <span
                className="text-[18px] font-bold"
                style={{
                  color: active ? "var(--accent-400)" : "var(--gray-700)",
                }}
              >
                {pack.credits}
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: "var(--gray-400)" }}
              >
                ${pack.priceUsd.toFixed(2)} USD
              </span>
              <span
                className="font-mono text-[9px]"
                style={{ color: "var(--gray-300)" }}
              >
                ${(pack.priceUsd / pack.credits).toFixed(3)}/cr
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:scale-[1.01]"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
          boxShadow: "0 4px 16px -4px rgba(201, 125, 78, 0.35)",
        }}
      >
        <CreditCard size={15} />
        Continue — ${selected.priceUsd.toFixed(2)}
      </button>
    </div>
  );
}

function PaymentStep({
  pack,
  email,
  onEmailChange,
  vgsReady,
  vgsConfigured,
  onBack,
  onPay,
}: {
  pack: CreditPack;
  email: string;
  onEmailChange: (v: string) => void;
  vgsReady: boolean;
  vgsConfigured: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const fieldStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    borderRadius: "10px",
    height: "44px",
    overflow: "hidden",
  };

  return (
    <div>
      {/* Summary */}
      <div
        className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
        style={{
          background: "rgba(201, 125, 78, 0.05)",
          border: "1px solid rgba(201, 125, 78, 0.12)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: "var(--accent-400)" }} />
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--gray-700)" }}
          >
            {pack.credits} credits
          </span>
        </div>
        <span
          className="font-mono text-[14px] font-bold"
          style={{ color: "var(--accent-400)" }}
        >
          ${pack.priceUsd.toFixed(2)}
        </span>
      </div>

      {/* Demo mode badge */}
      {!vgsConfigured && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: "rgba(234, 179, 8, 0.06)",
            border: "1px solid rgba(234, 179, 8, 0.15)",
          }}
        >
          <AlertCircle size={12} style={{ color: "#EAB308" }} />
          <span className="text-[11px]" style={{ color: "#B45309" }}>
            Demo Mode — no real charges will be made
          </span>
        </div>
      )}

      {/* Email */}
      <div className="mb-3">
        <label
          className="mb-1.5 block text-[11px] font-medium"
          style={{ color: "var(--gray-500)" }}
        >
          Email (optional, for receipt)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
            color: "var(--gray-800)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,125,78,0.45)";
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(201,125,78,0.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-default)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Card fields (VGS secure iframes or demo placeholders) */}
      <div className="mb-3">
        <label
          className="mb-1.5 block text-[11px] font-medium"
          style={{ color: "var(--gray-500)" }}
        >
          Card Number
        </label>
        {vgsConfigured ? (
          <div id="cc-number" style={fieldStyle} />
        ) : (
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            disabled
            className="w-full rounded-xl px-4 py-2.5 font-mono text-[13px] outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--gray-400)",
            }}
          />
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label
            className="mb-1.5 block text-[11px] font-medium"
            style={{ color: "var(--gray-500)" }}
          >
            Expiry
          </label>
          {vgsConfigured ? (
            <div id="cc-expiry" style={fieldStyle} />
          ) : (
            <input
              type="text"
              placeholder="12 / 30"
              disabled
              className="w-full rounded-xl px-4 py-2.5 font-mono text-[13px] outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--gray-400)",
              }}
            />
          )}
        </div>
        <div>
          <label
            className="mb-1.5 block text-[11px] font-medium"
            style={{ color: "var(--gray-500)" }}
          >
            CVC
          </label>
          {vgsConfigured ? (
            <div id="cc-cvc" style={fieldStyle} />
          ) : (
            <input
              type="text"
              placeholder="123"
              disabled
              className="w-full rounded-xl px-4 py-2.5 font-mono text-[13px] outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                color: "var(--gray-400)",
              }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl py-3 text-[13px] font-medium transition-all"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--gray-500)",
          }}
        >
          Back
        </button>
        <button
          onClick={onPay}
          disabled={!vgsReady && vgsConfigured}
          className="flex flex-2 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:scale-[1.01] disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
            boxShadow: "0 4px 16px -4px rgba(201, 125, 78, 0.35)",
          }}
        >
          <CreditCard size={14} />
          Pay ${pack.priceUsd.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

function ProcessingStep({ pack }: { pack: CreditPack }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div
        className="relative flex size-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(201, 125, 78, 0.08)",
          border: "1px solid rgba(201, 125, 78, 0.15)",
        }}
      >
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--accent-400)" }}
        />
      </div>
      <div>
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--gray-800)" }}
        >
          Processing Payment
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "var(--gray-400)" }}>
          Securing ${pack.priceUsd.toFixed(2)} for {pack.credits} credits…
        </p>
      </div>
      <div
        className="h-[2px] w-32 overflow-hidden rounded-full"
        style={{ background: "rgba(201, 125, 78, 0.10)" }}
      >
        <div
          className="h-full w-[40%] rounded-full"
          style={{
            background: "var(--accent-400)",
            animation: "progress-indeterminate 1.8s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

function SuccessStep({
  result,
  onClose,
}: {
  result: { credits: number; paymentId: string; demo: boolean };
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-up">
      <div
        className="flex size-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.20)",
        }}
      >
        <CheckCircle size={28} style={{ color: "#22C55E" }} />
      </div>
      <div>
        <p
          className="text-[17px] font-bold"
          style={{ color: "var(--gray-800)" }}
        >
          {result.credits} Credits Added!
        </p>
        {result.demo && (
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "rgba(234, 179, 8, 0.08)",
              color: "#B45309",
              border: "1px solid rgba(234, 179, 8, 0.15)",
            }}
          >
            Demo Mode
          </span>
        )}
        <p className="mt-2 text-[12px]" style={{ color: "var(--gray-400)" }}>
          Payment ID: {result.paymentId.slice(0, 20)}…
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 flex items-center gap-2 rounded-xl px-8 py-2.5 text-[13px] font-semibold text-white transition-all hover:scale-[1.01]"
        style={{
          background:
            "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
        }}
      >
        <Sparkles size={13} />
        Start Using Credits
      </button>
    </div>
  );
}

function ErrorStep({
  error,
  onRetry,
  onClose,
}: {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div
        className="flex size-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.20)",
        }}
      >
        <AlertCircle size={28} style={{ color: "#EF4444" }} />
      </div>
      <div>
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--gray-800)" }}
        >
          Payment Failed
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "#EF4444" }}>
          {error}
        </p>
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={onClose}
          className="rounded-xl px-5 py-2.5 text-[13px] font-medium transition-all"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--gray-500)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
