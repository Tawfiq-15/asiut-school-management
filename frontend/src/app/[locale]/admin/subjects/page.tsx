"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function SubjectsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });
  const { data: teachers } = useQuery({
    queryKey: ["teachers-all"],
    queryFn: () => api.get("/admin/teachers", { params: { page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success(t("subjectDeleted")); setDeleteTarget(null); },
  });

  const filtered = (subjects as any[]).filter((s: any) => {
    if (gradeFilter && s.grade_id !== gradeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by grade for a quick count badge
  const assignedCount = (subjects as any[]).filter((s: any) => s.teacher_id).length;
  const unassignedCount = (subjects as any[]).filter((s: any) => !s.teacher_id).length;

  const columns = [
    { key: "name", label: t("subject"), render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="font-semibold dark:text-[var(--color-dark-text)]">{r.name}</span>
      </div>
    )},
    { key: "code", label: t("code"), render: (r: any) => <span className="badge badge-purple font-mono">{r.code}</span> },
    { key: "grade", label: t("class"), render: (r: any) => r.grade ? `${r.grade.name}${r.grade.section || ""}` : "—" },
    { key: "teacher", label: t("teacher"), render: (r: any) =>
      r.teacher
        ? `${r.teacher.user?.first_name} ${r.teacher.user?.last_name}`
        : <span className="text-[var(--color-text-muted)] text-xs italic">{t("unassigned")}</span>,
    },
    { key: "credits", label: t("creditHours"), render: (r: any) => (
      <span className="text-sm dark:text-[var(--color-dark-text)]">{r.credits}</span>
    )},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("subjectsTitle")}
        subtitle={t("subjectsSubtitle", { count: subjects?.length ?? 0 })}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addSubject")}
          </button>
        }
      />

      {/* Quick stats bar */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="card px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="text-[var(--color-text-muted)]">Total</span>
          <span className="font-bold dark:text-[var(--color-dark-text)]">{(subjects as any[]).length}</span>
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-[var(--color-text-muted)]">Assigned</span>
          <span className="font-bold text-green-600 dark:text-green-400">{assignedCount}</span>
        </div>
        <div className="card px-4 py-2.5 flex items-center gap-2 flex-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
          <span className="text-[var(--color-text-muted)]">No teacher</span>
          <span className="font-bold text-yellow-600 dark:text-yellow-400">{unassignedCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="form-input pl-9 w-full"
          />
        </div>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="form-input max-w-xs">
          <option value="">{t("allClasses")}</option>
          {(grades as any[]).map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.section || ""}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filtered} loading={isLoading} emptyMessage={t("noSubjects")} />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editSubject") : t("addSubject")}>
        <SubjectForm existing={selected} grades={grades} teachers={teachers ?? []} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["subjects"] }); }} />
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Delete subject <span className="font-semibold dark:text-[var(--color-dark-text)]">{deleteTarget.name}</span> ({deleteTarget.code})?
            </p>
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

function SubjectForm({ existing, grades, teachers, onSuccess }: any) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name ?? "", code: existing?.code ?? "",
    grade_id: existing?.grade_id ?? "", teacher_id: existing?.teacher_id ?? "",
    credits: existing?.credits ?? 1, description: existing?.description ?? "",
  });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/subjects/${existing.id}`, form) : await api.post("/admin/subjects", form);
      toast.success(existing ? t("subjectUpdated") : t("subjectCreated")); onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("name")}</label><input value={form.name} onChange={(e) => set("name", e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("code")}</label><input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="MATH10" className="form-input font-mono" required /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("class")}</label>
        <select value={form.grade_id} onChange={(e) => set("grade_id", e.target.value)} className="form-input">
          <option value="">{t("select")}</option>
          {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.section || ""}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("teacher")}</label>
        <select value={form.teacher_id} onChange={(e) => set("teacher_id", e.target.value)} className="form-input">
          <option value="">{t("unassigned")}</option>
          {teachers.map((tc: any) => <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("creditHours")}</label><input type="number" min={1} value={form.credits} onChange={(e) => set("credits", parseInt(e.target.value))} className="form-input" /></div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="form-input" rows={2} /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : existing ? t("editSubject") : t("addSubject")}</button>
    </form>
  );
}
