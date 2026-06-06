"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function AttendancePage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [gradeFilter, setGradeFilter] = useState("");
  const [showMarkModal, setShowMarkModal] = useState(false);

  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-admin", date, gradeFilter],
    queryFn: () => api.get("/admin/attendance", { params: { date, grade_id: gradeFilter, page_size: 50 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const records = data ?? [];
  const present = records.filter((r: any) => r.status === "present").length;
  const absent  = records.filter((r: any) => r.status === "absent").length;
  const late    = records.filter((r: any) => r.status === "late").length;

  const columns = [
    { key: "student", label: t("student"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.student?.user?.first_name} {r.student?.user?.last_name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.student?.admission_no}</div>
      </div>
    )},
    { key: "subject", label: t("subject"), render: (r: any) => r.subject?.name ?? "General" },
    { key: "date",    label: t("date"),    render: (r: any) => formatDate(r.date) },
    { key: "status",  label: t("status"),  render: (r: any) => {
      const map: Record<string, string> = { present: "badge-green", absent: "badge-red", late: "badge-yellow", excused: "badge-blue" };
      return <span className={`badge ${map[r.status] ?? "badge-blue"}`}>{r.status}</span>;
    }},
    { key: "notes", label: "Notes", render: (r: any) => <span className="text-xs text-[var(--color-text-muted)]">{r.notes ?? "—"}</span> },
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("attendanceTitle")}
        subtitle={t("attendanceSubtitle")}
        actions={
          <button onClick={() => setShowMarkModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("markAttendance")}
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t("present"), value: present, icon: CheckCircle2, cls: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/40" },
          { label: t("absent"),  value: absent,  icon: XCircle,      cls: "text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/40" },
          { label: t("late"),    value: late,    icon: Clock,        cls: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/40" },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 border ${s.cls}`}>
            <s.icon className="w-5 h-5" />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">{t("date")}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">{t("class")}</label>
          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="form-input">
            <option value="">{t("allClasses")}</option>
            {grades.map((g: any) => <option key={g.id} value={g.id}>Grade {g.name}{g.section || ""}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={records} loading={isLoading} emptyMessage={t("noAttendance")} />
      </div>

      <Modal open={showMarkModal} onClose={() => setShowMarkModal(false)} title={t("markAttendance")} maxWidth="max-w-2xl">
        <MarkAttendanceForm
          grades={grades}
          onSuccess={() => {
            setShowMarkModal(false);
            qc.invalidateQueries({ queryKey: ["attendance-admin"] });
          }}
        />
      </Modal>
    </DashboardLayout>
  );
}

function MarkAttendanceForm({ grades, onSuccess }: { grades: any[]; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-by-grade", gradeId],
    queryFn: () => api.get("/admin/subjects", { params: { grade_id: gradeId } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!gradeId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students-for-attendance", gradeId],
    queryFn: () => api.get("/admin/students", { params: { grade_id: gradeId, page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!gradeId,
  });

  useEffect(() => {
    if (students.length > 0) {
      const init: Record<string, string> = {};
      students.forEach((s: any) => { init[s.id] = "present"; });
      setStatusMap(init);
    }
  }, [students]);

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s: any) => { next[s.id] = status; });
    setStatusMap(next);
  };

  const submit = useMutation({
    mutationFn: () => {
      const records = students.map((s: any) => ({
        student_id: s.id,
        date,
        status: statusMap[s.id] ?? "present",
        subject_id: subjectId || undefined,
      }));
      return api.post("/teacher/attendance", { records });
    },
    onSuccess: () => { toast.success(t("save")); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? t("operationFailed")),
  });

  const statusOptions: { key: string; cls: string }[] = [
    { key: "present", cls: "present" },
    { key: "absent",  cls: "absent" },
    { key: "late",    cls: "late" },
    { key: "excused", cls: "excused" },
  ];

  const btnCls: Record<string, string> = {
    present: "bg-green-500 text-white ring-2 ring-green-500/20",
    absent:  "bg-red-500 text-white ring-2 ring-red-500/20",
    late:    "bg-yellow-500 text-white ring-2 ring-yellow-500/20",
    excused: "bg-blue-500 text-white ring-2 ring-blue-500/20",
  };
  const inactiveCls: Record<string, string> = {
    present: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 hover:bg-green-100",
    absent:  "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100",
    late:    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 hover:bg-yellow-100",
    excused: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 hover:bg-blue-100",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("class")}</label>
          <select value={gradeId} onChange={e => { setGradeId(e.target.value); setSubjectId(""); setStatusMap({}); }} className="form-input">
            <option value="">{t("select")}</option>
            {grades.map((g: any) => <option key={g.id} value={g.id}>Grade {g.name}{g.section || ""}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="form-input" disabled={!gradeId}>
            <option value="">{t("allSubjects")}</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {gradeId && (
        <>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-[var(--color-text-muted)]">{t("bulkAction")}:</span>
            <button onClick={() => markAll("present")} className="px-3 py-1 text-xs rounded-lg bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 hover:bg-green-100 font-medium">
              {t("markAllPresent")}
            </button>
            <button onClick={() => markAll("absent")} className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 font-medium">
              {t("markAllAbsent")}
            </button>
          </div>

          <div className="border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-md overflow-hidden max-h-80 overflow-y-auto">
            {studentsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-600)]" /></div>
            ) : students.length === 0 ? (
              <div className="text-center p-6 text-sm text-[var(--color-text-muted)]">{t("noStudents")}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">{t("student")}</th>
                    <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
                  {students.map((s: any) => {
                    const current = statusMap[s.id] ?? "present";
                    return (
                      <tr key={s.id} className="hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)]">
                        <td className="px-4 py-2">
                          <div className="font-medium dark:text-[var(--color-dark-text)]">{s.user?.first_name} {s.user?.last_name}</div>
                          <div className="text-xs text-[var(--color-text-muted)] font-mono">{s.admission_no}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {statusOptions.map(opt => (
                              <button
                                key={opt.key}
                                onClick={() => setStatusMap(p => ({ ...p, [s.id]: opt.key }))}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all capitalize ${current === opt.key ? btnCls[opt.key] : inactiveCls[opt.key]}`}
                              >
                                {t(opt.key as any)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !gradeId || students.length === 0}
            className="btn-primary w-full justify-center"
          >
            {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submit.isPending ? t("saving") : t("save")}
          </button>
        </>
      )}
    </div>
  );
}
