"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentGradesPage() {
  const t = useTranslations("P");
  const [studentId, setStudentId] = useState("");

  const { data: children = [] } = useQuery({ queryKey: ["parent-children"], queryFn: () => api.get("/parent/children").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["parent-grades", studentId],
    queryFn: () => api.get(`/parent/children/${studentId}/grades`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!studentId,
  });

  useEffect(() => { if (!studentId && children.length > 0) setStudentId(children[0].id); }, [children, studentId]);

  const columns = [
    { key: "exam", label: t("examsTitle"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.exam?.title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.exam?.subject?.name}</div>
      </div>
    )},
    { key: "date", label: t("date"), render: (r: any) => formatDate(r.exam?.date) },
    { key: "marks", label: t("maxMarks"), render: (r: any) => (
      <span className="font-semibold">{r.marks_obtained !== null ? `${r.marks_obtained} / ${r.exam?.total_marks}` : t("pending")}</span>
    )},
    { key: "grade_letter", label: t("gradeLetter"), render: (r: any) => r.grade_letter ? <span className="badge badge-purple">{r.grade_letter}</span> : "—" },
  ];

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("studentGradesTitle")} subtitle={t("studentGradesSubtitle")} />
      <div className="card p-4 mb-4 max-w-sm">
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("student")}</label>
        <select value={studentId} onChange={e=>setStudentId(e.target.value)} className="form-input">
          {children.map((c: any) => <option key={c.id} value={c.id}>{c.user?.first_name} {c.user?.last_name}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={grades} loading={isLoading} emptyMessage={t("noExams")} />
      </div>
    </DashboardLayout>
  );
}
