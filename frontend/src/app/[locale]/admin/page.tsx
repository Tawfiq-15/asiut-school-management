"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users, GraduationCap, School, CreditCard,
  ClipboardList, UserCheck, TrendingUp,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { DashboardLayout, StatCard, StatCardSkeleton, PageHeader, EmptyState } from "@/components/ui";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations, useLocale } from "next-intl";

function useAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [overview, attendance, grades] = await Promise.all([
        api.get("/admin/analytics/overview"),
        api.get("/admin/analytics/attendance"),
        api.get("/admin/analytics/grades"),
      ]);
      return { overview: overview.data, attendance: attendance.data, grades: grades.data };
    },
  });
}

type ActivityItem = {
  type: "admission" | "payment" | "exam" | "leave";
  ref: string;
  label: string;
  amount: number | null;
  status: string | null;
  created_at: string | null;
};

function useActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics/activity");
      return res.data ?? [];
    },
  });
}

const GRADE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#f97316"];

function ActivityDot({ type }: { type: ActivityItem["type"] }) {
  const cls = {
    admission: "activity-dot-admission",
    payment:   "activity-dot-payment",
    leave:     "activity-dot-leave",
    exam:      "activity-dot-exam",
  }[type] ?? "activity-dot-default";

  return (
    <span className={cn("activity-dot", cls)}>
      {type.charAt(0).toUpperCase()}
    </span>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("Dashboard.admin");
  const locale = useLocale();
  const { data, isLoading } = useAnalytics();
  const { data: activities = [], isLoading: activityLoading } = useActivity();

  const stats = data?.overview ?? {};

  const activityMessage = (a: ActivityItem): string => {
    const name = a.label || "—";
    switch (a.type) {
      case "admission": return t("activityAdmission", { name });
      case "payment":   return t("activityPayment", { name });
      case "exam":      return t("activityExam", { name });
      case "leave":     return t("activityLeave", { name });
      default:          return name;
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title={t("totalStudents")}  value={stats.total_students ?? 0}  icon={GraduationCap} color="blue"   />
            <StatCard title={t("totalTeachers")}  value={stats.total_teachers ?? 0}  icon={Users}         color="purple" />
            <StatCard title={t("activeClasses")}  value={stats.total_classes ?? 0}   icon={School}        color="green"  />
            <StatCard title={t("revenueMtd")}     value={formatCurrency(stats.total_revenue ?? 0)} icon={CreditCard} color="orange" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid xl:grid-cols-3 gap-6 mb-8">
        {/* Attendance trend */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="font-semibold text-base mb-4 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("attendanceTrend")}</h2>
          {isLoading ? (
            <div className="skeleton w-full h-[240px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.attendance ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    fontSize: 13,
                    boxShadow: "var(--shadow-lg)",
                  }}
                  formatter={((v: any, name: any) => [v, String(name).charAt(0).toUpperCase() + String(name).slice(1)]) as any}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="present" stroke="#3b82f6" fill="url(#presentGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="absent"  stroke="#ef4444" fill="url(#absentGrad)"  strokeWidth={2} />
                <Area type="monotone" dataKey="late"    stroke="#f59e0b" fill="none"              strokeWidth={1.5} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grade distribution */}
        <div className="card p-5">
          <h2 className="font-semibold text-base mb-4 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("studentsByGrade")}</h2>
          {isLoading ? (
            <div className="skeleton w-full h-[240px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data?.grades ?? []} dataKey="students" nameKey="grade" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {(data?.grades ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((v: any) => [v, "Students"]) as any}
                  contentStyle={{
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    fontSize: 13,
                    boxShadow: "var(--shadow-lg)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid xl:grid-cols-2 gap-6">
        {/* Pending actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-base mb-4 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("pendingActions")}</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: t("pendingAdmissions"), value: stats.pending_admissions ?? 0,           icon: UserCheck, colorClass: "text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" },
                { label: t("overduePayments"),   value: formatCurrency(stats.pending_payments ?? 0), icon: CreditCard, colorClass: "text-[var(--color-warning-600)] dark:text-[var(--color-warning-500)]" },
              ].map((item) => (
                <div key={item.label} className="pending-item">
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", item.colorClass)} />
                  <div className="flex-1">
                    <div className="text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{item.label}</div>
                  </div>
                  <span className="font-bold text-lg text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System overview */}
        <div className="card p-5">
          <h2 className="font-semibold text-base mb-4 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("systemOverview")}</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {[
                { label: t("totalParents"),  value: stats.total_parents  ?? 0 },
                { label: t("activeClasses"), value: stats.total_classes  ?? 0 },
                { label: t("totalStudents"), value: stats.total_students ?? 0 },
                { label: t("totalTeachers"), value: stats.total_teachers ?? 0 },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center p-3 rounded-xl bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{row.label}</span>
                  <span className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card p-5 mt-6">
        <h2 className="font-semibold text-base mb-6 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("recentActivityFeed")}</h2>
        {activityLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                <div className="skeleton h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t("noActivity")} />
        ) : (
          <ul className="space-y-0">
            {activities.map((activity, idx) => (
              <li key={`${activity.type}-${activity.ref}`} className="relative">
                {/* connector line */}
                {idx !== activities.length - 1 && (
                  <span
                    className="absolute top-8 start-4 bottom-0 w-0.5 bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex gap-3 pb-6 rtl:flex-row-reverse">
                  <ActivityDot type={activity.type} />
                  <div className="flex-1 min-w-0 pt-1 flex justify-between gap-4">
                    <p className="text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
                      {activityMessage(activity)}
                    </p>
                    <time
                      dateTime={activity.created_at ?? undefined}
                      className="text-xs whitespace-nowrap text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]"
                    >
                      {formatRelativeTime(activity.created_at, locale)}
                    </time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
