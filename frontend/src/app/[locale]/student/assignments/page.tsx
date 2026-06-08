"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable, Modal, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { FileText, FileUp, Loader2, Eye, CheckCircle, AlertCircle, AlertTriangle, ClipboardList, Clock } from "lucide-react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function StudentAssignmentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: profile } = useQuery({ queryKey: ["student-profile"], queryFn: () => api.get("/student/profile").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const gradeId = profile?.grade_id ?? profile?.student?.grade_id;

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["student-assignments", gradeId],
    queryFn: () => api.get("/student/assignments", { params: { grade_id: gradeId } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!gradeId,
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
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title || "Untitled Assignment"}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.subject?.name}</div>
      </div>
    )},
    { key: "due_date", label: t("dueDate"), render: (r: any) => formatDate(r.due_date) },
    { key: "status", label: t("status"), render: (r: any) => {
      const sub = r.submission;
      if (sub) {
        if (sub.marks_obtained !== null && sub.marks_obtained !== undefined) {
          return <span className="badge badge-green">{t("graded")}</span>;
        }
        return <span className="badge badge-blue bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t("underReview")}</span>;
      }
      const overdue = new Date(r.due_date).getTime() < Date.now();
      return <span className={`badge ${overdue ? "badge-red" : "badge-yellow"}`}>{overdue ? t("overdue") : t("pending")}</span>;
    }},
    { key: "score", label: t("maxMarks"), render: (r: any) => r.submission?.marks_obtained !== null && r.submission?.marks_obtained !== undefined ? `${r.submission?.marks_obtained} / ${r.total_marks}` : "—" },
    { key: "actions", label: "", render: (r: any) => (
      <button 
        onClick={() => { setSelected(r); setShowModal(true); }}
        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600 inline-flex items-center gap-1 font-semibold text-xs"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
        View & Submit
      </button>
    )},
  ];

  const list = assignments as any[];
  const submitted = list.filter((a) => a.submission).length;
  const pending   = list.filter((a) => !a.submission && new Date(a.due_date) >= new Date()).length;
  const pastDue   = list.filter((a) => !a.submission && new Date(a.due_date) < new Date()).length;

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("assignmentsTitle")} subtitle={t("assignmentsSubtitle")} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Submitted" value={submitted} icon={CheckCircle}   color="green"  />
        <StatCard title="Pending"   value={pending}   icon={Clock}         color="orange" />
        <StatCard title="Overdue"   value={pastDue}   icon={ClipboardList} color="red"    />
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={assignments} loading={isLoading} emptyMessage={t("noAssignments")} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Assignment Details" maxWidth="max-w-2xl">
        {selected && (
          <AssignmentDetails 
            assignment={selected} 
            gradeId={gradeId} 
            getFileDownloadUrl={getFileDownloadUrl} 
            onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["student-assignments", gradeId] }); }} 
          />
        )}
      </Modal>
    </DashboardLayout>
  );
}

