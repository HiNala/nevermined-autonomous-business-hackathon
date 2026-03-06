"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Target,
  Users,
  Gauge,
  Wallet,
  BookOpen,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import type { WorkspaceProfile } from "@/lib/workspace/profile";

const STAGE_OPTIONS: { value: WorkspaceProfile["stage"]; label: string }[] = [
  { value: "idea", label: "Idea Stage" },
  { value: "early", label: "Early Stage" },
  { value: "growth", label: "Growth Stage" },
  { value: "scale", label: "Scale / Enterprise" },
];

const DEPTH_OPTIONS: { value: WorkspaceProfile["preferredDepth"]; label: string; credits: string }[] = [
  { value: "quick", label: "Quick", credits: "1cr" },
  { value: "standard", label: "Standard", credits: "5cr" },
  { value: "deep", label: "Deep", credits: "10cr" },
];

const STYLE_OPTIONS: { value: WorkspaceProfile["preferredStyle"]; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "balanced", label: "Balanced" },
  { value: "detailed", label: "Detailed" },
];

const BUDGET_OPTIONS: { value: WorkspaceProfile["budgetPolicy"]; label: string; desc: string }[] = [
  { value: "conservative", label: "Conservative", desc: "Avoid external purchases" },
  { value: "normal", label: "Normal", desc: "Buy when clearly worth it" },
  { value: "aggressive", label: "Aggressive", desc: "Maximize enrichment" },
];

interface Props {
  workspaceId?: string;
  onSaved?: (profile: WorkspaceProfile) => void;
}

