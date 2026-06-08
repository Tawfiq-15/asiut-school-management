"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookMarked, ClipboardList, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal, StatCard } from "@/components/ui";
import { formatDate, gradeLetterFromPercent } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ExamsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [resultsExam, setResultsExam] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["exams-admin"],
    queryFn: () => api.get("/admin/exams").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/exams/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["exams-admin"] }); toast.success(t("examDeleted")); setDeleteTarget(null); },
  });

  const examTypes = [...new Set((exams as any[]).map((e: any) => e.exam_type).filter(Boolean))];
  const upcoming = (exams as any[]).filter((e: any) => new Date(e.date) > new Date()).length;
  const past = (exams as any[]).length - upcoming;

  const filtered = (exams as any[]).filter((e: any) => {
    if (typeFilter && e.exam_type !== typeFilter) return false;
    if (search) { const q = search.toLowerCase(); return e.title?.toLowerCase().includes(q) || e.subject?.name?.toLowerCase().includes(q); }
    return true;
  });

  const columns = [
    { key: "title", label: t("examTitle"), render: (r: any) => (
      <div className="flex items-center gap-2">
        <BookMarked className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.subject?.name}</div>
        </div>
      </div>
    )},
    { key: "exam_type",   label: t("examTypeCol"),      render: (r: any) => <span className="badge badge-purple">{r.exam_type}</span> },
    { key: "date",        label: t("date"),             render: (r: any) => formatDate(r.date) },
    { key: "duration_min",label: t("examDurationCol"),  render: (r: any) => `${r.duration_min} min` },
    { key: "total_marks", label: t("totalMarks") },
    { key: "pass_marks",  label: t("passMarks") },
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-1">
        <button
          onClick={() => setResultsExam(r)}
          title={t("enterResults")}
          className="p-1.5 rounded-lg hover:bg-purple-50 text-[var(--color-text-muted)] hover:text-purple-600"
        >
          <ClipboardList className="w-4 h-4" />
        </button>
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("examsTitle")} subtitle={t("examsSubtitle")} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addExam")}</button>
      }/>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard title="Total Exams" value={(exams as any[]).length} icon={BookMarked} color="blue"   />
        <StatCard title="Upcoming"    value={upcoming}               icon={BookMarked} color="green"  />
        <StatCard title="Past"        value={past}                   icon={BookMarked} color="purple" />
      </div>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exams..." className="form-input pl-9 w-full" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-input max-w-xs">
          <option value="">All Types</option>
          {examTypes.map((tp: any) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage={t("noExams")} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addExam")}>
        <ExamForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["exams-admin"] }); }} />
      </Modal>

      <Modal open={!!resultsExam} onClose={() => setResultsExam(null)} title={`${t("enterResults")} — ${resultsExam?.title ?? ""}`} maxWidth="max-w-2xl">
        {resultsExam && <ExamResultsForm exam={resultsExam} onSuccess={() => setResultsExam(null)} />}
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Delete exam <span className="font-semibold dark:text-[var(--color-dark-text)]">{deleteTarget.title}</span>? All results will be lost.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{t("cancel")}</button>
              <button onClick={() => del.mutate(deleteTarget.id)} disabled={del.isPending} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white">{t("delete")}</button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function ExamResultsForm({ exam, onSuccess }: { exam: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [marks, setMarks] = useState<Record<string, string>>({});

  // Fetch existing results
  const { data: results = [] } = useQuery({
    queryKey: ["exam-results", exam.id],
    queryFn: () => api.get(`/teacher/exams/${exam.id}/results`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  useEffect(() => {
    if (results.length > 0) {
      const init: Record<string, string> = {};
      results.forEach((res: any) => { init[res.student_id] = String(res.marks_obtained ?? ""); });
      setMarks(init);
    }
  }, [results]);

  // Fetch subject to get grade_id
  const { data: subject } = useQuery({
    queryKey: ["subject-detail", exam.subject_id],
    queryFn: () => api.get(`/admin/subjects/${exam.subject_id}`).then((r: any) => r.data?.data ?? r.data ?? null),
    enabled: !!exam.subject_id,
  });

  // Fetch students for that grade
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students-for-exam", subject?.grade_id],
    queryFn: () => api.get("/admin/students", { params: { grade_id: subject!.grade_id, page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!subject?.grade_id,
  });

  useEffect(() => {
    if (students.length > 0) {
      setMarks(prev => {
        const next = { ...prev };
        students.forEach((s: any) => { if (!(s.id in next)) next[s.id] = ""; });
        return next;
      });
    }
  }, [students]);

  const save = useMutation({
    mutationFn: () => {
      const payload = students
        .filter((s: any) => marks[s.id] !== "" && marks[s.id] !== undefined)
        .map((s: any) => ({ student_id: s.id, marks_obtained: parseFloat(marks[s.id]) }));
      return api.post(`/teacher/exams/${exam.id}/results`, { results: payload });
    },
    onSuccess: () => { toast.success(t("resultsSaved")); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? t("operationFailed")),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
        <span><strong className="dark:text-[var(--color-dark-text)]">{t("totalMarks")}:</strong> {exam.total_marks}</span>
        <span><strong className="dark:text-[var(--color-dark-text)]">{t("passMarks")}:</strong> {exam.pass_marks}</span>
        <span><strong className="dark:text-[var(--color-dark-text)]">{t("subject")}:</strong> {exam.subject?.name}</span>
      </div>

      <div className="border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-md overflow-hidden max-h-96 overflow-y-auto">
        {studentsLoading || !subject ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-600)]" /></div>
        ) : students.length === 0 ? (
          <div className="text-center p-6 text-sm text-[var(--color-text-muted)]">{t("noStudents")}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">{t("student")}</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">{t("marksObtained")}</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--color-text-muted)]">{t("gradeLetter")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
              {students.map((s: any) => {
                const val = marks[s.id] ?? "";
                const pct = val !== "" ? (parseFloat(val) / exam.total_marks) * 100 : null;
                const grade = pct !== null ? gradeLetterFromPercent(pct) : "—";
                const passed = pct !== null && parseFloat(val) >= exam.pass_marks;
                return (
                  <tr key={s.id} className="hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)]">
                    <td className="px-4 py-2">
                      <div className="font-medium dark:text-[var(--color-dark-text)]">{s.user?.first_name} {s.user?.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono">{s.admission_no}</div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        max={exam.total_marks}
                        value={val}
                        onChange={e => setMarks(p => ({ ...p, [s.id]: e.target.value }))}
                        placeholder="—"
                        className="form-input py-1 w-24 text-center"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {pct !== null ? (
                        <span className={`badge ${passed ? "badge-green" : "badge-red"}`}>{grade}</span>
                      ) : <span className="text-[var(--color-text-muted)]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending || students.length === 0}
        className="btn-primary w-full justify-center"
      >
        {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {save.isPending ? t("saving") : t("save")}
      </button>
    </div>
  );
}

function ExamForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    subject_id: existing?.subject_id ?? "",
    exam_type: existing?.exam_type ?? "written",
    date: existing?.date?.slice(0,16) ?? "",
    duration_min: existing?.duration_min ?? 60,
    total_marks: existing?.total_marks ?? 100,
    pass_marks: existing?.pass_marks ?? 40,
    instructions: existing?.instructions ?? "",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/teacher/exams/${existing.id}`, form) : await api.post("/teacher/exams", form);
      toast.success(t("examSaved")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label><input value={form.title} onChange={e=>set("title",e.target.value)} className="form-input" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
          <select value={form.subject_id} onChange={e=>set("subject_id",e.target.value)} className="form-input" required>
            <option value="">{t("select")}</option>
            {(subjects as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("examType")}</label>
          <select value={form.exam_type} onChange={e=>set("exam_type",e.target.value)} className="form-input">
            {["written","oral","practical","quiz","midterm","final"].map(tp=><option key={tp}>{tp}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label><input type="datetime-local" value={form.date} onChange={e=>set("date",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("examDuration")}</label><input type="number" value={form.duration_min} onChange={e=>set("duration_min",parseInt(e.target.value))} className="form-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("totalMarks")}</label><input type="number" value={form.total_marks} onChange={e=>set("total_marks",parseFloat(e.target.value))} className="form-input" /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("passMarks")}</label><input type="number" value={form.pass_marks} onChange={e=>set("pass_marks",parseFloat(e.target.value))} className="form-input" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("examInstructions")}</label><textarea value={form.instructions} onChange={e=>set("instructions",e.target.value)} className="form-input" rows={2} /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : t("save")}</button>
    </form>
  );
}
