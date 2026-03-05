"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatTimeAgo } from "@/lib/utils";
import { MAX_FEED_ITEMS, FEED_UPDATE_INTERVAL_MS } from "@/lib/constants";
import { generateMockTransaction, generateInitialTransactions } from "@/data/mock-transactions";
import type { Transaction } from "@/types";
import { Pause, Play } from "lucide-react";

export function TransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    generateInitialTransactions(12)
  );
  const [paused, setPaused] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addTransaction = useCallback(() => {
    if (paused) return;
    const newTx = generateMockTransaction(Date.now());
    newTx.timestamp = new Date();
    setTransactions((prev) => [newTx, ...prev].slice(0, MAX_FEED_ITEMS));
  }, [paused]);

  useEffect(() => {
    const interval = setInterval(addTransaction, FEED_UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [addTransaction]);

  const recentCount = transactions.filter(
    (tx) => currentTimestamp - tx.timestamp.getTime() < 300000
  ).length;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-px w-6" style={{ background: "var(--accent-400)", opacity: 0.5 }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "var(--gray-400)" }}>005 / LIVE FEED</span>
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight" style={{ color: "var(--gray-900)" }}>
            Transactions happening now.
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaused(!paused)}
            className="rounded-md p-1 transition-colors"
            style={{ color: "var(--gray-400)" }}
            aria-label={paused ? "Resume feed" : "Pause feed"}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <span
            className="font-mono text-[11px]"
            style={{ color: "var(--gray-400)" }}
          >
            {recentCount} txns · 5 min
          </span>
        </div>
      </div>

      <div className="glass overflow-hidden">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
  const isComplete = tx.status === "completed";

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-2.5 transition-colors duration-150"
      style={{
        borderColor: "var(--border-default)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201, 125, 78, 0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: isComplete ? "var(--accent-400)" : "var(--tx-pending)" }}
      />

      <span
        className="w-10 shrink-0 font-mono text-[10px]"
        style={{ color: "var(--gray-400)" }}
      >
        {formatTimeAgo(tx.timestamp)}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate font-mono text-[11px] font-medium" style={{ color: "var(--gray-800)" }}>
          {tx.buyer}
        </span>
        <span className="text-[10px]" style={{ color: "var(--gray-300)" }}>→</span>
        <span className="truncate font-mono text-[11px] font-medium" style={{ color: "var(--accent-400)" }}>
          {tx.seller}
        </span>
      </div>

      <span
        className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[9px] font-medium"
        style={{
          background: "var(--gray-100)",
          color: "var(--gray-500)",
        }}
      >
        {tx.tool}
      </span>

      <span
        className="shrink-0 font-mono text-[11px] font-bold"
        style={{ color: "var(--accent-400)" }}
      >
        +{tx.credits}cr
      </span>
    </div>
  );
}
