"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function SubjectsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: teachers } = useQuery({ queryKey: ["teachers-all"], queryFn: () => api.get("/admin/teachers", { params: { page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success(t("subjectDeleted")); },
  });

  const columns = [
    { key: "name", label: t("subject"), render: (r: any) => <span className="font-semibold dark:text-[var(--color-dark-text)]">{r.name}</span> },
    { key: "code", label: t("code"), render: (r: any) => <span className="badge badge-purple">{r.code}</span> },
    { key: "grade", label: t("class"), render: (r: any) => r.grade ? `${r.grade.name}${r.grade.section || ""}` : "—" },
    { key: "teacher", label: t("teacher"), render: (r: any) => r.teacher ? `${r.teacher.user?.first_name} ${r.teacher.user?.last_name}` : <span className="text-[var(--color-text-muted)]">{t("unassigned")}</span> },
    { key: "credits", label: t("creditHours") },
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { if(confirm(t("deleteConfirm"))) del.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("subjectsTitle")} subtitle={t("subjectsSubtitle", { count: subjects?.length ?? 0 })} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addSubject")}</button>
      }/>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={subjects || []} loading={isLoading} emptyMessage={t("noSubjects")} />
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editSubject") : t("addSubject")}>
        <SubjectForm existing={selected} grades={grades} teachers={teachers ?? []} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["subjects"] }); }} />
      </Modal>
    </DashboardLayout>
  );
}

function SubjectForm({ existing, grades, teachers, onSuccess }: any) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: existing?.name ?? "", code: existing?.code ?? "", grade_id: existing?.grade_id ?? "", teacher_id: existing?.teacher_id ?? "", credits: existing?.credits ?? 1, description: existing?.description ?? "" });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/subjects/${existing.id}`, form) : await api.post("/admin/subjects", form);
      toast.success(existing ? t("subjectUpdated") : t("subjectCreated")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("name")}</label><input value={form.name} onChange={e=>set("name",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("code")}</label><input value={form.code} onChange={e=>set("code",e.target.value)} placeholder="MATH10" className="form-input" required /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("class")}</label>
        <select value={form.grade_id} onChange={e=>set("grade_id",e.target.value)} className="form-input">
          <option value="">{t("select")}</option>
          {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}{g.section || ""}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("teacher")}</label>
        <select value={form.teacher_id} onChange={e=>set("teacher_id",e.target.value)} className="form-input">
          <option value="">{t("unassigned")}</option>
          {teachers.map((tc: any) => <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("creditHours")}</label><input type="number" min={1} value={form.credits} onChange={e=>set("credits",parseInt(e.target.value))} className="form-input" /></div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} className="form-input" rows={2}/></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : existing ? t("editSubject") : t("addSubject")}</button>
    </form>
  );
}
