"use client";

import { useState, useEffect } from "react";
import type { AgentTransaction } from "@/types/pipeline";

export function useTransactionStream() {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/pipeline/transactions");
    es.onmessage = (e) => {
      try {
        const tx = JSON.parse(e.data) as AgentTransaction;
        setTransactions((prev) => [...prev.slice(-49), tx]);
      } catch { /* ignore malformed SSE frames */ }
    };
    return () => es.close();
  }, []);

  return transactions;
}
