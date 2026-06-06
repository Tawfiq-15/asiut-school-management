import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—";
  const dateStr = typeof date === "string" ? date : date.toISOString();
  if (dateStr.startsWith("0001") || dateStr.startsWith("1970")) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric",
      ...opts,
    }).format(new Date(date));
  } catch (e) {
    return "—";
  }
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// formatRelativeTime renders a localized "x minutes ago" string from a
// timestamp. Falls back to "—" for missing/invalid dates.
export function formatRelativeTime(date: string | Date | null | undefined, locale = "en"): string {
  if (!date) return "—";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "—";

  const diffSec = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  const abs = Math.abs(diffSec);

  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
    [Infinity, "year"],
  ];

  let unitSeconds = 1;
  let unit: Intl.RelativeTimeFormatUnit = "second";
  for (let i = 0; i < divisions.length; i++) {
    if (abs < divisions[i][0]) {
      unit = divisions[i][1];
      unitSeconds = i === 0 ? 1 : divisions[i - 1][0];
      break;
    }
  }
  return rtf.format(Math.round(diffSec / unitSeconds), unit);
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function gradeLetterFromPercent(percent: number): string {
  if (percent >= 90) return "A+";
  if (percent >= 85) return "A";
  if (percent >= 80) return "A-";
  if (percent >= 75) return "B+";
  if (percent >= 70) return "B";
  if (percent >= 65) return "B-";
  if (percent >= 60) return "C+";
  if (percent >= 55) return "C";
  if (percent >= 50) return "C-";
  if (percent >= 40) return "D";
  return "F";
}

export function attendancePercent(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayName(dayOfWeek: number): string {
  return DAYS[dayOfWeek] ?? "";
}

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function roleColor(role: string): string {
  const map: Record<string, string> = {
    admin:   "badge-purple",
    teacher: "badge-blue",
    student: "badge-green",
    parent:  "badge-yellow",
  };
  return map[role] ?? "badge-blue";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    present:  "badge-green",
    absent:   "badge-red",
    late:     "badge-yellow",
    excused:  "badge-blue",
    paid:     "badge-green",
    pending:  "badge-yellow",
    overdue:  "badge-red",
    approved: "badge-green",
    rejected: "badge-red",
    reviewing:"badge-blue",
  };
  return map[status] ?? "badge-blue";
}