function AssignmentDetails({ assignment, gradeId, getFileDownloadUrl, onSuccess }: { assignment: any; gradeId: string; getFileDownloadUrl: (url: string) => string; onSuccess: () => void }) {
  const sub = assignment.submission;
  
  const [content, setContent] = useState(sub?.content ?? "");
  const [fileUrl, setFileUrl] = useState(sub?.file_url ?? "");
  const [fileName, setFileName] = useState(() => {
    if (!sub?.file_url) return "";
    const parts = sub.file_url.split("/");
    return parts[parts.length - 1];
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      toast.success("Homework file uploaded successfully.");
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
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/student/assignments/${assignment.id}/submit`, {
        content,
        file_url: fileUrl || null
      });
      toast.success(sub ? "Submission updated successfully." : "Assignment submitted successfully.");
      setIsEditing(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const overdue = new Date(assignment.due_date).getTime() < Date.now();
  const isGraded = sub?.marks_obtained !== null && sub?.marks_obtained !== undefined;

  return (
    <div className="space-y-6">
      {/* Assignment Header Info */}
      <div className="border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-4">
        <h2 className="text-lg font-bold dark:text-[var(--color-dark-text)]">{assignment.title}</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{assignment.subject?.name} • Max Marks: {assignment.total_marks}</p>
        <p className="text-xs text-red-500 font-medium mt-1">Due Date: {new Date(assignment.due_date).toLocaleString()}</p>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-sm font-semibold dark:text-[var(--color-dark-text)]">Description</h4>
        <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1 whitespace-pre-wrap">
          {assignment.description || "No description provided."}
        </p>
      </div>

      {/* Teacher's Attachment */}
      {assignment.file_url && (
        <div className="card p-3 border border-blue-100 bg-blue-50/20 dark:border-blue-900/50 dark:bg-blue-950/10 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium dark:text-[var(--color-dark-text)] truncate">Teacher's Reference File</span>
          </div>
          <a
            href={getFileDownloadUrl(assignment.file_url)}
            target="_blank"
            rel="noreferrer"
            download
            className="text-xs btn-secondary py-1 px-3"
          >
            Download
          </a>
        </div>
      )}

      {/* Submission Area */}
      <div className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] pt-4">
        {sub && !isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>You have submitted this assignment</span>
              </div>
              {!isGraded && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary py-1 px-3 text-xs font-semibold"
                >
                  Edit Submission
                </button>
              )}
            </div>
            
            <div className="bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] p-3 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)] space-y-2 text-sm">
              <div>
                <span className="font-semibold dark:text-[var(--color-dark-text)]">Submission Date:</span>{" "}
                <span className="text-[var(--color-text-muted)]">{new Date(sub.submitted_at).toLocaleString()}</span>
                {sub.is_late && <span className="ml-2 badge badge-red text-[10px]">Late</span>}
              </div>
              {sub.content && (
                <div>
                  <span className="font-semibold dark:text-[var(--color-dark-text)]">Your Notes/Content:</span>
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1 whitespace-pre-wrap">{sub.content}</p>
                </div>
              )}
              {sub.file_url && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-semibold dark:text-[var(--color-dark-text)]">Your Attachment:</span>
                  <a
                    href={getFileDownloadUrl(sub.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    Download File
                  </a>
                </div>
              )}
            </div>

            {/* Grading Card */}
            {isGraded ? (
              <div className="card p-4 border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900/50 space-y-2">
                <h4 className="font-bold text-sm text-green-950 dark:text-green-200 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Assignment Graded
                </h4>
                <div className="text-2xl font-black text-green-700 dark:text-green-400">
                  {sub.marks_obtained} <span className="text-sm font-medium text-green-950/60 dark:text-green-300">/ {assignment.total_marks} Marks</span>
                </div>
                {sub.feedback && (
                  <div className="text-xs text-green-900 dark:text-green-300">
                    <span className="font-bold">Teacher's Feedback:</span> {sub.feedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-3 border border-blue-200 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <span>Submitted (Under Review). Awaiting grading by teacher.</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold dark:text-[var(--color-dark-text)]">
                {sub ? "Edit Your Submission" : "Submit Your Homework"}
              </h4>
              {sub && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-dark-text)] underline font-medium"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            {overdue && (
              <div className="p-3 border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>Note: The due date has passed. Submitting now will mark your work as LATE.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1 dark:text-[var(--color-dark-text)]">Submission Text (Optional)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-input text-sm"
                rows={3}
                placeholder="Write any additional details or notes here..."
              />
            </div>

            {/* File upload */}
            <div className="card p-3 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
              <label className="block text-xs font-medium mb-2 dark:text-[var(--color-dark-text)]">Attachment (Required)</label>
              {fileUrl ? (
                <div className="flex items-center justify-between bg-white dark:bg-[var(--color-dark-surface-2)] p-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-xs font-medium truncate dark:text-[var(--color-dark-text)]">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2 flex-shrink-0"
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
                      required
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
                          <span className="text-xs font-semibold dark:text-[var(--color-dark-text)]">Click to upload your homework file</span>
                          <span className="text-[10px] text-[var(--color-text-muted)]">Supports PDF, PPT, PPTX, DOC, DOCX up to 10MB</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="btn-primary w-full justify-center text-sm font-semibold"
            >
              {submitting ? "Submitting..." : sub ? "Save Changes" : "Submit Assignment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
