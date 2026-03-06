"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, AlertTriangle, CheckCircle, XCircle, ExternalLink, CreditCard } from "lucide-react";
import type { MarketplaceAsset } from "@/lib/agent/buyer";

interface BuyerApprovalModalProps {
  open: boolean;
  assets: MarketplaceAsset[];
  totalCost: number;
  reason: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function BuyerApprovalModal({
  open,
  assets,
  totalCost,
  reason,
  onApprove,
  onDeny,
}: BuyerApprovalModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-2xl"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid rgba(245,158,11,0.30)",
              boxShadow: "0 24px 80px -12px rgba(0,0,0,0.40), 0 0 0 1px rgba(245,158,11,0.12)",
            }}
          >
            {/* Warning header */}
            <div
              className="flex items-center gap-3 rounded-t-2xl px-5 py-4"
              style={{ background: "rgba(245,158,11,0.06)", borderBottom: "1px solid rgba(245,158,11,0.18)" }}
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)" }}
              >
                <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--gray-900)" }}>
                  Buyer Approval Required
                </h3>
                <p className="font-mono text-[10px]" style={{ color: "#F59E0B" }}>
                  Purchase exceeds automatic approval threshold
                </p>
              </div>
            </div>

            <div className="p-5">
              {/* Reason */}
              <div
                className="mb-4 rounded-xl p-3.5"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
              >
                <p className="font-mono text-[9px] uppercase tracking-widest mb-1.5" style={{ color: "var(--gray-400)" }}>
                  Why Buyer flagged this
                </p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--gray-600)" }}>{reason}</p>
              </div>

              {/* Asset list */}
              <div className="mb-4 space-y-2">
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--gray-400)" }}>
                  Assets pending purchase ({assets.length})
                </p>
                {assets.map((asset, i) => (
                  <div
                    key={asset.did}
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.22)" }}
                    >
                      <ShoppingBag size={12} style={{ color: "#F59E0B" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold" style={{ color: "var(--gray-800)" }}>
                        {asset.name}
                      </p>
                      <p className="truncate text-[10px]" style={{ color: "var(--gray-500)" }}>
                        {asset.provider} · {asset.type}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] font-bold" style={{ color: "#F59E0B" }}>
                      {asset.price.credits}cr
                    </span>
                  </div>
                ))}
              </div>

              {/* Total cost */}
              <div
                className="mb-5 flex items-center gap-3 rounded-xl p-3.5"
                style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.22)" }}
              >
                <CreditCard size={15} style={{ color: "#F59E0B" }} />
                <div className="flex-1">
                  <p className="text-[11px]" style={{ color: "var(--gray-500)" }}>Total cost if approved</p>
                  <p className="font-mono text-[16px] font-bold" style={{ color: "#F59E0B" }}>
                    {totalCost} credits
                    <span className="ml-1.5 font-mono text-[10px] font-normal" style={{ color: "var(--gray-400)" }}>
                      ≈ ${(totalCost * 0.1).toFixed(2)} USDC via Nevermined x402
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onDeny}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all hover:opacity-80"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--gray-600)",
                  }}
                >
                  <XCircle size={14} />
                  Skip enrichment
                </button>
                <button
                  onClick={onApprove}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #D97706, #F59E0B)",
                    color: "white",
                    boxShadow: "0 4px 14px -4px rgba(245,158,11,0.45)",
                  }}
                >
                  <CheckCircle size={14} />
                  Approve purchase
                </button>
              </div>

              <p className="mt-3 text-center font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                Denying skips enrichment — report runs without external data
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
