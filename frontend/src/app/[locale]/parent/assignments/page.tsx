"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentAssignmentsPage() {
  const t = useTranslations("P");
  const [studentId, setStudentId] = useState("");

  const { data: children = [] } = useQuery({ queryKey: ["parent-children"], queryFn: () => api.get("/parent/children").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["parent-assignments", studentId],
    queryFn: () => api.get(`/parent/children/${studentId}/assignments`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!studentId,
  });

  useEffect(() => { if (!studentId && children.length > 0) setStudentId(children[0].id); }, [children, studentId]);

  const columns = [
    { key: "title", label: t("assignmentsTitle"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.subject?.name}</div>
      </div>
    )},
    { key: "due_date", label: t("dueDate"), render: (r: any) => formatDate(r.due_date) },
    { key: "status", label: t("status"), render: (r: any) => {
      if (r.submission) return <span className="badge badge-green">{t("submitted")}</span>;
      const overdue = new Date(r.due_date).getTime() < Date.now();
      return <span className={`badge ${overdue ? "badge-red" : "badge-yellow"}`}>{overdue ? t("overdue") : t("pending")}</span>;
    }},
    { key: "score", label: t("maxMarks"), render: (r: any) => r.submission?.marks_obtained !== null ? `${r.submission?.marks_obtained} / ${r.total_marks}` : "—" },
  ];

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("assignmentsTitle")} subtitle={t("assignmentsSubtitle")} />
      <div className="card p-4 mb-4 max-w-sm">
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("student")}</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="form-input">
          {children.map((c: any) => <option key={c.id} value={c.id}>{c.user?.first_name} {c.user?.last_name}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={assignments} loading={isLoading} emptyMessage={t("noAssignments")} />
      </div>
    </DashboardLayout>
  );
}
