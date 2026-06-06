"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function AdminEventsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => api.get("/events").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/events/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success(t("delete")); },
    onError: () => toast.error(t("operationFailed")),
  });

  const columns = [
    { key: "title", label: t("title"), render: (r: any) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
          {r.location && (
            <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
              <MapPin className="w-3 h-3" />{r.location}
            </div>
          )}
        </div>
      </div>
    )},
    { key: "event_date", label: t("date"), render: (r: any) => formatDate(r.event_date) },
    { key: "end_date", label: t("endDate") ?? "End Date", render: (r: any) => r.end_date ? formatDate(r.end_date) : "—" },
    { key: "is_public", label: t("status"), render: (r: any) => (
      <span className={`badge ${r.is_public ? "badge-green" : "badge-yellow"}`}>
        {r.is_public ? (t("public") ?? "Public") : (t("private") ?? "Private")}
      </span>
    )},
    { key: "actions", label: "", render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => { if (confirm(t("deleteConfirm"))) del.mutate(r.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("eventsTitle") ?? "Events"}
        subtitle={t("eventsSubtitle") ?? `${events.length} events`}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addEvent") ?? "Add Event"}
          </button>
        }
      />
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={events} loading={isLoading} emptyMessage={t("noEvents") ?? "No events yet."} />
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? (t("editEvent") ?? "Edit Event") : (t("addEvent") ?? "Add Event")}>
        <EventForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["admin-events"] }); }} />
      </Modal>
    </DashboardLayout>
  );
}

function EventForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    description: existing?.description ?? "",
    event_date: existing?.event_date?.slice(0, 16) ?? "",
    end_date: existing?.end_date?.slice(0, 16) ?? "",
    location: existing?.location ?? "",
    is_public: existing?.is_public ?? true,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        event_date: new Date(form.event_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        description: form.description || null,
        location: form.location || null,
      };
      existing
        ? await api.put(`/admin/events/${existing.id}`, payload)
        : await api.post("/admin/events", payload);
      toast.success(existing ? (t("eventUpdated") ?? "Event updated") : (t("eventCreated") ?? "Event created"));
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
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("title")}</label>
        <input value={form.title} onChange={e => set("title", e.target.value)} className="form-input" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} className="form-input" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label>
          <input type="datetime-local" value={form.event_date} onChange={e => set("event_date", e.target.value)} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("endDate") ?? "End Date"}</label>
          <input type="datetime-local" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="form-input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("location") ?? "Location"}</label>
        <input value={form.location} onChange={e => set("location", e.target.value)} className="form-input" placeholder="e.g. Main Hall" />
      </div>
      <label className="flex items-center gap-2 text-sm dark:text-[var(--color-dark-text)] cursor-pointer">
        <input type="checkbox" checked={form.is_public} onChange={e => set("is_public", e.target.checked)} className="rounded" />
        {t("public") ?? "Public"} (visible on school website)
      </label>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : existing ? (t("editEvent") ?? "Save Changes") : (t("addEvent") ?? "Add Event")}
      </button>
    </form>
  );
}
