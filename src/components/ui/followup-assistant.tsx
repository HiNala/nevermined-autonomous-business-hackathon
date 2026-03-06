"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Copy,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  reportTitle?: string;
  reportSummary?: string;
  reportContent?: string;
  initialPrompt?: string;
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  "Summarize for investors",
  "Turn into a roadmap",
  "Extract product requirements",
  "Write a one-pager",
  "List the top 5 risks",
  "Draft a follow-up email",
];

export function FollowUpAssistant({ reportTitle, reportSummary, reportContent, initialPrompt, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      inputRef.current?.focus();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const context = [
        reportTitle ? `Report title: ${reportTitle}` : "",
        reportSummary ? `Summary: ${reportSummary}` : "",
        reportContent ? `Report content (excerpt): ${reportContent.slice(0, 3000)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/pipeline/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, context, history }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.answer ?? "I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Something went wrong. Check your API key configuration and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy(id: string, content: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(14,165,233,0.22)",
        background: "var(--bg-surface)",
        maxHeight: collapsed ? "56px" : "520px",
        transition: "max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{ background: "rgba(14,165,233,0.04)", borderBottom: collapsed ? "none" : "1px solid rgba(14,165,233,0.12)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.22)" }}
          >
            <MessageSquare size={13} style={{ color: "#0EA5E9" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold" style={{ color: "var(--gray-900)" }}>
                Follow-up Assistant
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[8px] font-semibold"
                style={{ background: "rgba(14,165,233,0.10)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,0.20)" }}
              >
                ask anything about this report
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand follow-up assistant" : "Collapse follow-up assistant"}
            className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/5"
            style={{ color: "var(--gray-400)" }}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close follow-up assistant"
              className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-black/5"
              style={{ color: "var(--gray-400)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="mb-3 flex size-10 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.16)" }}
                >
                  <Sparkles size={18} style={{ color: "#0EA5E9" }} />
                </div>
                <p className="text-[13px] font-medium mb-1" style={{ color: "var(--gray-700)" }}>
                  Ask anything about{reportTitle ? ` "${reportTitle}"` : " this report"}
                </p>
                <p className="text-[11px] mb-5" style={{ color: "var(--gray-400)" }}>
                  Summarize it, turn it into a roadmap, extract requirements, write a one-pager…
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setInput(p); inputRef.current?.focus(); }}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all hover:scale-[1.02]"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-default)",
                        color: "var(--gray-600)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{
                      background: msg.role === "user" ? "rgba(201,125,78,0.12)" : "rgba(14,165,233,0.12)",
                      border: `1px solid ${msg.role === "user" ? "rgba(201,125,78,0.22)" : "rgba(14,165,233,0.22)"}`,
                    }}
                  >
                    {msg.role === "user"
                      ? <User size={11} style={{ color: "var(--accent-400)" }} />
                      : <Bot size={11} style={{ color: "#0EA5E9" }} />
                    }
                  </div>
                  <div className={`flex-1 min-w-0 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className="group relative max-w-[90%] rounded-xl px-3 py-2.5"
                      style={{
                        background: msg.role === "user"
                          ? "rgba(201,125,78,0.08)"
                          : "var(--bg-elevated)",
                        border: `1px solid ${msg.role === "user" ? "rgba(201,125,78,0.16)" : "var(--border-default)"}`,
                      }}
                    >
                      <p className="whitespace-pre-wrap text-[12px] leading-relaxed" style={{ color: "var(--gray-700)" }}>
                        {msg.content}
                      </p>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          aria-label="Copy message"
                          className="absolute right-2 top-2 hidden rounded p-0.5 transition-colors group-hover:flex"
                          style={{ color: "var(--gray-400)" }}
                        >
                          {copiedId === msg.id ? <Check size={10} style={{ color: "#22C55E" }} /> : <Copy size={10} />}
                        </button>
                      )}
                    </div>
                    <p className="mt-1 px-1 font-mono text-[8px]" style={{ color: "var(--gray-300)" }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.22)" }}
                >
                  <Bot size={11} style={{ color: "#0EA5E9" }} />
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}
                >
                  <Loader2 size={11} className="animate-spin" style={{ color: "#0EA5E9" }} />
                  <span className="font-mono text-[10px]" style={{ color: "var(--gray-400)" }}>thinking…</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div
            className="shrink-0 border-t p-3"
            style={{ borderColor: "rgba(14,165,233,0.12)" }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a follow-up question… (Enter to send)"
                rows={2}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-[12px] outline-none transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                  color: "var(--gray-800)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #0284C7, #0EA5E9)" }}
              >
                {isLoading
                  ? <Loader2 size={14} className="animate-spin text-white" />
                  : <Send size={14} className="text-white" />
                }
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
