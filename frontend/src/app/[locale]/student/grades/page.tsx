"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Award, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentGradesPage() {
  const t = useTranslations("P");
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["student-grades"],
    queryFn: () => api.get("/student/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const list = grades as any[];
  const graded = list.filter((r) => r.marks_obtained !== null && r.marks_obtained !== undefined);
  const passed = graded.filter((r) => r.marks_obtained >= (r.exam?.pass_marks ?? 0)).length;
  const failed = graded.length - passed;
  const avgPct = graded.length > 0
    ? Math.round(graded.reduce((s, r) => s + (r.marks_obtained / (r.exam?.total_marks || 1)) * 100, 0) / graded.length)
    : 0;

  const columns = [
    { key: "exam", label: t("examsTitle"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.exam?.title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.exam?.subject?.name}</div>
      </div>
    )},
    { key: "date", label: t("date"), render: (r: any) => formatDate(r.exam?.date) },
    { key: "marks", label: t("maxMarks"), render: (r: any) => (
      <span className="font-semibold dark:text-[var(--color-dark-text)]">
        {r.marks_obtained !== null && r.marks_obtained !== undefined ? `${r.marks_obtained} / ${r.exam?.total_marks}` : t("pending")}
      </span>
    )},
    { key: "grade_letter", label: t("gradeLetter"), render: (r: any) => r.grade_letter ? <span className="badge badge-purple">{r.grade_letter}</span> : "—" },
    { key: "remarks", label: t("description"), render: (r: any) => <span className="text-xs text-[var(--color-text-muted)]">{r.remarks ?? "—"}</span> },
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("studentGradesTitle")} subtitle={t("studentGradesSubtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Exams Taken"  value={graded.length}    icon={Award}       color="blue"   />
        <StatCard title="Average"      value={`${avgPct}%`}     icon={TrendingUp}  color="purple" />
        <StatCard title="Passed"       value={passed}           icon={CheckCircle2} color="green"  />
        <StatCard title="Failed"       value={failed}           icon={XCircle}     color="red"    />
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={list} loading={isLoading} emptyMessage={t("noExams")} />
      </div>
    </DashboardLayout>
  );
}
