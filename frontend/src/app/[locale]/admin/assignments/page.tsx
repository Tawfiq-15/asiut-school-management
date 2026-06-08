"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, Send, Users, Loader2, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function AssignmentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [submissionsAssignment, setSubmissionsAssignment] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments-admin"],
    queryFn: () => api.get("/admin/assignments").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/assignments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments-admin"] }); toast.success(t("assignmentDeleted")); setDeleteTarget(null); },
  });

  const published = (assignments as any[]).filter((a: any) => a.is_published).length;
  const drafts = (assignments as any[]).length - published;

  const filtered = (assignments as any[]).filter((a: any) => {
    if (statusFilter === "published" && !a.is_published) return false;
    if (statusFilter === "draft" && a.is_published) return false;
    if (search) { const q = search.toLowerCase(); return a.title?.toLowerCase().includes(q) || a.subject?.name?.toLowerCase().includes(q); }
    return true;
  });

  const toggle = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.put(`/teacher/assignments/${id}`, { is_published: published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments-admin"] }),
  });

  const columns = [
    { key: "title", label: t("assignmentsTitle"), render: (r: any) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.subject?.name}</div>
        </div>
      </div>
    )},
    { key: "due_date",    label: t("dueDate"), render: (r: any) => formatDate(r.due_date) },
    { key: "total_marks", label: t("marksCol") },
    { key: "status", label: t("status"), render: (r: any) => (
      <span className={`badge ${r.is_published ? "badge-green" : "badge-yellow"}`}>{r.is_published ? t("published") : t("draft")}</span>
    )},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-1">
        <button
          onClick={() => setSubmissionsAssignment(r)}
          title={t("viewSubmissions")}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-green-600"
        >
          <Users className="w-4 h-4" />
        </button>
        <button onClick={() => toggle.mutate({ id: r.id, published: !r.is_published })} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600" title={r.is_published ? t("draft") : t("published")}><Send className="w-4 h-4"/></button>
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("assignmentsTitle")} subtitle={t("assignmentsSubtitle")} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addAssignment")}</button>
      }/>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard title="Total"     value={(assignments as any[]).length} icon={FileText} color="blue"   />
        <StatCard title="Published" value={published}                    icon={Send}     color="green"  />
        <StatCard title="Drafts"    value={drafts}                       icon={FileText} color="orange" />
      </div>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..." className="form-input pl-9 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input max-w-xs">
          <option value="">All Status</option>
          <option value="published">{t("published")}</option>
          <option value="draft">{t("draft")}</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage={t("noAssignments")} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editAssignment") : t("addAssignment")}>
        <AssignmentForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["assignments-admin"] }); }} />
      </Modal>

      <Modal
        open={!!submissionsAssignment}
        onClose={() => setSubmissionsAssignment(null)}
        title={`${t("viewSubmissions")} — ${submissionsAssignment?.title ?? ""}`}
        maxWidth="max-w-3xl"
      >
        {submissionsAssignment && (
          <SubmissionsViewer assignment={submissionsAssignment} />
        )}
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Delete assignment <span className="font-semibold dark:text-[var(--color-dark-text)]">{deleteTarget.title}</span>? All submissions will also be deleted.</p>
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

