"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, PackageCheck, Brain, Trash2,
  RotateCcw, ChevronRight, Clock, Zap, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtifactEntry {
  id: string;
  input: string;
  mode: string;
  outputType: string;
  title: string;
  summary: string;
  creditsUsed: number;
  durationMs: number;
  savedAt: string;
  hasBrief: boolean;
  hasDocument: boolean;
  hasDelivery: boolean;
  sourceCount: number;
  enriched: boolean;
}

const STORAGE_KEY = "ab_artifact_library";
const MAX_ARTIFACTS = 20;

// ─── Persistence helpers ──────────────────────────────────────────────────────

export function saveArtifact(entry: Omit<ArtifactEntry, "id" | "savedAt">) {
  try {
    const existing = loadArtifacts();
    const newEntry: ArtifactEntry = {
      ...entry,
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...existing].slice(0, MAX_ARTIFACTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newEntry;
  } catch { return null; }
}

export function loadArtifacts(): ArtifactEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ArtifactEntry[]) : [];
  } catch { return []; }
}

export function deleteArtifact(id: string) {
  try {
    const updated = loadArtifacts().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function clearArtifacts() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Artifact Library Panel ───────────────────────────────────────────────────

interface ArtifactLibraryProps {
  open: boolean;
  onClose: () => void;
  onRestore: (entry: ArtifactEntry) => void;
}

const MODE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof FileText }> = {
  pipeline: { label: "Pipeline", color: "var(--accent-400)", bg: "rgba(201,125,78,0.08)", icon: Zap },
  strategist: { label: "Interpreter", color: "#7C3AED", bg: "rgba(124,58,237,0.08)", icon: Brain },
  researcher: { label: "Composer", color: "#0EA5E9", bg: "rgba(14,165,233,0.08)", icon: FileText },
  seller: { label: "Seller", color: "#EF4444", bg: "rgba(239,68,68,0.08)", icon: PackageCheck },
};

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ArtifactLibrary({ open, onClose, onRestore }: ArtifactLibraryProps) {
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);

  useEffect(() => {
    if (open) setArtifacts(loadArtifacts());
  }, [open]);

  function handleDelete(id: string) {
    deleteArtifact(id);
    setArtifacts((prev) => prev.filter((a) => a.id !== id));
  }

  function handleClearAll() {
    clearArtifacts();
    setArtifacts([]);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.35)" }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 right-0 top-14 z-50 flex w-[420px] flex-col"
            style={{
              background: "var(--bg-elevated)",
              borderLeft: "1px solid var(--border-default)",
              boxShadow: "-12px 0 40px -8px rgba(0,0,0,0.20)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border-default)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(201,125,78,0.10)", border: "1px solid rgba(201,125,78,0.22)" }}
                >
                  <BookOpen size={14} style={{ color: "var(--accent-400)" }} />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold" style={{ color: "var(--gray-900)" }}>
                    Artifact Library
                  </h2>
                  <p className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>
                    {artifacts.length} saved · last {MAX_ARTIFACTS} runs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {artifacts.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="rounded-lg px-2.5 py-1.5 font-mono text-[10px] transition-all hover:opacity-80"
                    style={{ color: "#EF4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-80"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <X size={13} style={{ color: "var(--gray-500)" }} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {artifacts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div
                    className="flex size-14 items-center justify-center rounded-2xl"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                  >
                    <BookOpen size={22} style={{ color: "var(--gray-300)" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--gray-500)" }}>No artifacts yet</p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--gray-400)" }}>
                      Completed runs are saved here automatically for restore and re-run.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-default)" }}>
                  {artifacts.map((art, i) => {
                    const mCfg = MODE_CONFIG[art.mode] ?? MODE_CONFIG.pipeline;
                    const Icon = mCfg.icon;
                    return (
                      <motion.div
                        key={art.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group p-4"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Mode icon */}
                          <div
                            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: mCfg.bg, border: `1px solid ${mCfg.color}25` }}
                          >
                            <Icon size={13} style={{ color: mCfg.color }} />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold" style={{ color: "var(--gray-800)" }}>
                              {art.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11px]" style={{ color: "var(--gray-500)" }}>
                              {art.summary}
                            </p>

                            {/* Meta chips */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span
                                className="rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold"
                                style={{ background: mCfg.bg, color: mCfg.color }}
                              >
                                {mCfg.label}
                              </span>
                              {art.hasDocument && (
                                <span className="rounded-full px-2 py-0.5 font-mono text-[8px]" style={{ background: "rgba(14,165,233,0.08)", color: "#0EA5E9" }}>
                                  report
                                </span>
                              )}
                              {art.hasDelivery && (
                                <span className="rounded-full px-2 py-0.5 font-mono text-[8px]" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                                  delivered
                                </span>
                              )}
                              {art.enriched && (
                                <span className="rounded-full px-2 py-0.5 font-mono text-[8px]" style={{ background: "rgba(245,158,11,0.08)", color: "#F59E0B" }}>
                                  enriched
                                </span>
                              )}
                              <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                {art.creditsUsed}cr
                              </span>
                              {art.sourceCount > 0 && (
                                <span className="font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                  {art.sourceCount} sources
                                </span>
                              )}
                              <span className="ml-auto flex items-center gap-1 font-mono text-[8px]" style={{ color: "var(--gray-400)" }}>
                                <Clock size={8} />
                                {formatRelative(art.savedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => onRestore(art)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                              color: "white",
                            }}
                          >
                            <RotateCcw size={11} />
                            Restore
                            <ChevronRight size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="flex size-8 items-center justify-center rounded-lg transition-all hover:opacity-80"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                          >
                            <Trash2 size={12} style={{ color: "var(--gray-400)" }} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div
              className="border-t px-5 py-3"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p className="text-center font-mono text-[9px]" style={{ color: "var(--gray-400)" }}>
                Stored locally in your browser · up to {MAX_ARTIFACTS} entries
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
