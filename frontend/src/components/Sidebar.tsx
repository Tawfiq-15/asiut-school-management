"use client";

import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  ClipboardList, BarChart3, Bell, Settings, LogOut, ChevronLeft,
  School, MessageSquare, CreditCard, FileText, UserCheck,
  BookMarked, Menu, X, Sun, Moon, Globe, ClipboardCheck
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore, useUser } from "@/lib/store";
import { cn, getInitials } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface NavItem {
  labelKey: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  section?: string;
}

const navByRole: Record<string, NavItem[]> = {
  admin: [
    { labelKey: "dashboard",    icon: LayoutDashboard, href: "/admin", section: "main" },
    { labelKey: "students",     icon: GraduationCap,   href: "/admin/students", section: "main" },
    { labelKey: "teachers",     icon: Users,           href: "/admin/teachers", section: "main" },
    { labelKey: "classes",      icon: School,          href: "/admin/classes", section: "academic" },
    { labelKey: "subjects",     icon: BookOpen,        href: "/admin/subjects", section: "academic" },
    { labelKey: "schedules",    icon: Calendar,        href: "/admin/schedules", section: "academic" },
    { labelKey: "admissions",   icon: UserCheck,       href: "/admin/admissions", section: "academic" },
    { labelKey: "attendance",   icon: ClipboardList,   href: "/admin/attendance", section: "records" },
    { labelKey: "assignments",  icon: FileText,        href: "/admin/assignments", section: "records" },
    { labelKey: "exams",        icon: BookMarked,      href: "/admin/exams", section: "records" },
    { labelKey: "payments",      icon: CreditCard,       href: "/admin/payments", section: "records" },
    { labelKey: "leaveRequests", icon: ClipboardCheck,  href: "/admin/leave-requests", section: "records" },
    { labelKey: "announcements", icon: Bell,             href: "/admin/announcements", section: "comms" },
    { labelKey: "events",       icon: Calendar,        href: "/admin/events", section: "comms" },
    { labelKey: "analytics",    icon: BarChart3,       href: "/admin/analytics", section: "comms" },
    { labelKey: "library",      icon: BookOpen,        href: "/admin/library", section: "comms" },
    { labelKey: "messages",     icon: MessageSquare,   href: "/messages", section: "comms" },
    { labelKey: "settings",     icon: Settings,        href: "/admin/settings", section: "comms" },
  ],
  teacher: [
    { labelKey: "dashboard",    icon: LayoutDashboard, href: "/teacher" },
    { labelKey: "myClasses",    icon: School,          href: "/teacher/classes" },
    { labelKey: "attendance",   icon: ClipboardList,   href: "/teacher/attendance" },
    { labelKey: "assignments",  icon: FileText,        href: "/teacher/assignments" },
    { labelKey: "exams",        icon: BookMarked,      href: "/teacher/exams" },
    { labelKey: "marks",        icon: BookMarked,      href: "/teacher/marks" },
    { labelKey: "students",     icon: GraduationCap,   href: "/teacher/students" },
    { labelKey: "announcements",icon: Bell,            href: "/teacher/announcements" },
    { labelKey: "messages",     icon: MessageSquare,   href: "/messages" },
    { labelKey: "schedule",     icon: Calendar,        href: "/teacher/schedule" },
    { labelKey: "settings",     icon: Settings,        href: "/teacher/settings" },
  ],
  student: [
    { labelKey: "dashboard",    icon: LayoutDashboard, href: "/student" },
    { labelKey: "attendance",   icon: ClipboardList,   href: "/student/attendance" },
    { labelKey: "grades",       icon: BarChart3,       href: "/student/grades" },
    { labelKey: "assignments",  icon: FileText,        href: "/student/assignments" },
    { labelKey: "announcements",icon: Bell,            href: "/student/announcements" },
    { labelKey: "timetable",    icon: Calendar,        href: "/student/timetable" },
    { labelKey: "fees",         icon: CreditCard,      href: "/student/fees" },
    { labelKey: "messages",     icon: MessageSquare,   href: "/messages" },
    { labelKey: "leaveRequest", icon: UserCheck,       href: "/student/leave" },
    { labelKey: "settings",     icon: Settings,        href: "/student/settings" },
  ],
  parent: [
    { labelKey: "dashboard",    icon: LayoutDashboard, href: "/parent" },
    { labelKey: "attendance",   icon: ClipboardList,   href: "/parent/attendance" },
    { labelKey: "grades",       icon: BarChart3,       href: "/parent/grades" },
    { labelKey: "assignments",  icon: FileText,        href: "/parent/assignments" },
    { labelKey: "fees",         icon: CreditCard,      href: "/parent/fees" },
    { labelKey: "announcements",icon: Bell,            href: "/parent/announcements" },
    { labelKey: "messages",     icon: MessageSquare,   href: "/messages" },
    { labelKey: "settings",     icon: Settings,        href: "/parent/settings" },
  ],
};

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Sidebar");
  const { logout } = useAuthStore();
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Fetch pending admissions count for the notification badge
  const { data: pendingAdmissions } = useQuery({
    queryKey: ["pendingAdmissionsCount"],
    queryFn: () => api.get("/admin/admissions", { params: { status: "pending", page_size: 1 } }).then(res => res.data),
    enabled: user?.role === "admin",
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const navItems = navByRole[role] ?? [];

  const renderNavItems = (items: NavItem[]) => {
    let lastSection = "";
    return items.map((item) => {
      const isDashboard = item.href === `/${role}`;
      const isActive = pathname === item.href || (!isDashboard && item.href !== "/" && pathname.startsWith(item.href + "/"));

      let sectionLabel = null;
      if (item.section && item.section !== lastSection && !collapsed) {
        lastSection = item.section;
        const labels: Record<string, string> = { main: "Overview", academic: "Academic", records: "Records", comms: "Communication" };
        sectionLabel = (
          <div className="px-3 pt-4 pb-1 first:pt-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] opacity-50">{labels[item.section] ?? item.section}</span>
          </div>
        );
      }

      return (
        <div key={item.href}>
          {sectionLabel}
          <Link
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "sidebar-link",
              isActive && "active",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? t(item.labelKey as any) : undefined}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{t(item.labelKey as any)}</span>}
            
            {/* Admissions specific dynamic badge */}
            {!collapsed && item.labelKey === "admissions" && pendingAdmissions?.total > 0 && (
              <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingAdmissions.total > 99 ? '99+' : pendingAdmissions.total}
              </span>
            )}
            
            {/* Standard static badge */}
            {!collapsed && item.labelKey !== "admissions" && item.badge && (
              <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        </div>
      );
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center gap-3 p-5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]", collapsed && "justify-center px-3")}>
        <div className="w-8 h-8 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center flex-shrink-0">
          <School className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("techInstitute")}</div>
            <div className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] capitalize">{t("portal", { role })}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {renderNavItems(navItems)}
      </nav>

      {/* User footer */}
      <div className={cn("p-3 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] space-y-1")}>
        {/* Lang toggle */}
        <button
          onClick={() => router.replace(pathname, { locale: locale === "en" ? "ar" : "en" })}
          className={cn("sidebar-link w-full", collapsed && "justify-center px-2")}
        >
          <Globe className="w-[18px] h-[18px]" />
          {!collapsed && <span>{locale === "en" ? "العربية" : "English"}</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn("sidebar-link w-full", collapsed && "justify-center px-2")}
        >
          {!mounted ? (
            <div className="w-[18px] h-[18px] opacity-0" />
          ) : theme === "dark" ? (
            <Sun className="w-[18px] h-[18px]" />
          ) : (
            <Moon className="w-[18px] h-[18px]" />
          )}
          {!collapsed && <span>{!mounted ? "" : theme === "dark" ? t("lightMode") : t("darkMode")}</span>}
        </button>

        {/* User card — click to open profile/settings */}
        {user && !collapsed && (
          <Link
            href={`/${role}/settings`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-2)] transition-colors cursor-pointer"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                {getInitials(user.first_name, user.last_name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{user.first_name} {user.last_name}</div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] truncate">{user.email}</div>
            </div>
            <Settings className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0 opacity-50" />
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={() => { logout(); window.location.href = "/auth/login"; }}
          className={cn("sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20", collapsed && "justify-center px-2")}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] border-r border-[var(--color-border)] dark:border-[var(--color-dark-border)] transition-all duration-200",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center justify-center shadow-sm hover:shadow transition-shadow"
        >
          <ChevronLeft className={cn("w-3 h-3 transition-transform", collapsed && "rotate-180")} />
        </button>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger — positioned to not overlap content */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 rtl:left-auto rtl:right-4 z-40 w-10 h-10 rounded-md bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-lg flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
          />
          <aside
            className={cn(
              "lg:hidden fixed top-0 z-50 h-full w-64 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] flex flex-col shadow-xl transition-transform duration-200",
              locale === "ar"
                ? "right-0 border-l border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
                : "left-0 border-r border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            )}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className={cn("absolute top-4 z-10 w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)] transition-colors", locale === "ar" ? "left-4" : "right-4")}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
