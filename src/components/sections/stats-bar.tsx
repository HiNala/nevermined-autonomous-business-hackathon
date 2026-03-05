"use client";

import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import type { LiveStats } from "@/types";

interface StatsBarProps {
  stats: LiveStats;
}

interface StatCardProps {
  value: number;
  label: string;
  suffix?: string;
  delay?: number;
}

function StatCard({ value, label, suffix = "", delay = 0 }: StatCardProps) {
  const count = useAnimatedCounter(value, 1500, delay);

  return (
    <div className="glass glow-green-subtle p-5">
      <p className="font-mono text-3xl font-bold text-gradient-green">
        {count.toLocaleString()}{suffix}
      </p>
      <p
        className="mt-1.5 text-[11px] uppercase tracking-widest"
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
        <StatCard value={stats.volume} label="Credits Volume" suffix="cr" delay={100} />
        <StatCard value={stats.uniqueTeams} label="Unique Teams" delay={200} />
      </div>
    </section>
  );
}
