"use client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DashboardLayout, PageHeader } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

const COLORS = ["#3b82f6","#8b5cf6","#22c55e","#f59e0b","#ef4444","#06b6d4"];

export default function AnalyticsPage() {
  const t = useTranslations("P");
  const td = useTranslations("Dashboard.admin");
  const { data: overview } = useQuery({ queryKey: ["analytics-overview"], queryFn: () => api.get("/admin/analytics/overview").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: attendance = [] } = useQuery({ queryKey: ["analytics-attendance"], queryFn: () => api.get("/admin/analytics/attendance").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: grades = [] } = useQuery({ queryKey: ["analytics-grades"], queryFn: () => api.get("/admin/analytics/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("analyticsTitle")} subtitle={t("analyticsSubtitle")} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: td("totalStudents"), value: overview?.total_students ?? "—" },
          { label: td("totalTeachers"),  value: overview?.total_teachers ?? "—" },
          { label: td("activeClasses"),  value: overview?.total_classes ?? "—" },
          { label: td("revenueMtd"),   value: overview?.total_revenue ? `$${Number(overview.total_revenue).toLocaleString()}` : "—" },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <div className="text-sm text-[var(--color-text-muted)]">{k.label}</div>
            <div className="text-3xl font-extrabold mt-1 dark:text-[var(--color-dark-text)]">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4 dark:text-[var(--color-dark-text)]">{td("attendanceTrend")}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="absent"  stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="late"    stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4 dark:text-[var(--color-dark-text)]">{td("studentsByGrade")}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={grades} dataKey="students" nameKey="grade" outerRadius={90} innerRadius={50}>
                {grades.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4 dark:text-[var(--color-dark-text)]">Enrollment by Grade</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={grades}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
            <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
}
