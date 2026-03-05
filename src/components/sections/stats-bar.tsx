"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import type { LiveStats } from "@/types";

interface StatsBarProps {
  stats: LiveStats;
}

interface StatCardProps {
  value: number;
  label: string;
  delay?: number;
}

function StatCard({ value, label, delay = 0 }: StatCardProps) {
  const count = useAnimatedCounter(value, 1500, delay);

  return (
    <div
      className="rounded-xl border bg-white p-5 shadow-sm"
      style={{ borderColor: "var(--border-default)" }}
    >
      <p
        className="font-mono text-3xl font-bold"
        style={{ color: "var(--green-600)" }}
      >
        {count.toLocaleString()}
      </p>
      <p
        className="mt-1 text-xs uppercase tracking-wider"
        style={{ color: "var(--gray-400)" }}
      >
        {label}
      </p>
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats.transactions} label="Transactions" delay={0} />
        <StatCard value={stats.volume} label="Credits Volume" delay={100} />
        <StatCard value={stats.uniqueTeams} label="Unique Teams" delay={200} />
      </div>
    </section>
  );
}
