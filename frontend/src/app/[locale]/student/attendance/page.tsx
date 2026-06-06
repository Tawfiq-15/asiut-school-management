"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, BookOpen } from "lucide-react";
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
        <div className="card p-4 flex items-center gap-3 border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/30">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-black text-green-700 dark:text-green-400">{summary.present}</div>
            <div className="text-xs text-green-800 dark:text-green-300">{t("present")}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/30">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{summary.absent}</div>
            <div className="text-xs text-red-700 dark:text-red-300">{t("absent")}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800/30">
          <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <div className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{summary.late}</div>
            <div className="text-xs text-yellow-800 dark:text-yellow-300">{t("late")}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
          <BookOpen className="w-5 h-5 text-[var(--color-primary-600)] flex-shrink-0" />
          <div>
            <div className="text-2xl font-black dark:text-[var(--color-dark-text)]">{rate}%</div>
            <div className="text-xs text-[var(--color-text-muted)]">{t("attendanceRate") ?? "Attendance Rate"}</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={records} loading={isLoading} emptyMessage={t("noAttendance")} />
      </div>
    </DashboardLayout>
  );
}
