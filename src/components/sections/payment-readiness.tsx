"use client";

import { useEffect, useState } from "react";
import type { PaymentStatus } from "@/types";

export function PaymentReadiness() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/payment-status", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load payment status.");
        }

        const data = (await response.json()) as PaymentStatus;

        if (active) {
          setStatus(data);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load status.");
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="payments" className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Payment Readiness
          </h2>
          <p className="max-w-2xl text-sm" style={{ color: "var(--gray-600)" }}>
            The studio runs in demo mode until the Nevermined seller config is present, then
            upgrades to a real paid buyer-to-seller flow automatically.
          </p>
        </div>
        <div
          className="rounded-full border px-3 py-1 font-mono text-xs"
          style={{
            borderColor: status?.ready ? "var(--green-200)" : "var(--gray-200)",
            background: status?.ready ? "var(--green-50)" : "var(--bg-elevated)",
            color: status?.ready ? "var(--green-700)" : "var(--gray-600)",
          }}
        >
          {status ? `${status.mode.toUpperCase()} MODE` : "CHECKING STATUS"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: "var(--border-default)" }}
        >
          {error ? (
            <p className="text-sm" style={{ color: "var(--tx-debit)" }}>
              {error}
            </p>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatusItem label="NVM API key" value={status.configured.apiKey} />
                <StatusItem label="Plan ID" value={status.configured.planId} />
                <StatusItem label="Agent ID" value={status.configured.agentId} />
                <StatusItem label="Seller endpoint" value={status.configured.sellerEndpoint} />
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: "var(--border-default)",
                  background: "var(--bg-elevated)",
                }}
              >
                <p className="mb-2 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
                  Active references
                </p>
                <div className="space-y-2 font-mono text-xs" style={{ color: "var(--gray-600)" }}>
                  <p>Environment: {status.environment}</p>
                  <p>Plan ID: {status.references.planId ?? "missing"}</p>
                  <p>Agent ID: {status.references.agentId ?? "missing"}</p>
                  <p>Seller endpoint: {status.references.sellerEndpoint ?? "missing"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--gray-600)" }}>
              Loading payment status...
            </p>
          )}
        </div>

        <div
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: "var(--border-default)" }}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
            Launch checklist
          </p>
          <div className="space-y-3 text-sm" style={{ color: "var(--gray-700)" }}>
            <ChecklistItem text="Create your Nevermined plan for the seller endpoint." />
            <ChecklistItem text="Add NVM_API_KEY, NVM_PLAN_ID, NVM_AGENT_ID, and NVM_SELLER_ENDPOINT." />
            <ChecklistItem text="Point the request form at your seller-simple-agent or custom seller URL." />
            <ChecklistItem text="Run one real paid request and show it in the live feed during demo." />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: value ? "var(--green-200)" : "var(--border-default)",
        background: value ? "var(--green-50)" : "var(--bg-surface)",
      }}
    >
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: value ? "var(--green-700)" : "var(--gray-700)" }}>
        {value ? "Configured" : "Missing"}
      </p>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
      <span>{text}</span>
    </div>
  );
}
