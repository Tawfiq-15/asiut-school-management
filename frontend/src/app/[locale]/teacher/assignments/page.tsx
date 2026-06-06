"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FileText, Send, FolderOpen, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherAssignmentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [viewSubmissionsAssignment, setViewSubmissionsAssignment] = useState<any>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments-teacher"],
    queryFn: () => api.get("/teacher/assignments").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/assignments/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assignments-teacher"] }); toast.success(t("delete")); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) => api.put(`/teacher/assignments/${id}`, { is_published: published }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments-teacher"] }),
  });

  const getFileDownloadUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = api.defaults.baseURL || "http://localhost:8080/api/v1";
    try {
      const origin = new URL(baseUrl).origin;
      return `${origin}${url}`;
    } catch {
      return `http://localhost:8080${url}`;
    }
  };

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
    { key: "due_date", label: t("dueDate"), render: (r: any) => formatDate(r.due_date) },
    { key: "total_marks", label: t("maxMarks") },
    { key: "status", label: t("status"), render: (r: any) => (
      <span className={`badge ${r.is_published ? "badge-green" : "badge-yellow"}`}>{r.is_published ? t("active") : t("inactive")}</span>
    )},
    { key: "attachment", label: "Attachment", render: (r: any) => (
      r.file_url ? (
        <a 
          href={getFileDownloadUrl(r.file_url)} 
          target="_blank" 
          rel="noreferrer" 
          download 
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          Download
        </a>
      ) : (
        <span className="text-xs text-[var(--color-text-muted)]">—</span>
      )
    )},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => { setViewSubmissionsAssignment(r); setShowSubmissionsModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600" title="Submissions"><FolderOpen className="w-4 h-4"/></button>
        <button onClick={() => toggle.mutate({ id: r.id, published: !r.is_published })} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600" title={r.is_published ? "Unpublish" : "Publish"}><Send className="w-4 h-4"/></button>
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
        <button onClick={() => { if(confirm(t("deleteConfirm"))) del.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="teacher">
      <PageHeader title={t("assignmentsTitle")} subtitle={t("assignmentsSubtitle")} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addAssignment")}</button>
      }/>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={assignments || []} loading={isLoading} emptyMessage={t("noAssignments")} />
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editAssignment") : t("addAssignment")}>
        <AssignmentForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["assignments-teacher"] }); }} />
      </Modal>

      <Modal open={showSubmissionsModal} onClose={() => setShowSubmissionsModal(false)} title={`Submissions for: ${viewSubmissionsAssignment?.title ?? ""}`} maxWidth="max-w-4xl">
        {viewSubmissionsAssignment && (
          <SubmissionsList assignment={viewSubmissionsAssignment} getFileDownloadUrl={getFileDownloadUrl} />
        )}
      </Modal>
    </DashboardLayout>
  );
}

function AssignmentForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: existing?.title ?? "", description: existing?.description ?? "", subject_id: existing?.subject_id ?? "", due_date: existing?.due_date?.slice(0,16) ?? "", total_marks: existing?.total_marks ?? 100, is_published: existing?.is_published ?? false });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const [fileUrl, setFileUrl] = useState(existing?.file_url ?? "");
  const [fileName, setFileName] = useState(existing?.file_url ? existing.file_url.split("/").pop() : "");
  const [uploading, setUploading] = useState(false);

  const [selectedGradeId, setSelectedGradeId] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes-teacher"],
    queryFn: () => api.get("/teacher/classes").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-teacher"],
    queryFn: () => api.get("/teacher/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  useEffect(() => {
    if (existing?.subject_id && subjects.length > 0) {
      const sub = subjects.find((s: any) => s.id === existing.subject_id);
      if (sub?.grade_id) {
        setSelectedGradeId(sub.grade_id);
      }
    }
  }, [existing, subjects]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".pdf", ".ppt", ".pptx", ".doc", ".docx"];
    if (!allowed.includes(ext)) {
      toast.error("Only document files (pdf, ppt, pptx, doc, docx) are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFileUrl(res.data.url);
      setFileName(file.name);
      toast.success("Attachment uploaded successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFileUrl("");
    setFileName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, due_date: new Date(form.due_date).toISOString(), file_url: fileUrl || null };
      existing ? await api.put(`/teacher/assignments/${existing.id}`, payload) : await api.post("/teacher/assignments", payload);
      toast.success(t("save")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  const filteredSubjects = subjects.filter((s: any) => s.grade_id === selectedGradeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label><input value={form.title} onChange={e=>set("title",e.target.value)} className="form-input" required /></div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("class")}</label>
        <select
          value={selectedGradeId}
          onChange={e => {
            setSelectedGradeId(e.target.value);
            set("subject_id", "");
          }}
          className="form-input"
          required
        >
          <option value="">{t("selectClass")}</option>
          {((classes || []) as any[]).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name} - {c.section}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
        <select
          value={form.subject_id}
          onChange={e => set("subject_id", e.target.value)}
          className="form-input"
          required
          disabled={!selectedGradeId}
        >
          <option value="">{t("subject")}</option>
          {((filteredSubjects || []) as any[]).map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} className="form-input" rows={3} /></div>
      
      {/* File attachment area */}
      <div className="card p-3 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
        <label className="block text-sm font-medium mb-2 dark:text-[var(--color-dark-text)]">Assignment Attachment (Optional)</label>
        {fileUrl ? (
          <div className="flex items-center justify-between bg-white dark:bg-[var(--color-dark-surface-2)] p-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium truncate dark:text-[var(--color-dark-text)]">{fileName}</span>
            </div>
            <button 
              type="button" 
              onClick={handleRemoveFile} 
              className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 flex-shrink-0"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <label className="relative flex items-center justify-center border-2 border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors group">
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".pdf,.ppt,.pptx,.doc,.docx" 
                className="hidden" 
                disabled={uploading}
              />
              <div className="text-center">
                {uploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-xs text-[var(--color-text-muted)]">Uploading file...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <FileUp className="w-6 h-6 text-[var(--color-text-muted)] group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-semibold dark:text-[var(--color-dark-text)]">Click to upload attachment</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Supports PDF, PPT, PPTX, DOC, DOCX up to 10MB</span>
                  </div>
                )}
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("dueDate")}</label><input type="datetime-local" value={form.due_date} onChange={e=>set("due_date",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("maxMarks")}</label><input type="number" value={form.total_marks} onChange={e=>set("total_marks",parseFloat(e.target.value))} className="form-input" /></div>
      </div>
      <label className="flex items-center gap-2 text-sm dark:text-[var(--color-dark-text)] cursor-pointer">
        <input type="checkbox" checked={form.is_published} onChange={e=>set("is_published",e.target.checked)} className="rounded" /> {t("active")}
      </label>
      <button type="submit" disabled={loading || uploading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function SubmissionsList({ assignment, getFileDownloadUrl }: { assignment: any; getFileDownloadUrl: (url: string) => string }) {
  const qc = useQueryClient();
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => api.get(`/teacher/assignments/${assignment.id}/submissions`).then((r: any) => r.data ?? []),
  });

  const [gradingSub, setGradingSub] = useState<any>(null);
  const [marks, setMarks] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGrade(true);
    try {
      await api.patch(`/teacher/submissions/${gradingSub.id}/grade`, {
        marks,
        feedback,
      });
      toast.success("Submission graded successfully.");
      setGradingSub(null);
      qc.invalidateQueries({ queryKey: ["submissions", assignment.id] });
      qc.invalidateQueries({ queryKey: ["assignments-teacher"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to save grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  const startGrading = (sub: any) => {
    setGradingSub(sub);
    setMarks(sub.marks_obtained ?? 0);
    setFeedback(sub.feedback ?? "");
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      {gradingSub && (
        <form onSubmit={handleGradeSubmit} className="card p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50 space-y-3">
          <h3 className="font-bold text-sm text-blue-900 dark:text-blue-200">
            Grading: {gradingSub.student?.user?.first_name} {gradingSub.student?.user?.last_name}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-[var(--color-dark-text)]">Marks (Max: {assignment.total_marks})</label>
              <input
                type="number"
                min="0"
                max={assignment.total_marks}
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(parseFloat(e.target.value))}
                className="form-input text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 dark:text-[var(--color-dark-text)]">Feedback</label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="form-input text-sm"
                placeholder="Good effort!"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={() => setGradingSub(null)} className="btn-secondary py-1 px-3">Cancel</button>
            <button type="submit" disabled={savingGrade} className="btn-primary py-1 px-3">
              {savingGrade ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <table className="data-table">
          <thead className="bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
            <tr>
              <th>Student</th>
              <th>Date</th>
              <th>Late?</th>
              <th>Submitted Text</th>
              <th>Attachment</th>
              <th>Grade</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub: any) => (
                <tr key={sub.id}>
                  <td className="font-medium dark:text-[var(--color-dark-text)]">
                    <div>{sub.student?.user?.first_name} {sub.student?.user?.last_name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{sub.student?.admission_no}</div>
                  </td>
                  <td className="text-sm dark:text-[var(--color-dark-text)]">{new Date(sub.submitted_at).toLocaleString()}</td>
                  <td>
                    {sub.is_late ? (
                      <span className="badge badge-red">Late</span>
                    ) : (
                      <span className="badge badge-green">On Time</span>
                    )}
                  </td>
                  <td className="text-sm max-w-xs truncate dark:text-[var(--color-dark-text)]" title={sub.content}>{sub.content || "—"}</td>
                  <td>
                    {sub.file_url ? (
                      <a
                        href={getFileDownloadUrl(sub.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium text-sm"
                        download
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        Download
                      </a>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="text-sm font-semibold dark:text-[var(--color-dark-text)]">
                    {sub.marks_obtained !== null ? `${sub.marks_obtained} / ${assignment.total_marks}` : "Ungraded"}
                  </td>
                  <td>
                    <button
                      onClick={() => startGrading(sub)}
                      className="btn-secondary py-1 px-3 text-xs"
                    >
                      Grade
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
