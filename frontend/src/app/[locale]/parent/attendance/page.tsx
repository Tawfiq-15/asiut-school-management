"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentAttendancePage() {
  const t = useTranslations("P");
  const [studentId, setStudentId] = useState("");

  const { data: children = [] } = useQuery({ queryKey: ["parent-children"], queryFn: () => api.get("/parent/children").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["parent-attendance", studentId],
    queryFn: () => api.get(`/parent/children/${studentId}/attendance`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!studentId,
  });

  useEffect(() => { if (!studentId && children.length > 0) setStudentId(children[0].id); }, [children, studentId]);

  const columns = [
    { key: "date", label: t("date"), render: (r: any) => formatDate(r.date) },
    { key: "subject", label: t("subject"), render: (r: any) => r.subject?.name ?? "General" },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { present: "badge-green", absent: "badge-red", late: "badge-yellow", excused: "badge-blue" };
      return <span className={`badge ${map[r.status]}`}>{t(r.status)}</span>;
    }},
  ];

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("attendanceTitle")} subtitle={t("attendanceSubtitle")} />
      <div className="card p-4 mb-4 max-w-sm">
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("student")}</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="form-input">
          {children.map((c: any) => <option key={c.id} value={c.id}>{c.user?.first_name} {c.user?.last_name}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={attendance} loading={isLoading} emptyMessage={t("noAttendance")} />
      </div>
    </DashboardLayout>
  );
}