function SubmissionsViewer({ assignment }: { assignment: any }) {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks_obtained: "", feedback: "" });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => api.get(`/teacher/assignments/${assignment.id}/submissions`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const grade = useMutation({
    mutationFn: (submissionId: string) =>
      api.patch(`/submissions/${submissionId}/grade`, {
        marks_obtained: parseFloat(gradeForm.marks_obtained),
        feedback: gradeForm.feedback,
      }),
    onSuccess: () => {
      toast.success(t("submissionGraded"));
      qc.invalidateQueries({ queryKey: ["submissions", assignment.id] });
      setGradingId(null);
      setGradeForm({ marks_obtained: "", feedback: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? t("operationFailed")),
  });

  const statusBadge = (s: any) => {
    if (s.marks_obtained !== null && s.marks_obtained !== undefined) return <span className="badge badge-green">{t("graded")}</span>;
    if (s.submitted_at) return <span className="badge badge-yellow">{t("underReview")}</span>;
    return <span className="badge badge-blue">{t("pending")}</span>;
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary-600)]" /></div>;

  if (submissions.length === 0) {
    return <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">{t("noSubmissions")}</div>;
  }

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      {submissions.map((sub: any) => (
        <div key={sub.id} className="border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium dark:text-[var(--color-dark-text)]">
                {sub.student?.user?.first_name} {sub.student?.user?.last_name}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {t("submittedAt")}: {sub.submitted_at ? formatDate(sub.submitted_at) : "—"}
                {sub.is_late && <span className="ml-2 text-red-500 font-medium">{t("lateLabel")}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {statusBadge(sub)}
              {sub.marks_obtained !== null && sub.marks_obtained !== undefined && (
                <span className="text-sm font-semibold dark:text-[var(--color-dark-text)]">{sub.marks_obtained}/{assignment.total_marks}</span>
              )}
            </div>
          </div>

          {sub.content && (
            <div className="text-sm text-[var(--color-text-muted)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] rounded p-2 line-clamp-2">
              {sub.content}
            </div>
          )}

          {sub.feedback && (
            <div className="text-xs text-green-700 dark:text-green-400 flex items-start gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{sub.feedback}</span>
            </div>
          )}

          {gradingId === sub.id ? (
            <div className="space-y-2 pt-2 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">{t("marksObtained")} / {assignment.total_marks}</label>
                  <input
                    type="number"
                    min={0}
                    max={assignment.total_marks}
                    value={gradeForm.marks_obtained}
                    onChange={e => setGradeForm(p => ({ ...p, marks_obtained: e.target.value }))}
                    className="form-input py-1.5"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">{t("feedback")}</label>
                  <input
                    value={gradeForm.feedback}
                    onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))}
                    className="form-input py-1.5"
                    placeholder={t("optional")}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => grade.mutate(sub.id)}
                  disabled={grade.isPending || !gradeForm.marks_obtained}
                  className="btn-primary text-sm py-1.5 flex-1 justify-center"
                >
                  {grade.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t("save")}
                </button>
                <button onClick={() => setGradingId(null)} className="btn-secondary text-sm py-1.5">{t("cancel")}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setGradingId(sub.id);
                setGradeForm({ marks_obtained: String(sub.marks_obtained ?? ""), feedback: sub.feedback ?? "" });
              }}
              className="text-xs text-[var(--color-primary-600)] hover:underline font-medium"
            >
              {sub.marks_obtained !== null && sub.marks_obtained !== undefined ? t("regrade") : t("grade")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AssignmentForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    subject_id: existing?.subject_id ?? "",
    due_date: existing?.due_date?.slice(0,10) ?? "",
    total_marks: existing?.total_marks ?? 100,
    is_published: existing?.is_published ?? false,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/teacher/assignments/${existing.id}`, form) : await api.post("/teacher/assignments", form);
      toast.success(t("assignmentSaved")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label><input value={form.title} onChange={e=>set("title",e.target.value)} className="form-input" required /></div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
        <select value={form.subject_id} onChange={e=>set("subject_id",e.target.value)} className="form-input" required>
          <option value="">{t("select")}</option>
          {(subjects as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} className="form-input" rows={3} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("dueDate")}</label><input type="datetime-local" value={form.due_date} onChange={e=>set("due_date",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("totalMarks")}</label><input type="number" value={form.total_marks} onChange={e=>set("total_marks",parseFloat(e.target.value))} className="form-input" /></div>
      </div>
      <label className="flex items-center gap-2 text-sm dark:text-[var(--color-dark-text)] cursor-pointer">
        <input type="checkbox" checked={form.is_published} onChange={e=>set("is_published",e.target.checked)} className="rounded" /> {t("publishImmediately")}
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : t("save")}</button>
    </form>
  );
}
