"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, School, Loader2, Mail, GraduationCap } from "lucide-react";
import { DashboardLayout, PageHeader, Modal, DataTable } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function TeacherClassesPage() {
  const t = useTranslations("P");
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: () => api.get("/teacher/classes").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  return (
    <DashboardLayout role="teacher">
      <PageHeader title={t("teacherClassesTitle")} subtitle={t("teacherClassesSubtitle")} />
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-md" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c: any, i: number) => (
            <div
              key={c.id}
              onClick={() => setSelectedClass(c)}
              className="card p-5 cursor-pointer card-hover"
            >
              <div className="w-10 h-10 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center mb-3">
                <School className="w-5 h-5 text-white" />
              </div>
              <div className="font-bold text-lg text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("class")}: {c.name}{c.section ? `-${c.section}` : ""}</div>
              <div className="flex justify-between items-center mt-3">
                {c.room && <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{t("room")}: {c.room}</div>}
                <div className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{c.student_count ?? 0} Students</span>
                </div>
              </div>
            </div>
          ))}
          {classes.length === 0 && <div className="col-span-full text-center py-12 text-[var(--color-text-muted)]">{t("noClassesToday")}</div>}
        </div>
      )}

      <Modal
        open={selectedClass !== null}
        onClose={() => setSelectedClass(null)}
        title={selectedClass ? `Class: ${selectedClass.name}${selectedClass.section ? `-${selectedClass.section}` : ""}` : ""}
        maxWidth="max-w-3xl"
      >
        {selectedClass && <ClassStudentsList gradeId={selectedClass.id} />}
      </Modal>
    </DashboardLayout>
  );
}

function ClassStudentsList({ gradeId }: { gradeId: string }) {
  const t = useTranslations("P");
  
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["grade-students", gradeId],
    queryFn: () => api.get("/teacher/students", { params: { grade_id: gradeId } }).then((r: any) => r.data?.data ?? r.data ?? []),
    enabled: !!gradeId,
  });

  const columns = [
    {
      key: "name",
      label: t("name"),
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
          <span className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
            {r.user?.first_name} {r.user?.last_name}
          </span>
        </div>
      )
    },
    {
      key: "admission_no",
      label: t("admissionNo"),
      render: (r: any) => <span className="text-xs font-mono text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{r.admission_no}</span>
    },
    {
      key: "email",
      label: t("email"),
      render: (r: any) => (
        <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {r.user?.email}
        </span>
      )
    },
    {
      key: "gender",
      label: t("gender"),
      render: (r: any) => (
        <span className="badge badge-blue text-xs capitalize">{r.user?.gender ?? "—"}</span>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
        <span className="text-sm mt-2 text-[var(--color-text-muted)]">Loading enrolled students...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="font-semibold text-sm mb-2 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">Enrolled Student Roster</div>
      <DataTable
        columns={columns}
        data={students}
        emptyMessage={t("noStudents")}
      />
    </div>
  );
}
