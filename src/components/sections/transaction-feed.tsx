"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTimeAgo } from "@/lib/utils";
import { MAX_FEED_ITEMS, FEED_UPDATE_INTERVAL_MS } from "@/lib/constants";
import { generateMockTransaction, generateInitialTransactions } from "@/data/mock-transactions";
import type { Transaction } from "@/types";
import { Pause, Play } from "lucide-react";

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTransactions(generateInitialTransactions(12));
    setMounted(true);
  }, []);

  const addTransaction = useCallback(() => {
    if (paused) return;
    const newTx = generateMockTransaction(Date.now());
    newTx.timestamp = new Date();
    setTransactions((prev) => [newTx, ...prev].slice(0, MAX_FEED_ITEMS));
  }, [paused]);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(addTransaction, FEED_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [addTransaction, mounted]);

  const recentCount = transactions.filter(
    (tx) => Date.now() - tx.timestamp.getTime() < 300000
  ).length;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--gray-400)" }}
        >
          Live Feed
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaused(!paused)}
            className="rounded-md p-1 transition-colors hover:bg-gray-100"
            aria-label={paused ? "Resume feed" : "Pause feed"}
          >
            {paused ? (
              <Play size={14} color="var(--gray-400)" />
            ) : (
              <Pause size={14} color="var(--gray-400)" />
            )}
          </button>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--gray-400)" }}
          >
            {recentCount} transactions · last 5 min
          </span>
        </div>
      </div>

      {/* Feed container */}
      <div
        className="overflow-hidden rounded-xl border bg-white"
        style={{ borderColor: "var(--border-default)" }}
      >
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TransactionRow tx={tx} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const statusColor =
    tx.status === "completed" ? "var(--green-500)" : "var(--tx-pending)";

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-2.5 transition-colors hover:bg-[var(--green-50)]/40"
      style={{ borderColor: "var(--gray-100)" }}
    >
      {/* Status dot */}
      <span
        className="size-2 flex-shrink-0 rounded-full"
        style={{ background: statusColor }}
      />

      {/* Time */}
      <span
        className="w-14 flex-shrink-0 font-mono text-[11px]"
        style={{ color: "var(--gray-400)" }}
      >
        {formatTimeAgo(tx.timestamp)}
      </span>

      {/* Agents */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="truncate font-mono text-xs font-medium"
          style={{ color: "var(--gray-800)" }}
        >
          {tx.buyer}
        </span>
        <span style={{ color: "var(--gray-300)" }}>→</span>
        <span
          className="truncate font-mono text-xs font-medium"
          style={{ color: "var(--green-700)" }}
        >
          {tx.seller}
        </span>
      </div>

      {/* Tool */}
      <span
        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{
          background: "var(--gray-100)",
          color: "var(--gray-600)",
        }}
      >
        {tx.tool}
      </span>

      {/* Credits */}
      <span
        className="flex-shrink-0 font-mono text-xs font-bold"
        style={{ color: "var(--green-600)" }}
      >
        +{tx.credits}cr
      </span>
    </div>
  );
}
