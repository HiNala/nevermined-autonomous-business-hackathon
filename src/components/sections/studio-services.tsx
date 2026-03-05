import { STUDIO_SERVICES } from "@/data/mock-transactions";
import { formatCredits } from "@/lib/utils";

export function StudioServices() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--gray-400)" }}
          >
            Studio Services
          </h2>
          <p
            className="max-w-2xl text-sm"
            style={{ color: "var(--gray-600)" }}
          >
            Three paid deliverables designed for teams that need fast research,
            planning, and front-end direction today.
          </p>
        </div>
        <div
          className="rounded-full border px-3 py-1 font-mono text-xs"
          style={{
            borderColor: "var(--green-200)",
            background: "var(--green-50)",
            color: "var(--green-700)",
          }}
        >
          Nevermined-ready pricing
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {STUDIO_SERVICES.map((service) => (
          <article
            key={service.id}
            className="rounded-xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "var(--border-default)" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: "var(--gray-900)" }}
                >
                  {service.name}
                </h3>
                <p
                  className="mt-1 font-mono text-xs uppercase tracking-wider"
                  style={{ color: "var(--gray-400)" }}
                >
                  Delivery {service.turnaround}
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1 font-mono text-sm font-bold"
                style={{
                  background: "var(--green-50)",
                  color: "var(--green-700)",
                  border: "1px solid var(--green-200)",
                }}
              >
                {formatCredits(service.credits)}
              </div>
            </div>

            <p className="mb-5 text-sm" style={{ color: "var(--gray-600)" }}>
              {service.summary}
            </p>

            <div className="space-y-2">
              {service.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-2">
                  <span
                    className="mt-1 size-1.5 rounded-full"
                    style={{ background: "var(--green-500)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--gray-800)" }}>
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
