"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Bell, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { useUser } from "@/lib/store";

export default function TeacherAnnouncementsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const user = useUser();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.get("/announcements").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title={t("announcementsTitle")}
        subtitle={t("announcementsSubtitle")}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addAnnouncement")}
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-[var(--color-text-muted)]">{t("noAnnouncements")}</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: any, i: number) => {
            const isAuthor = user?.id === a.author_id;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card p-5 border-l-4 ${a.is_pinned ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20" : "border-l-transparent"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold dark:text-[var(--color-dark-text)]">{a.title}</h3>
                        {a.is_pinned && <span className="badge badge-blue text-xs">📌 Pinned</span>}
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">{a.content}</p>
                      <div className="text-xs text-[var(--color-text-muted)] mt-2">
                        {formatDate(a.created_at)} · by {a.author?.first_name} {a.author?.last_name}
                      </div>
                    </div>
                  </div>
                  {isAuthor && (
                    <button
                      onClick={() => { setSelected(a); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600 flex-shrink-0"
                      title={t("edit")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addAnnouncement")}>
        <AnnouncementForm
          existing={selected}
          onSuccess={() => {
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ["announcements"] });
          }}
        />
      </Modal>
    </DashboardLayout>
  );
}

function AnnouncementForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    content: existing?.content ?? "",
    is_pinned: existing?.is_pinned ?? false,
    target_roles: existing?.target_roles ?? ["teacher", "student", "parent"],
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const toggleRole = (role: string) => {
    setForm(p => {
      const roles = p.target_roles.includes(role)
        ? p.target_roles.filter((r: string) => r !== role)
        : [...p.target_roles, role];
      return { ...p, target_roles: roles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.target_roles.length === 0) {
      toast.error("Please select at least one target role.");
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/teacher/announcements/${existing.id}`, form);
        toast.success("Announcement updated successfully");
      } else {
        await api.post("/teacher/announcements", form);
        toast.success("Announcement created successfully");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const rolesList = [
    { id: "teacher", label: "Teachers" },
    { id: "student", label: "Students" },
    { id: "parent", label: "Parents" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label>
        <input value={form.title} onChange={e => set("title", e.target.value)} className="form-input" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("content")}</label>
        <textarea value={form.content} onChange={e => set("content", e.target.value)} className="form-input" rows={4} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 dark:text-[var(--color-dark-text)]">Target Audience</label>
        <div className="flex gap-4">
          {rolesList.map(r => {
            const selected = form.target_roles.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className="flex items-center gap-1.5 text-sm dark:text-[var(--color-dark-text)]"
              >
                {selected ? <CheckSquare className="w-4 h-4 text-[var(--color-primary-600)]" /> : <Square className="w-4 h-4" />}
                {r.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm dark:text-[var(--color-dark-text)] cursor-pointer">
        <input type="checkbox" checked={form.is_pinned} onChange={e => set("is_pinned", e.target.checked)} className="rounded" />
        Pin this announcement
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : t("save")}
      </button>
    </form>
  );
}
