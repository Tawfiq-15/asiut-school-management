"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ClipboardCheck, BookMarked, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherExamsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [activeExam, setActiveExam] = useState<any>(null);

  // 1. Fetch Exams
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => api.get("/teacher/exams").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  // 2. Fetch Teacher Subjects for dropdown
  const { data: subjects = [] } = useQuery({
    queryKey: ["teacher-subjects"],
    queryFn: () => api.get("/teacher/subjects").then((r: any) => r.data?.data ?? r.data ?? []),
  });

  // 3. Delete Mutation
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/exams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast.success("Exam deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    }
  });

  const columns = [
    { key: "title", label: t("examsTitle"), render: (r: any) => (
      <div className="flex items-center gap-2">
        <BookMarked className="w-4 h-4 text-purple-500 flex-shrink-0" />
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.subject?.name}</div>
        </div>
      </div>
    )},
    { key: "exam_type", label: t("type"), render: (r: any) => <span className="badge badge-purple capitalize">{r.exam_type}</span> },
    { key: "date", label: t("date"), render: (r: any) => formatDate(r.date) },
    { key: "marks", label: t("maxMarks"), render: (r: any) => `${r.total_marks} (Pass: ${r.pass_marks})` },
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveExam(r); setShowResultsModal(true); }}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1 text-xs font-semibold"
          title="Manage Results"
        >
          <ClipboardCheck className="w-4 h-4" /> Results
        </button>
        <button
          onClick={() => { setSelected(r); setShowModal(true); }}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"
          title={t("edit")}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => { if(confirm(t("deleteConfirm"))) del.mutate(r.id); }}
          className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"
          title={t("delete")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title={t("teacherExamsTitle")}
        subtitle={t("teacherExamsSubtitle")}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addExam")}
          </button>
        }
      />
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={exams} loading={isLoading} emptyMessage={t("noExams")} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addExam")}>
        <ExamForm
          existing={selected}
          subjects={subjects}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["teacher-exams"] }); }}
        />
      </Modal>

      <Modal open={showResultsModal} onClose={() => setShowResultsModal(false)} title={`Exam Results: ${activeExam?.title ?? ""}`} maxWidth="max-w-4xl">
        {activeExam && <ExamResultsForm exam={activeExam} onClose={() => setShowResultsModal(false)} />}
      </Modal>
    </DashboardLayout>
  );
}

