"use client";

import { FormEvent, useMemo, useState } from "react";
import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";
import type { StudioRequestResponse } from "@/types";

export function TryStudio() {
  const [serviceId, setServiceId] = useState(STUDIO_SERVICES[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [contextUrl, setContextUrl] = useState("");
  const [response, setResponse] = useState<StudioRequestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(
    () => STUDIO_SERVICES.find((service) => service.id === serviceId) ?? STUDIO_SERVICES[0],
    [serviceId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const apiResponse = await fetch("/api/studio-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId,
          brief,
          contextUrl,
        }),
      });

      const data = (await apiResponse.json()) as StudioRequestResponse | { error?: string };

      if (!apiResponse.ok || !("preview" in data)) {
        throw new Error(data.error ?? "Failed to submit studio request.");
      }

      setResponse(data);
    } catch (submitError) {
      setResponse(null);
      setError(submitError instanceof Error ? submitError.message : "Unexpected request failure.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="try-studio" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Try The Studio
          </h2>
          <p className="max-w-2xl text-sm" style={{ color: "var(--gray-600)" }}>
            Submit a brief, choose the specialist, and route it through the paid studio flow.
          </p>
        </div>
        {selectedService ? (
          <div
            className="rounded-full border px-3 py-1 font-mono text-xs"
            style={{
              borderColor: "var(--green-200)",
              background: "var(--green-50)",
              color: "var(--green-700)",
            }}
          >
            {selectedService.name} · {formatCredits(selectedService.credits)}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium" style={{ color: "var(--gray-800)" }}>
                Service
              </span>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border-default)", color: "var(--gray-800)" }}
              >
                {STUDIO_SERVICES.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium" style={{ color: "var(--gray-800)" }}>
                Context URL
              </span>
              <input
                type="url"
                value={contextUrl}
                onChange={(event) => setContextUrl(event.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border-default)", color: "var(--gray-800)" }}
              />
            </label>
          </div>

          <label className="mb-4 block space-y-2">
            <span className="text-sm font-medium" style={{ color: "var(--gray-800)" }}>
              Brief
            </span>
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Need a landing page plan and UI direction for a hackathon agent marketplace with working payments today."
              rows={8}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: "var(--border-default)", color: "var(--gray-800)" }}
              required
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "var(--gray-400)" }}>
              Demo mode returns a structured preview. Live mode also pays and calls your seller.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !serviceId || !brief.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "var(--green-500)" }}
            >
              {isSubmitting ? "Routing request..." : "Run studio request"}
            </button>
          </div>
        </form>

        <div
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: "var(--border-default)" }}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
            Request output
          </p>

          {error ? (
            <p className="text-sm" style={{ color: "var(--tx-debit)" }}>
              {error}
            </p>
          ) : response ? (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{
                      background: response.mode === "live" ? "var(--green-50)" : "var(--bg-elevated)",
                      border: `1px solid ${response.mode === "live" ? "var(--green-200)" : "var(--gray-200)"}`,
                      color: response.mode === "live" ? "var(--green-700)" : "var(--gray-600)",
                    }}
                  >
                    {response.mode} mode
                  </span>
                  {response.sellerResponse ? (
                    <span className="font-mono text-xs" style={{ color: "var(--gray-400)" }}>
                      Seller status {response.sellerResponse.status}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
                  {response.preview.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--gray-600)" }}>
                  {response.preview.summary}
                </p>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
                  Highlights
                </p>
                <div className="space-y-2">
                  {response.preview.highlights.map((item) => (
                    <PreviewItem key={item} text={item} />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
                  Next steps
                </p>
                <div className="space-y-2">
                  {response.preview.nextSteps.map((item) => (
                    <PreviewItem key={item} text={item} />
                  ))}
                </div>
              </div>

              {response.sellerResponse ? (
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--border-default)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--gray-400)" }}>
                    Seller response
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs" style={{ color: "var(--gray-700)" }}>
                    {JSON.stringify(response.sellerResponse.body, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--gray-600)" }}>
              Submit a brief to preview the delivery structure and verify the live payment path.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm" style={{ color: "var(--gray-700)" }}>
      <span className="mt-1 size-1.5 rounded-full" style={{ background: "var(--green-500)" }} />
      <span>{text}</span>
    </div>
  );
}
