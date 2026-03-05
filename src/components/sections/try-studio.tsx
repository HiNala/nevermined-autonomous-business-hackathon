"use client";

import { type CSSProperties, FormEvent, useMemo, useState } from "react";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";
import { Send, Terminal } from "lucide-react";
import type { StudioRequestResponse } from "@/types";

const inputStyle: CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border-default)",
  color: "var(--gray-800)",
};

export function TryStudio() {
  const [serviceId, setServiceId] = useState(STUDIO_SERVICES[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [contextUrl, setContextUrl] = useState("");
  const [response, setResponse] = useState<StudioRequestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(
    () => STUDIO_SERVICES.find((s) => s.id === serviceId) ?? STUDIO_SERVICES[0],
    [serviceId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const apiResponse = await fetch("/api/studio-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, brief, contextUrl }),
      });
      const data = (await apiResponse.json()) as StudioRequestResponse | { error?: string };

      if (!("preview" in data)) {
        throw new Error(data.error ?? "Request failed.");
      }

      setResponse(data);

      if (!apiResponse.ok) {
        setError(data.error ?? "Seller call failed, but the request preview was generated.");
      }
    } catch (submitError) {
      setResponse(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected failure.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="try-studio" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
            Try The Studio
          </h2>
          <p className="max-w-xl text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
            Submit a brief, choose a specialist, and route through the paid studio flow.
          </p>
        </div>
        {selectedService ? (
          <div className="glass-pill px-3 py-1.5">
            <span className="font-mono text-[10px]" style={{ color: "var(--accent-400)" }}>
              {selectedService.name} · {formatCredits(selectedService.credits)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.95fr]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="glass p-6">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>Service</span>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[rgba(201,125,78,0.40)]"
                style={inputStyle}
              >
                {STUDIO_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>Context URL</span>
              <input
                type="url"
                value={contextUrl}
                onChange={(e) => setContextUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[rgba(201,125,78,0.40)]"
                style={inputStyle}
              />
            </label>
          </div>

          <label className="mb-4 block space-y-1.5">
            <span className="text-[12px] font-medium" style={{ color: "var(--gray-600)" }}>Brief</span>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Describe what you need — research, a plan, or a design spec…"
              rows={6}
              className="w-full rounded-xl px-4 py-3 text-[13px] leading-relaxed outline-none transition-colors focus:border-[rgba(201,125,78,0.40)]"
              style={inputStyle}
              required
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px]" style={{ color: "var(--gray-400)" }}>
              Demo returns a preview. Live pays and calls your seller.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !serviceId || !brief.trim()}
              className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                boxShadow: "0 0 20px -4px rgba(201, 125, 78, 0.30)",
              }}
            >
              {isSubmitting ? "Routing…" : "Run request"}
              <Send size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        {/* Output */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2">
            <Terminal size={13} style={{ color: "var(--gray-400)" }} />
            <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
              Output
            </p>
          </div>

          {error ? (
            <p className="mb-4 text-[13px]" style={{ color: "var(--tx-debit)" }}>{error}</p>
          ) : null}

          {response ? (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
                    style={{
                      background: response.mode === "live" ? "rgba(201, 125, 78, 0.10)" : "var(--glass-bg)",
                      border: `1px solid ${response.mode === "live" ? "rgba(201, 125, 78, 0.20)" : "var(--border-default)"}`,
                      color: response.mode === "live" ? "var(--accent-400)" : "var(--gray-500)",
                    }}
                  >
                    {response.mode}
                  </span>
                  {response.sellerResponse ? (
                    <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                      status {response.sellerResponse.status}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
                  {response.preview.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--gray-500)" }}>
                  {response.preview.summary}
                </p>
              </div>

              <OutputList label="Highlights" items={response.preview.highlights} />
              <OutputList label="Next Steps" items={response.preview.nextSteps} />

              {response.sellerResponse ? (
                <div className="glass p-4" style={{ borderRadius: 12 }}>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                    Seller Response
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px]" style={{ color: "var(--gray-500)" }}>
                    {JSON.stringify(response.sellerResponse.body, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--gray-500)" }}>
              Submit a brief to preview the delivery structure and verify the payment path.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function OutputList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
        {label}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <span className="mt-1.5 size-1 rounded-full" style={{ background: "var(--accent-400)", opacity: 0.6 }} />
            <span className="text-[12px] leading-relaxed" style={{ color: "var(--gray-500)" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
