"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Bell, Pin, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function AnnouncementsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get("/announcements").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["announcements"] }); toast.success(t("delete")); setDeleteTarget(null); },
  });

  const pinned = (announcements as any[]).filter((a: any) => a.is_pinned).length;

  const filtered = (announcements as any[]).filter((a: any) => {
    if (pinnedOnly && !a.is_pinned) return false;
    if (search) { const q = search.toLowerCase(); return a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q); }
    return true;
  });

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("announcementsTitle")} subtitle={t("announcementsSubtitle")} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addAnnouncement")}</button>
      }/>

      {/* Quick stats + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." className="form-input pl-9 w-full" />
        </div>
        <button
          onClick={() => setPinnedOnly(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${pinnedOnly ? "btn-primary" : "btn-secondary"}`}
        >
          <Pin className="w-3.5 h-3.5" /> Pinned ({pinned})
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">{t("noAnnouncements")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any, i: number) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`card p-5 border-l-4 ${a.is_pinned ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20" : "border-l-transparent"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold dark:text-[var(--color-dark-text)]">{a.title}</h3>
                      {a.is_pinned && <span className="badge badge-blue text-xs flex items-center gap-1"><Pin className="w-3 h-3" />{t("pinned")}</span>}
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">{a.content}</p>
                    <div className="text-xs text-[var(--color-text-muted)] mt-2">{formatDate(a.created_at)} · by {a.author?.first_name} {a.author?.last_name}</div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setSelected(a); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[var(--color-text-muted)] hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addAnnouncement")}>
        <AnnouncementForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["announcements"] }); }} />
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Delete announcement <span className="font-semibold dark:text-[var(--color-dark-text)]">"{deleteTarget.title}"</span>?</p>
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

function AnnouncementForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: existing?.title ?? "", content: existing?.content ?? "", is_pinned: existing?.is_pinned ?? false, target_roles: existing?.target_roles ?? ["admin","teacher","student","parent"] });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/announcements/${existing.id}`, form) : await api.post("/admin/announcements", form);
      toast.success(t("announcementSaved")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label><input value={form.title} onChange={e=>set("title",e.target.value)} className="form-input" required /></div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("content")}</label><textarea value={form.content} onChange={e=>set("content",e.target.value)} className="form-input" rows={4} required /></div>
      <label className="flex items-center gap-2 text-sm dark:text-[var(--color-dark-text)] cursor-pointer">
        <input type="checkbox" checked={form.is_pinned} onChange={e=>set("is_pinned",e.target.checked)} className="rounded" />
        {t("pinned")}
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : existing ? t("edit") : t("addAnnouncement")}</button>
    </form>
  );
}
