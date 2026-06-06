"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentGradesPage() {
  const t = useTranslations("P");
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["student-grades"],
    queryFn: () => api.get("/student/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

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
    { key: "remarks", label: t("description"), render: (r: any) => <span className="text-xs text-[var(--color-text-muted)]">{r.remarks ?? "—"}</span> },
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("studentGradesTitle")} subtitle={t("studentGradesSubtitle")} />
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={grades} loading={isLoading} emptyMessage={t("noExams")} />
      </div>
    </DashboardLayout>
  );
}