export function WorkspaceProfilePanel({ workspaceId = "default", onSaved }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [competitorInput, setCompetitorInput] = useState("");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [market, setMarket] = useState("");
  const [stage, setStage] = useState<WorkspaceProfile["stage"] | "">("");
  const [geography, setGeography] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [preferredDepth, setPreferredDepth] = useState<WorkspaceProfile["preferredDepth"]>("standard");
  const [preferredStyle, setPreferredStyle] = useState<WorkspaceProfile["preferredStyle"]>("balanced");
  const [budgetPolicy, setBudgetPolicy] = useState<WorkspaceProfile["budgetPolicy"]>("normal");
  const [extraContext, setExtraContext] = useState("");

  const hasContext = Boolean(companyName || market || stage || geography || competitors.length || extraContext);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspace/profile?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data: WorkspaceProfile = await res.json();
        setProfile(data);
        setCompanyName(data.companyName ?? "");
        setMarket(data.market ?? "");
        setStage(data.stage ?? "");
        setGeography(data.geography ?? "");
        setCompetitors(data.recurringCompetitors ?? []);
        setPreferredDepth(data.preferredDepth ?? "standard");
        setPreferredStyle(data.preferredStyle ?? "balanced");
        setBudgetPolicy(data.budgetPolicy ?? "normal");
        setExtraContext(data.extraContext ?? "");
      }
    } catch { /* silent */ }
  }, [workspaceId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Partial<WorkspaceProfile> = {
        workspaceId,
        companyName: companyName || undefined,
        market: market || undefined,
        stage: stage || undefined,
        geography: geography || undefined,
        recurringCompetitors: competitors.length ? competitors : undefined,
        preferredDepth,
        preferredStyle,
        budgetPolicy,
        extraContext: extraContext || undefined,
      };
      const res = await fetch("/api/workspace/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved_profile: WorkspaceProfile = await res.json();
        setProfile(saved_profile);
        setSaved(true);
        onSaved?.(saved_profile);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function addCompetitor() {
    const trimmed = competitorInput.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      setCompetitors((prev) => [...prev, trimmed]);
    }
    setCompetitorInput("");
  }

  function removeCompetitor(c: string) {
    setCompetitors((prev) => prev.filter((x) => x !== c));
  }

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: "var(--bg-elevated)",
        borderColor: hasContext ? "rgba(201,125,78,0.3)" : "var(--border-default)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: hasContext ? "rgba(201,125,78,0.12)" : "var(--glass-bg)" }}
          >
            <Building2 size={13} style={{ color: hasContext ? "var(--accent-400)" : "var(--gray-400)" }} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold" style={{ color: "var(--gray-800)" }}>
                Workspace Context
              </span>
              {hasContext && (
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                  style={{ background: "rgba(201,125,78,0.12)", color: "var(--accent-400)" }}
                >
                  Active
                </span>
              )}
            </div>
            <p className="text-[9px]" style={{ color: "var(--gray-400)" }}>
              {hasContext
                ? `${companyName || "Your workspace"} · ${market || "custom context"}`
                : "Help the Strategist understand your business"}
            </p>
          </div>
        </div>
        <div style={{ color: "var(--gray-400)" }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--border-default)" }}>
          <div className="space-y-3">

            {/* Row 1: Company + Market */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <Building2 size={9} /> Company
                </label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none transition-colors focus:border-orange-400/50"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <Target size={9} /> Market
                </label>
                <input
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="e.g. SaaS, fintech, healthcare"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none transition-colors focus:border-orange-400/50"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
                />
              </div>
            </div>

            {/* Row 2: Stage + Geography */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <Sparkles size={9} /> Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as WorkspaceProfile["stage"])}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
                >
                  <option value="">Not set</option>
                  {STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <MapPin size={9} /> Geography
                </label>
                <input
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  placeholder="e.g. US, Europe, Global"
                  className="w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none transition-colors focus:border-orange-400/50"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
                />
              </div>
            </div>

            {/* Competitors */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                <Users size={9} /> Recurring Competitors
              </label>
              <div className="flex gap-1.5">
                <input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                  placeholder="Add competitor, press Enter"
                  className="flex-1 rounded-lg border px-2.5 py-1.5 text-[11px] outline-none"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
                />
                <button
                  onClick={addCompetitor}
                  className="rounded-lg px-2.5 text-[11px] font-medium transition-colors"
                  style={{ background: "rgba(201,125,78,0.1)", color: "var(--accent-400)", border: "1px solid rgba(201,125,78,0.2)" }}
                >
                  Add
                </button>
              </div>
              {competitors.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {competitors.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px]"
                      style={{ background: "rgba(201,125,78,0.08)", color: "var(--accent-300)", border: "1px solid rgba(201,125,78,0.15)" }}
                    >
                      {c}
                      <button onClick={() => removeCompetitor(c)}>
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preferences row */}
            <div className="grid grid-cols-3 gap-2">
              {/* Depth */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <Gauge size={9} /> Default Depth
                </label>
                <div className="flex gap-1">
                  {DEPTH_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setPreferredDepth(o.value)}
                      className="flex-1 rounded px-1 py-1 text-[9px] font-medium transition-all"
                      style={{
                        background: preferredDepth === o.value ? "rgba(201,125,78,0.15)" : "var(--bg-surface)",
                        border: `1px solid ${preferredDepth === o.value ? "rgba(201,125,78,0.35)" : "var(--border-default)"}`,
                        color: preferredDepth === o.value ? "var(--accent-400)" : "var(--gray-500)",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <BookOpen size={9} /> Style
                </label>
                <div className="flex gap-1">
                  {STYLE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setPreferredStyle(o.value)}
                      className="flex-1 rounded px-1 py-1 text-[9px] font-medium transition-all"
                      style={{
                        background: preferredStyle === o.value ? "rgba(99,102,241,0.15)" : "var(--bg-surface)",
                        border: `1px solid ${preferredStyle === o.value ? "rgba(99,102,241,0.35)" : "var(--border-default)"}`,
                        color: preferredStyle === o.value ? "#818CF8" : "var(--gray-500)",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                  <Wallet size={9} /> Budget
                </label>
                <select
                  value={budgetPolicy}
                  onChange={(e) => setBudgetPolicy(e.target.value as WorkspaceProfile["budgetPolicy"])}
                  className="w-full rounded border px-1.5 py-1 text-[9px] outline-none"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-700)" }}
                >
                  {BUDGET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extra Context */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--gray-500)" }}>
                <BookOpen size={9} /> Extra Context
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="Anything else the Strategist should know about your business, goals, or constraints…"
                rows={2}
                className="w-full resize-none rounded-lg border px-2.5 py-1.5 text-[11px] outline-none"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--gray-800)" }}
              />
            </div>

            {/* Save button */}
            <div className="flex items-center justify-between pt-1">
              {profile?.updatedAt && (
                <span className="text-[9px]" style={{ color: "var(--gray-400)" }}>
                  Last saved: {new Date(profile.updatedAt).toLocaleTimeString()}
                </span>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={loadProfile}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] transition-colors"
                  style={{ background: "var(--glass-bg)", color: "var(--gray-500)", border: "1px solid var(--border-default)" }}
                >
                  <RefreshCw size={9} /> Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-all"
                  style={{
                    background: saved
                      ? "rgba(34,197,94,0.8)"
                      : "linear-gradient(135deg, var(--accent-600), var(--accent-400))",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Save size={10} />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save Context"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
