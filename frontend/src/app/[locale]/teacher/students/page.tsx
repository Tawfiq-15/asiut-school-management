"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherStudentsPage() {
  const t = useTranslations("P");
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: () => api.get("/teacher/students").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const columns = [
    { key: "student", label: t("student"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.user?.first_name} {r.user?.last_name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.user?.email}</div>
      </div>
    )},
    { key: "admission_no", label: t("admissionNo"), render: (r: any) => r.admission_no },
    { key: "grade", label: t("class"), render: (r: any) => r.grade ? `${r.grade.name}${r.grade.section||""}` : "—" },
    { key: "gender", label: t("gender"), render: (r: any) => <span className="capitalize">{r.gender === "Male" ? t("male") : r.gender === "Female" ? t("female") : r.gender ?? "—"}</span> },
  ];

  return (
    <DashboardLayout role="teacher">
      <PageHeader title={t("teacherStudentsTitle")} subtitle={t("teacherStudentsSubtitle")} />
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={students} loading={isLoading} emptyMessage={t("noStudents")} />
      </div>
    </DashboardLayout>
  );
}
