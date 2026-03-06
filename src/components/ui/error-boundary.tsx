"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 rounded-xl p-8 text-center"
          style={{ border: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}
        >
          <AlertTriangle size={24} style={{ color: "var(--accent-400)", opacity: 0.8 }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--gray-800)" }}>
              Something went wrong
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--gray-400)" }}>
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--gray-600)" }}
          >
            <RefreshCw size={12} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
