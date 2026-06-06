"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { getInitials } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

function generateEmail(firstName: string, lastName: string, employeeNo: string): string {
  const clean = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  if (firstName && lastName) return `${clean(firstName)}.${clean(lastName)}@assiutschool.edu.eg`;
  if (employeeNo) return `teacher${employeeNo}@assiutschool.edu.eg`;
  return "";
}

export default function TeachersPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", page, search],
    queryFn: () => api.get("/admin/teachers", { params: { page, page_size: 10, search } }).then((r: any) => r.data),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/teachers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teachers"] }); toast.success(t("teacherDeleted")); },
    onError: () => toast.error(t("operationFailed")),
  });

  const columns = [
    { key: "teacher", label: t("teacher"), render: (r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {getInitials(r.user?.first_name ?? "?", r.user?.last_name ?? "?")}
        </div>
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.user?.first_name} {r.user?.last_name}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.user?.email}</div>
        </div>
      </div>
    )},
    { key: "employee_no", label: t("employeeNo") },
    { key: "department", label: t("department"), render: (r: any) => r.department ?? "—" },
    { key: "specialization", label: t("specialization"), render: (r: any) => r.specialization ?? "—" },
    { key: "status", label: t("status"), render: (r: any) => (
      <span className={`badge ${r.user?.is_active ? "badge-green" : "badge-red"}`}>{r.user?.is_active ? t("active") : t("inactive")}</span>
    )},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { if(confirm(t("deleteTeacher"))) del.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("teachersTitle")} subtitle={t("teachersSubtitle", { count: data?.total ?? 0 })} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addTeacher")}</button>
      }/>
      <div className="card p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t("searchTeachers")} className="form-input pl-9" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} emptyMessage={t("noTeachers")} />
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">{t("page")} {page} {t("of")} {data.total_pages}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">{t("prev")}</button>
              <button disabled={page>=data.total_pages} onClick={() => setPage(p=>p+1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">{t("next")}</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editTeacher") : t("addTeacher")}>
        <TeacherForm
          existing={selected}
          onSuccess={(newCreds) => {
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ["teachers"] });
            if (newCreds) setCreds(newCreds);
          }}
        />
      </Modal>

      {/* Credentials popup */}
      {creds && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" /> {t("teacherCreated")}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-[var(--color-text-muted)]">{t("shareCredentials")}</p>
              <CredField label={t("email")} value={creds.email} />
              <CredField label={t("password")} value={creds.password} />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${t("email")}: ${creds.email}\n${t("password")}: ${creds.password}`);
                  toast.success(t("credentialsCopied"));
                }}
                className="btn-primary w-full justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> {t("copyBoth")}
              </button>
              <button onClick={() => setCreds(null)} className="btn-secondary w-full justify-center">{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function CredField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-mono text-sm border border-zinc-100 dark:border-zinc-800 select-all break-all">
          {value}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copied`); }}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TeacherForm({ existing, onSuccess }: { existing: any; onSuccess: (creds?: { email: string; password: string }) => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name:    existing?.user?.first_name   ?? "",
    last_name:     existing?.user?.last_name    ?? "",
    email:         existing?.user?.email        ?? "",
    employee_no:   existing?.employee_no        ?? "",
    department:    existing?.department         ?? "",
    specialization:existing?.specialization     ?? "",
    qualification: existing?.qualification      ?? "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Auto-generate email when name/employee_no changes (create mode only)
  useEffect(() => {
    if (existing) return;
    const suggested = generateEmail(form.first_name, form.last_name, form.employee_no);
    if (suggested) setForm(p => ({ ...p, email: suggested }));
  }, [form.first_name, form.last_name, form.employee_no, existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/admin/teachers/${existing.id}`, form);
        toast.success(t("teacherUpdated"));
        onSuccess();
      } else {
        // Password is generated securely on the server and returned once.
        const res = await api.post("/admin/teachers", form);
        const generated = res.data?.user?.generated_password ?? res.data?.generated_password;
        onSuccess({ email: form.email, password: generated ?? "" });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("firstName")}</label>
          <input value={form.first_name} onChange={e => set("first_name", e.target.value)} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("lastName")}</label>
          <input value={form.last_name} onChange={e => set("last_name", e.target.value)} className="form-input" required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("employeeNo")}</label>
        <input value={form.employee_no} onChange={e => set("employee_no", e.target.value)} className="form-input" required />
      </div>

      {/* Email — auto-filled but editable */}
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("email")}</label>
        <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="form-input" required />
        {!existing && <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{t("emailAutoGenerated")}</p>}
      </div>

      {!existing && (
        <p className="text-[11px] text-[var(--color-text-muted)] -mt-1">{t("passwordServerGenerated")}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("department")}</label>
          <input value={form.department} onChange={e => set("department", e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("specialization")}</label>
          <input value={form.specialization} onChange={e => set("specialization", e.target.value)} className="form-input" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("qualification")}</label>
        <input value={form.qualification} onChange={e => set("qualification", e.target.value)} className="form-input" />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : existing ? t("editTeacher") : t("addTeacher")}
      </button>
    </form>
  );
}
