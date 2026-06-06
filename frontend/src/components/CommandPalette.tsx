"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Search, X, GraduationCap, Users, BookOpen,
  LayoutDashboard, ClipboardList, Calendar,
  CreditCard, Bell, LogOut, Settings,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

// ─── Static navigation shortcuts ─────────────────────────────────────────────

function useNavItems(role: string, locale: string, router: ReturnType<typeof useRouter>): PaletteItem[] {
  const base = `/${locale}/${role}`;
  const go = (path: string) => () => router.push(path);

  const adminItems: PaletteItem[] = [
    { id: "dash",        label: "Dashboard",      icon: LayoutDashboard, action: go(`${base}`),                group: "Navigation" },
    { id: "students",    label: "Students",        icon: GraduationCap,   action: go(`${base}/students`),       group: "Navigation" },
    { id: "teachers",    label: "Teachers",        icon: Users,           action: go(`${base}/teachers`),       group: "Navigation" },
    { id: "classes",     label: "Classes",         icon: BookOpen,        action: go(`${base}/classes`),        group: "Navigation" },
    { id: "attendance",  label: "Attendance",      icon: ClipboardList,   action: go(`${base}/attendance`),     group: "Navigation" },
    { id: "schedules",   label: "Schedules",       icon: Calendar,        action: go(`${base}/schedules`),      group: "Navigation" },
    { id: "payments",    label: "Payments",        icon: CreditCard,      action: go(`${base}/payments`),       group: "Navigation" },
    { id: "notifs",      label: "Announcements",   icon: Bell,            action: go(`${base}/announcements`),  group: "Navigation" },
    { id: "settings",    label: "Settings",        icon: Settings,        action: go(`${base}/settings`),       group: "Navigation" },
  ];

  const teacherItems: PaletteItem[] = [
    { id: "dash",       label: "Dashboard",    icon: LayoutDashboard, action: go(`${base}`),              group: "Navigation" },
    { id: "classes",    label: "My Classes",   icon: BookOpen,        action: go(`${base}/classes`),      group: "Navigation" },
    { id: "attendance", label: "Attendance",   icon: ClipboardList,   action: go(`${base}/attendance`),   group: "Navigation" },
    { id: "assignments",label: "Assignments",  icon: ClipboardList,   action: go(`${base}/assignments`),  group: "Navigation" },
    { id: "schedule",   label: "Schedule",     icon: Calendar,        action: go(`${base}/schedule`),     group: "Navigation" },
  ];

  if (role === "admin") return adminItems;
  if (role === "teacher") return teacherItems;
  return [];
}

// ─── Live search results ──────────────────────────────────────────────────────

function useSearch(query: string, role: string, locale: string, router: ReturnType<typeof useRouter>) {
  const base = `/${locale}/${role}`;
  const enabled = query.trim().length >= 2;

  const { data: students = [] } = useQuery({
    queryKey: ["palette-students", query],
    queryFn: () =>
      api.get("/admin/students", { params: { search: query, page_size: 5 } })
        .then((r: any) => r.data?.data ?? []),
    enabled: enabled && (role === "admin" || role === "teacher"),
    staleTime: 10_000,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["palette-teachers", query],
    queryFn: () =>
      api.get("/admin/teachers", { params: { search: query, page_size: 5 } })
        .then((r: any) => r.data?.data ?? []),
    enabled: enabled && role === "admin",
    staleTime: 10_000,
  });

  const items: PaletteItem[] = [
    ...(students as any[]).map((s: any) => ({
      id: `student-${s.id}`,
      label: `${s.user?.first_name} ${s.user?.last_name}`,
      sublabel: s.admission_no ?? s.user?.email,
      icon: GraduationCap,
      action: () => router.push(`${base}/students`),
      group: "Students",
    })),
    ...(teachers as any[]).map((t: any) => ({
      id: `teacher-${t.id}`,
      label: `${t.user?.first_name} ${t.user?.last_name}`,
      sublabel: t.employee_no ?? t.user?.email,
      icon: Users,
      action: () => router.push(`${base}/teachers`),
      group: "Teachers",
    })),
  ];

  return items;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CommandPaletteProps {
  role?: string;
}

export function CommandPalette({ role = "admin" }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const locale = useLocale();

  const navItems = useNavItems(role, locale, router);
  const searchResults = useSearch(query, role, locale, router);

  const items: PaletteItem[] = query.trim().length >= 2
    ? searchResults
    : navItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );

  // Group items
  const groups = Array.from(new Set(items.map((i) => i.group)));

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIdx(0);
  }, []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[selectedIdx]) {
      items[selectedIdx].action();
      close();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 end-6 z-40 hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-lg hover:border-[var(--color-primary-400)] hover:text-[var(--color-primary-600)] dark:hover:text-[var(--color-primary-400)] transition-all"
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 top-[10vh] z-50 mx-auto max-w-xl px-4">
        <div className="card overflow-hidden animate-slide-up shadow-xl">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search or navigate…"
              className="flex-1 bg-transparent outline-none text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] placeholder:text-[var(--color-text-muted)]"
            />
            <button onClick={close} className="p-1 rounded hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)] text-[var(--color-text-muted)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto py-2">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              (() => {
                let globalIdx = 0;
                return groups.map((group) => {
                  const groupItems = items.filter((i) => i.group === group);
                  return (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {group}
                      </div>
                      {groupItems.map((item) => {
                        const idx = globalIdx++;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { item.action(); close(); }}
                            onMouseEnter={() => setSelectedIdx(idx)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                              idx === selectedIdx
                                ? "bg-[var(--color-primary-50)] dark:bg-[rgba(37,99,235,0.12)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]"
                                : "text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)]"
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.label}</div>
                              {item.sublabel && (
                                <div className="text-xs text-[var(--color-text-muted)] truncate">{item.sublabel}</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                });
              })()
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[10px] text-[var(--color-text-muted)]">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> open</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  );
}
