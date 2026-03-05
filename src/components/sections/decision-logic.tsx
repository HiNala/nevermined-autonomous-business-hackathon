"use client";

import { AnimatedStateIcon } from "@/components/ui/animated-state-icon";

interface StepProps {
  number: number;
  title: string;
  description: string;
  iconType: "download" | "success" | "toggle";
}

function Step({ number, title, description, iconType }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mb-3 flex size-10 items-center justify-center rounded-full font-mono text-sm font-bold"
        style={{
          background: "var(--green-50)",
          color: "var(--green-700)",
          border: "1px solid var(--green-200)",
        }}
      >
        {number}
      </div>
      <h3
        className="mb-1 text-sm font-semibold"
        style={{ color: "var(--gray-900)" }}
      >
        {title}
      </h3>
      <p
        className="mb-4 max-w-[200px] text-xs"
        style={{ color: "var(--gray-400)" }}
      >
        {description}
      </p>
      <AnimatedStateIcon type={iconType} size={32} />
    </div>
  );
}

export function DecisionLogic() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2
        className="mb-8 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--gray-400)" }}
      >
        How Our Buyer Decides
      </h2>

      <div
        className="rounded-xl border bg-white p-8"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <Step
            number={1}
            title="Discover"
            description="Query /pricing on 6+ sellers to map the market"
            iconType="download"
          />
          <Step
            number={2}
            title="Evaluate"
            description="Score quality vs. price ratio for each seller"
            iconType="success"
          />
          <Step
            number={3}
            title="Buy / Switch"
            description="Buy cheapest high-quality option. Switch if ROI drops"
            iconType="toggle"
          />
        </div>

        {/* Connection arrows (visible on sm+) */}
        <div className="mt-6 hidden items-center justify-center gap-2 sm:flex">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-px w-24"
                style={{ background: "var(--green-200)" }}
              />
              <span style={{ color: "var(--green-400)" }}>→</span>
              <div
                className="h-px w-24"
                style={{ background: "var(--green-200)" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
