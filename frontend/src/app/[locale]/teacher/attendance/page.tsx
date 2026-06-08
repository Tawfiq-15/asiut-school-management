"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable, StatCard } from "@/components/ui";
import { Check, X, Clock, Loader2, CheckCircle2, XCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherAttendancePage() {
  const t = useTranslations("P");
  const tT = useTranslations("T");
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subjectId, setSubjectId] = useState("");

  // 1. Fetch Teacher's Subjects
  const { data: subjects = [], isLoading: sLoading } = useQuery({
    queryKey: ["teacher-subjects"],
    queryFn: () => api.get("/teacher/subjects").then((r: any) => r.data?.data ?? r.data ?? []),
  });

  // 2. Fetch Students/Attendance for selected Subject/Date
  const { data: students = [], isLoading: stLoading, refetch } = useQuery({
    queryKey: ["teacher-attendance", date, subjectId],
    queryFn: () => api.get("/teacher/attendance", { params: { date, subject_id: subjectId } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!subjectId && !!date,
  });

  const mark = useMutation({
    mutationFn: ({ student_id, status }: any) => api.post("/teacher/attendance", { 
      records: [{ student_id, date, status, subject_id: subjectId }] 
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["teacher-attendance", date, subjectId] }); 
      toast.success(t("save")); 
    },
  });

  const bulkMark = useMutation({
    mutationFn: (records: any[]) => api.post("/teacher/attendance", { records }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["teacher-attendance", date, subjectId] }); 
      toast.success(t("save")); 
    },
  });

  const handleMarkAll = (status: string) => {
    if (!students || students.length === 0) return;
    const records = students.map((s: any) => ({
      student_id: s.student_id,
      date,
      status,
      subject_id: subjectId
    }));
    bulkMark.mutate(records);
  };

  const columns = [
    { key: "student", label: t("student"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.student?.user?.first_name} {r.student?.user?.last_name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.student?.admission_no}</div>
      </div>
    )},
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { present: "badge-green", absent: "badge-red", late: "badge-yellow", excused: "badge-blue" };
      return r.status ? <span className={`badge ${map[r.status]}`}>{t(r.status)}</span> : <span className="text-[var(--color-text-muted)]">{t("noAttendance")}</span>;
    }},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button 
          onClick={() => mark.mutate({ student_id: r.student_id, status: "present" })} 
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${r.status === 'present' ? 'bg-green-500 text-white shadow-sm ring-2 ring-green-500/20' : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'}`}
        >
          {t("present")}
        </button>
        <button 
          onClick={() => mark.mutate({ student_id: r.student_id, status: "absent" })} 
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${r.status === 'absent' ? 'bg-red-500 text-white shadow-sm ring-2 ring-red-500/20' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
        >
          {t("absent")}
        </button>
        <button 
          onClick={() => mark.mutate({ student_id: r.student_id, status: "late" })} 
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${r.status === 'late' ? 'bg-yellow-500 text-white shadow-sm ring-2 ring-yellow-500/20' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'}`}
        >
          {t("late")}
        </button>
      </div>
    )},
  ];

  const isLoading = sLoading || stLoading;

  const presentCount = (students as any[]).filter((s: any) => s.status === "present").length;
  const absentCount  = (students as any[]).filter((s: any) => s.status === "absent").length;
  const lateCount    = (students as any[]).filter((s: any) => s.status === "late").length;
  const unmarked     = (students as any[]).filter((s: any) => !s.status).length;

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t("attendanceTitle")} 
        subtitle={t("attendanceSubtitle")} 
        actions={
          subjectId && students.length > 0 ? (
            <div className="flex gap-2">
              <button 
                onClick={() => handleMarkAll("present")} 
                className="btn-secondary flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-950/20"
                disabled={bulkMark.isPending}
              >
                <Check className="w-4 h-4" /> Mark All Present
              </button>
              <button 
                onClick={() => handleMarkAll("absent")} 
                className="btn-secondary flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20"
                disabled={bulkMark.isPending}
              >
                <X className="w-4 h-4" /> Mark All Absent
              </button>
            </div>
          ) : null
        }
      />

      {subjectId && students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard title={t("present")} value={presentCount} icon={CheckCircle2} color="green"  />
          <StatCard title={t("absent")}  value={absentCount}  icon={XCircle}      color="red"    />
          <StatCard title={t("late")}    value={lateCount}    icon={Clock}        color="orange" />
          <StatCard title="Unmarked"     value={unmarked}      icon={UserCheck}    color="blue"   />
        </div>
      )}

      <div className="card p-4 mb-6 flex gap-4 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{tT("selectSubject")}</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="form-input bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500"
            disabled={sLoading}
          >
            <option value="" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-[var(--color-dark-text)]">
              {tT("selectSubject")}
            </option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-[var(--color-dark-text)]">
                {s.name} - {s.grade?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t("date")}</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="form-input bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" 
          />
        </div>
      </div>

      {!subjectId ? (
        <div className="text-center p-12 card text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          Please select a subject to manage student attendance.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
      ) : students.length === 0 ? (
        <div className="text-center p-12 text-zinc-500">{t("noAttendance")}</div>
      ) : (
        <div className="card overflow-hidden">
          <DataTable columns={columns} data={students} loading={isLoading} emptyMessage={t("noAttendance")} />
        </div>
      )}
    </DashboardLayout>
  );
}
