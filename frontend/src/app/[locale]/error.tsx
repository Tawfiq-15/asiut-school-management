"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-3">
          Something went wrong
        </h2>
        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8 leading-relaxed">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
