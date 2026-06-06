"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentLeavePage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["student-leave"],
    queryFn: () => api.get("/student/leave").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const columns = [
    { key: "reason", label: t("description"), render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.reason}</span> },
    { key: "dates", label: t("date"), render: (r: any) => `${formatDate(r.start_date)} - ${formatDate(r.end_date)}` },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };
      return <span className={`badge ${map[r.status]}`}>{t(r.status)}</span>;
    }},
    { key: "applied_at", label: t("date"), render: (r: any) => formatDate(r.created_at) },
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("studentLeaveTitle")} subtitle={t("studentLeaveSubtitle")} actions={
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> {t("requestLeave")}</button>
      }/>
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={leaves} loading={isLoading} emptyMessage={t("noLeaveRequests")} />
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={t("requestLeave")}>
        <LeaveForm onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["student-leave"] }); }} />
      </Modal>
    </DashboardLayout>
  );
}

function LeaveForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post("/student/leave", form);
      toast.success(t("save")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label><input type="date" value={form.start_date} onChange={e=>set("start_date",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("date")}</label><input type="date" value={form.end_date} onChange={e=>set("end_date",e.target.value)} className="form-input" required /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("description")}</label><textarea value={form.reason} onChange={e=>set("reason",e.target.value)} className="form-input" rows={3} required /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : t("save")}</button>
    </form>
  );
}
