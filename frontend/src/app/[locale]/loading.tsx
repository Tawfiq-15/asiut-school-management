import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="text-sm font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">Loading</div>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-600)] animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-600)] animate-pulse delay-150" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-600)] animate-pulse delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
