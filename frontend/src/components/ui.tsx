"use client";

import { useState, useEffect, useRef, useId, memo, useCallback } from "react";
import dynamic from "next/dynamic";
import { LucideIcon, ArrowUp, X, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

// CommandPalette is a hidden overlay until invoked — load it on the client after
// the route renders so it stays out of every dashboard route's compile graph.
const CommandPalette = dynamic(
  () => import("@/components/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  trend?: { value: number; label?: string };
  delay?: number;
}

function AnimatedNumber({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState<string | number>(value);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    const strVal = String(value);
    const numericPart = strVal.match(/\d+([.,]\d+)?/);
    if (!numericPart) { setDisplayValue(value); return; }

    const endVal = parseFloat(numericPart[0].replace(/,/g, ""));
    const suffix = strVal.replace(numericPart[0], "");
    const prefix = strVal.split(numericPart[0])[0];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp: number | null = null;
          const duration = 1000;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easedProgress * endVal);
            setDisplayValue(`${prefix}${currentVal.toLocaleString()}${suffix}`);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayValue}</span>;
}

const statColorConfig: Record<string, { topBorder: string; iconBg: string; iconBorder: string; iconText: string }> = {
  blue:   { topBorder: "border-t-blue-500",    iconBg: "bg-blue-50 dark:bg-blue-950/40",    iconBorder: "border-blue-100 dark:border-blue-800/50",    iconText: "text-blue-600 dark:text-blue-400"    },
  green:  { topBorder: "border-t-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/40", iconBorder: "border-emerald-100 dark:border-emerald-800/50", iconText: "text-emerald-600 dark:text-emerald-400" },
  purple: { topBorder: "border-t-violet-500",  iconBg: "bg-violet-50 dark:bg-violet-950/40",  iconBorder: "border-violet-100 dark:border-violet-800/50",  iconText: "text-violet-600 dark:text-violet-400"  },
  orange: { topBorder: "border-t-orange-500",  iconBg: "bg-orange-50 dark:bg-orange-950/40",  iconBorder: "border-orange-100 dark:border-orange-800/50",  iconText: "text-orange-600 dark:text-orange-400"  },
  red:    { topBorder: "border-t-red-500",     iconBg: "bg-red-50 dark:bg-red-950/40",     iconBorder: "border-red-100 dark:border-red-800/50",     iconText: "text-red-600 dark:text-red-400"     },
};

export const StatCard = memo(function StatCard({ title, value, icon: Icon, color = "blue", trend }: StatCardProps) {
  const cc = statColorConfig[color] ?? statColorConfig.blue;
  return (
    <div className={cn("stat-card border-t-2", cc.topBorder)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
            <AnimatedNumber value={value} />
          </p>
          {trend && (
            <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
              {trend.value >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-[var(--color-text-muted)] font-normal">{trend.label}</span>}
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border", cc.iconBg, cc.iconBorder)}>
          <Icon className={cn("w-5 h-5", cc.iconText)} />
        </div>
      </div>
    </div>
  );
});

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-8 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="skeleton w-11 h-11 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  className?: string;
}

export const Badge = memo(function Badge({ children, variant = "blue", className }: BadgeProps) {
  return <span className={cn(`badge badge-${variant}`, className)}>{children}</span>;
});

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo(function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-3)] dark:bg-[var(--color-dark-surface-3)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Close on escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus management: move focus into the dialog on open, restore it on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  // Simple focus trap: keep Tab focus within the dialog.
  const onKeyDownTrap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={onKeyDownTrap}
          className={cn("card w-full overflow-hidden pointer-events-auto animate-slide-up outline-none", maxWidth)}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{title}</h2>
            <button onClick={onClose} aria-label="Close dialog" className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)] transition-colors" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Set to false to exclude this column from CSV exports. Default: true. */
  exportable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  /** When provided, renders an Export CSV button above the table. */
  exportFilename?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data: rawData, keyField = "id" as keyof T, loading, emptyMessage = "No data found",
  exportFilename,
}: DataTableProps<T>) {
  const data = Array.isArray(rawData) ? rawData : (rawData as any)?.data ?? (rawData as any)?.records ?? [];
  const { exportCSV, exporting } = useExport();

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <table className="data-table">
          <thead>
            <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={col.key}>
                    <div className={cn("skeleton h-4 rounded", j === 0 ? "w-36" : j === columns.length - 1 ? "w-16" : "w-24")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const exportableCols = columns.filter((c) => c.exportable !== false && !c.render);

  function handleExport() {
    exportCSV({
      data,
      columns: exportableCols.map((c) => ({ key: c.key, label: c.label })),
      filename: exportFilename,
    });
  }

  return (
    <div>
      {exportFilename && (
        <div className="flex justify-end px-4 pt-3 pb-1">
          <button
            onClick={handleExport}
            disabled={exporting || data.length === 0}
            className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-[var(--color-text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row: T) => (
                <tr key={String(row[keyField])}>
                  {columns.map((col) => (
                    <td key={col.key} className={cn("dark:text-[var(--color-dark-text)]", col.className)}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────

export function DashboardLayout({ children, role }: { children: React.ReactNode; role: string }) {
  return (
    <>
      <div className="flex min-h-screen bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">
        <Sidebar role={role} />
        <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
      </div>
      {/* CommandPalette must live OUTSIDE the flex row — it renders a fixed overlay. */}
      <CommandPalette role={role} />
    </>
  );
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const toggleVisibility = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setVisible(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 w-10 h-10 rounded-xl bg-[var(--color-primary-700)] text-white shadow-lg hover:bg-[var(--color-primary-600)] hover:-translate-y-0.5 transition-all flex items-center justify-center"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
