"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { getInitials } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [childrenParent, setChildrenParent] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["parents", page, search],
    queryFn: () => api.get("/admin/parents", { params: { page, page_size: 10, search } }).then((r: any) => r.data),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/parents/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parents"] }); toast.success(t("parentDeleted")); },
    onError: () => toast.error(t("operationFailed")),
  });

  const columns = [
    { key: "name", label: t("name"), render: (r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 text-sm font-bold">{getInitials(r.user?.first_name ?? "?", r.user?.last_name ?? "?")}</div>
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.user?.first_name} {r.user?.last_name}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.user?.email}</div>
        </div>
      </div>
    )},
    { key: "occupation", label: t("occupation"), render: (r: any) => r.occupation ?? "—" },
    { key: "children", label: t("children"), render: (r: any) => <span className="badge badge-blue">{r.students?.length ?? 0}</span> },
    { key: "status", label: t("status"), render: (r: any) => <span className={`badge ${r.user?.is_active ? "badge-green" : "badge-red"}`}>{r.user?.is_active ? t("active") : t("inactive")}</span> },
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => setChildrenParent(r)} title={t("linkedChildren")} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-purple-600"><Users className="w-4 h-4" /></button>
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { if(confirm(t("deleteConfirm"))) del.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("parentsTitle")} subtitle={t("parentsSubtitle", { count: data?.total ?? 0 })} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addParent")}</button>
      }/>
      <div className="card p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="form-input pl-9" />
        </div>
      </div>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} emptyMessage={t("noParents")} />
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editParent") : t("addParent")}>
        <ParentForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["parents"] }); }} />
      </Modal>

      <Modal open={!!childrenParent} onClose={() => setChildrenParent(null)} title={`${t("linkedChildren")} — ${childrenParent?.user?.first_name ?? ""} ${childrenParent?.user?.last_name ?? ""}`}>
        {childrenParent && <ChildrenView parentId={childrenParent.id} />}
      </Modal>
    </DashboardLayout>
  );
}

function ChildrenView({ parentId }: { parentId: string }) {
  const t = useTranslations("P");

  const { data: parent, isLoading } = useQuery({
    queryKey: ["parent-detail", parentId],
    queryFn: () => api.get(`/admin/parents/${parentId}`).then((r: any) => r.data?.data ?? r.data ?? null),
  });

  const children: any[] = parent?.students ?? parent?.children ?? [];

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">{t("saving")}</div>;
  }

  if (children.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">{t("noChildren")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {children.map((child: any) => (
        <div key={child.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {child.user?.first_name?.[0]}{child.user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium dark:text-[var(--color-dark-text)]">{child.user?.first_name} {child.user?.last_name}</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {child.admission_no && <span className="font-mono mr-2">{child.admission_no}</span>}
              {child.grade?.name && <span>Grade {child.grade.name}{child.grade.section || ""}</span>}
            </div>
          </div>
          <span className={`badge ${child.user?.is_active ? "badge-green" : "badge-red"} flex-shrink-0`}>
            {child.user?.is_active ? t("active") : t("inactive")}
          </span>
        </div>
      ))}
    </div>
  );
}

function ParentForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ first_name: existing?.user?.first_name ?? "", last_name: existing?.user?.last_name ?? "", email: existing?.user?.email ?? "", password: "", occupation: existing?.occupation ?? "", address: existing?.address ?? "" });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/parents/${existing.id}`, form) : await api.post("/admin/parents", form);
      toast.success(t("parentSaved")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("firstName")}</label><input value={form.first_name} onChange={e=>set("first_name",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("lastName")}</label><input value={form.last_name} onChange={e=>set("last_name",e.target.value)} className="form-input" required /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("email")}</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} className="form-input" required /></div>
      {!existing && <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("password")}</label><input type="password" value={form.password} onChange={e=>set("password",e.target.value)} className="form-input" required minLength={8}/></div>}
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("occupation")}</label><input value={form.occupation} onChange={e=>set("occupation",e.target.value)} className="form-input" /></div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("address")}</label><textarea value={form.address} onChange={e=>set("address",e.target.value)} className="form-input" rows={2}/></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : existing ? t("editParent") : t("addParent")}</button>
    </form>
  );
}
