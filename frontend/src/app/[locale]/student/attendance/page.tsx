"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentAttendancePage() {
  const t = useTranslations("P");

  const { data, isLoading } = useQuery({
    queryKey: ["student-attendance"],
    queryFn: () => api.get("/student/attendance").then((r: any) => r.data),
  });

  const records = data?.records ?? [];
  const summary = data?.summary ?? { present: 0, absent: 0, late: 0 };
  const total = summary.present + summary.absent + summary.late;
  const rate = total > 0 ? Math.round((summary.present / total) * 100) : 0;

  const columns = [
    { key: "date", label: t("date"), render: (r: any) => formatDate(r.date) },
    { key: "subject", label: t("subject"), render: (r: any) => r.subject?.name ?? "—" },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { present: "badge-green", absent: "badge-red", late: "badge-yellow", excused: "badge-blue" };
      return <span className={`badge ${map[r.status] ?? "badge-yellow"}`}>{t(r.status)}</span>;
    }},
    { key: "notes", label: t("description"), render: (r: any) => (
      <span className="text-xs text-[var(--color-text-muted)]">{r.notes ?? "—"}</span>
    )},
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("attendanceTitle")} subtitle={t("attendanceSubtitle")} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t("present")}       value={summary.present} icon={CheckCircle2} color="green"  />
        <StatCard title={t("absent")}        value={summary.absent}  icon={XCircle}      color="red"    />
        <StatCard title={t("late")}          value={summary.late}    icon={Clock}        color="orange" />
        <StatCard title="Attendance Rate"    value={`${rate}%`}      icon={TrendingUp}   color="blue"   />
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={records} loading={isLoading} emptyMessage={t("noAttendance")} />
      </div>
    </DashboardLayout>
  );
}