function ExamForm({ existing, subjects, onSuccess }: { existing: any; subjects: any[]; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    subject_id: existing?.subject_id ?? "",
    exam_type: existing?.exam_type ?? "written",
    date: existing?.date?.slice(0, 16) ?? "",
    duration_min: existing?.duration_min ?? 60,
    total_marks: existing?.total_marks ?? 100,
    pass_marks: existing?.pass_marks ?? 40,
    instructions: existing?.instructions ?? "",
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/teacher/exams/${existing.id}`, form);
        toast.success("Exam updated successfully");
      } else {
        await api.post("/teacher/exams", form);
        toast.success("Exam created successfully");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("examName")}</label>
        <input value={form.title} onChange={e => set("title", e.target.value)} className="form-input" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
        <select value={form.subject_id} onChange={e => set("subject_id", e.target.value)} className="form-input" required>
          <option value="">{t("select")}</option>
          {subjects.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code}) - Grade {s.grade?.name ?? ""}{s.grade?.section ?? ""}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("type")}</label>
          <select value={form.exam_type} onChange={e => set("exam_type", e.target.value)} className="form-input">
            <option value="written">Written</option>
            <option value="oral">Oral</option>
            <option value="practical">Practical</option>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label>
          <input type="datetime-local" value={form.date} onChange={e => set("date", e.target.value)} className="form-input" required />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">Duration (min)</label>
          <input type="number" min={1} value={form.duration_min} onChange={e => set("duration_min", parseInt(e.target.value))} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("maxMarks")}</label>
          <input type="number" min={1} value={form.total_marks} onChange={e => set("total_marks", parseFloat(e.target.value))} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">Pass Marks</label>
          <input type="number" min={0} value={form.pass_marks} onChange={e => set("pass_marks", parseFloat(e.target.value))} className="form-input" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">Instructions</label>
        <textarea value={form.instructions} onChange={e => set("instructions", e.target.value)} className="form-input" rows={3} placeholder="Optional instructions..." />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function ExamResultsForm({ exam, onClose }: { exam: any; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, { marks_obtained: string; grade_letter: string; remarks: string }>>({});

  // 1. Fetch Grade Students
  const gradeId = exam.subject?.grade_id;
  const { data: students = [], isLoading: stLoading } = useQuery({
    queryKey: ["grade-students", gradeId],
    queryFn: () => api.get("/teacher/students", { params: { grade_id: gradeId } }).then((r: any) => r.data?.data ?? r.data ?? []),
    enabled: !!gradeId,
  });

  // 2. Fetch Existing Exam Results
  const { data: results = [], isLoading: resLoading } = useQuery({
    queryKey: ["exam-results", exam.id],
    queryFn: () => api.get(`/teacher/exams/${exam.id}/results`).then((r: any) => r.data?.data ?? r.data ?? []),
  });

  // Combine and initialize form fields on data change
  useEffect(() => {
    if (students.length > 0 && !stLoading && !resLoading) {
      const dataMap: Record<string, any> = {};
      students.forEach((student: any) => {
        const existing = results.find((r: any) => r.student_id === student.id);
        dataMap[student.id] = existing ? {
          marks_obtained: existing.marks_obtained !== null && existing.marks_obtained !== undefined ? String(existing.marks_obtained) : "",
          grade_letter: existing.grade_letter ?? "",
          remarks: existing.remarks ?? "",
        } : {
          marks_obtained: "",
          grade_letter: "",
          remarks: "",
        };
      });
      setFormData(dataMap);
    }
  }, [students, results, stLoading, resLoading]);

  // Helper to map and update
  const handleValChange = (studentId: string, field: string, val: string) => {
    setFormData(prev => {
      const current = prev[studentId] ?? { marks_obtained: "", grade_letter: "", remarks: "" };
      const updated = { ...current, [field]: val };
      
      // Auto calculate grade letter when marks_obtained changes
      if (field === "marks_obtained") {
        const marks = parseFloat(val);
        if (!isNaN(marks) && exam.total_marks > 0) {
          const pct = (marks / exam.total_marks) * 100;
          if (pct >= 90) updated.grade_letter = "A";
          else if (pct >= 80) updated.grade_letter = "B";
          else if (pct >= 70) updated.grade_letter = "C";
          else if (pct >= 60) updated.grade_letter = "D";
          else updated.grade_letter = "F";
        } else {
          updated.grade_letter = "";
        }
      }
      return { ...prev, [studentId]: updated };
    });
  };

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Format payload for bulk save
      const payload = Object.entries(formData).map(([studentId, data]) => {
        const marks = parseFloat(data.marks_obtained);
        return {
          student_id: studentId,
          marks_obtained: isNaN(marks) ? null : marks,
          grade_letter: data.grade_letter || null,
          remarks: data.remarks || null,
        };
      });

      await api.post(`/teacher/exams/${exam.id}/results`, payload);
      toast.success("Exam results saved successfully");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = stLoading || resLoading;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-sm">
        <div>
          <strong>Max Marks:</strong> {exam.total_marks} | <strong>Pass Marks:</strong> {exam.pass_marks}
        </div>
        <div>
          <strong>Grade:</strong> {exam.subject?.grade?.name ?? ""}{exam.subject?.grade?.section ?? ""}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
          <span className="text-sm mt-2 text-[var(--color-text-muted)]">Loading class roster and results...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 text-[var(--color-text-muted)]">No students enrolled in this class.</div>
      ) : (
        <form onSubmit={handleBulkSave} className="space-y-4">
          <div className="max-h-[50vh] overflow-y-auto border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl divide-y divide-[var(--color-border)] dark:divide-[var(--color-dark-border)]">
            {students.map((student: any) => {
              const values = formData[student.id] ?? { marks_obtained: "", grade_letter: "", remarks: "" };
              
              return (
                <div key={student.id} className="p-4 grid md:grid-cols-12 gap-3 items-center hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)]">
                  <div className="md:col-span-4 min-w-0">
                    <div className="font-semibold text-sm truncate dark:text-[var(--color-dark-text)]">
                      {student.user?.first_name} {student.user?.last_name}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">{student.admission_no}</div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs md:hidden font-medium text-[var(--color-text-muted)] block mb-1">Marks</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      max={exam.total_marks}
                      placeholder={`Max ${exam.total_marks}`}
                      value={values.marks_obtained}
                      onChange={e => handleValChange(student.id, "marks_obtained", e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs md:hidden font-medium text-[var(--color-text-muted)] block mb-1">Grade</label>
                    <input
                      type="text"
                      placeholder="Letter"
                      value={values.grade_letter}
                      onChange={e => handleValChange(student.id, "grade_letter", e.target.value)}
                      className="form-input text-sm text-center uppercase"
                      maxLength={2}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs md:hidden font-medium text-[var(--color-text-muted)] block mb-1">Remarks</label>
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={values.remarks}
                      onChange={e => handleValChange(student.id, "remarks", e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t dark:border-[var(--color-dark-border)]">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Results
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


