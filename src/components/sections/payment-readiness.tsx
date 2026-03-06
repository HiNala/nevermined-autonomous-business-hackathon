"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import type { PaymentStatus } from "@/types";

export function PaymentReadiness() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await fetch("/api/payment-status", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load payment status.");
        const data = (await response.json()) as PaymentStatus;
        if (active) { setStatus(data); setError(null); }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Failed to load status.");
      }
    }

    void loadStatus();
    return () => { active = false; };
  }, []);

  return (
    <section id="payments" className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
            Payment Readiness
          </h2>
          <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            Sandbox billing until Nevermined seller config is present, then auto-upgrades to live paid flow.
          </p>
        </div>
        <div
          className="glass-pill px-3 py-1.5"
          style={status?.ready ? {
            background: "rgba(34, 197, 94, 0.08)",
            borderColor: "rgba(34, 197, 94, 0.18)",
          } : {}}
        >
          <span className="font-mono text-[10px]" style={{ color: status?.ready ? "var(--green-400)" : "var(--gray-400)" }}>
            {status ? `${status.mode.toUpperCase()} MODE` : "CHECKING…"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass p-6">
          {error ? (
            <p className="text-[13px]" style={{ color: "var(--tx-debit)" }}>{error}</p>
          ) : status ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatusItem label="NVM API Key" value={status.configured.apiKey} />
                <StatusItem label="Plan ID" value={status.configured.planId} />
                <StatusItem label="Agent ID" value={status.configured.agentId} />
                <StatusItem label="Seller Endpoint" value={status.configured.sellerEndpoint} />
              </div>

              <div className="glass p-4" style={{ borderRadius: 12 }}>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                  Active References
                </p>
                <div className="space-y-1.5 font-mono text-[11px]" style={{ color: "var(--gray-500)" }}>
                  <p>env: {status.environment}</p>
                  <p>plan: {status.references.planId ?? "—"}</p>
                  <p>agent: {status.references.agentId ?? "—"}</p>
                  <p>seller: {status.references.sellerEndpoint ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--gray-500)" }}>Loading payment status…</p>
          )}
        </div>

        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={14} style={{ color: "var(--green-400)" }} />
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Launch Checklist
            </p>
          </div>
          <div className="space-y-3">
            <ChecklistItem text="Create your Nevermined plan for the seller endpoint." />
            <ChecklistItem text="Add NVM_API_KEY, NVM_PLAN_ID, NVM_AGENT_ID, NVM_SELLER_ENDPOINT." />
            <ChecklistItem text="Point the request form at your seller agent URL." />
            <ChecklistItem text="Run one real paid request and verify the live feed." />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        background: value ? "rgba(34, 197, 94, 0.06)" : "var(--glass-bg)",
        border: `1px solid ${value ? "rgba(34, 197, 94, 0.15)" : "var(--border-default)"}`,
      }}
    >
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {value ? (
          <CheckCircle size={12} style={{ color: "var(--green-400)" }} />
        ) : (
          <AlertCircle size={12} style={{ color: "var(--gray-400)" }} />
        )}
        <span className="text-[12px] font-medium" style={{ color: value ? "var(--green-400)" : "var(--gray-500)" }}>
          {value ? "Configured" : "Missing"}
        </span>
      </div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 size-1 rounded-full" style={{ background: "var(--green-400)", opacity: 0.6 }} />
      <span className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{text}</span>
    </div>
  );
}
