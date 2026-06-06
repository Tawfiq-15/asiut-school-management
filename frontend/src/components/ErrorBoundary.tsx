"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Rendered instead of children when an error is caught. Defaults to a full-page error screen. */
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * React Error Boundary — catches render-time errors anywhere in the subtree
 * and displays a recovery UI so the whole app doesn't go blank.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeFeature />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, forward to Sentry / Datadog / your error tracker here.
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorScreen error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

// ─── Default error screen ─────────────────────────────────────────────────────

function ErrorScreen({ error, onReset }: { error: Error; onReset: () => void }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">
      <div className="max-w-md w-full card p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
            An unexpected error occurred. You can try to recover by clicking the
            button below or refreshing the page.
          </p>
        </div>

        {isDev && (
          <pre className="text-left text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-lg p-3 overflow-auto max-h-40 text-red-700 dark:text-red-300">
            {error.message}
            {"\n"}
            {error.stack}
          </pre>
        )}

        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="btn-primary flex-1 justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex-1 justify-center"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight inline error boundary for wrapping individual widgets/cards.
 * Shows a compact error card instead of the full-page fallback.
 */
export function WidgetErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="card p-6 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>This section failed to load. Refresh the page to retry.</span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
