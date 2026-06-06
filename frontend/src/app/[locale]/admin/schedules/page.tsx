"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, Modal } from "@/components/ui";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_COLORS = [
  "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-800/30 dark:text-red-300",
  "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/20 dark:border-orange-800/30 dark:text-orange-300",
  "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950/20 dark:border-yellow-800/30 dark:text-yellow-300",
  "bg-green-50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-800/30 dark:text-green-300",
  "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-800/30 dark:text-blue-300",
  "bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950/20 dark:border-purple-800/30 dark:text-purple-300",
  "bg-pink-50 border-pink-200 text-pink-900 dark:bg-pink-950/20 dark:border-pink-800/30 dark:text-pink-300"
];

export default function SchedulesPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data: grades = [] } = useQuery({ queryKey: ["grades"], queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", selectedGrade],
    queryFn: () => api.get("/admin/schedules", { params: { grade_id: selectedGrade } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/schedules/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success(t("scheduleDeleted")); },
  });

  const byDay: Record<number, any[]> = {};
  (schedules as any[]).forEach(s => { (byDay[s.day_of_week] ??= []).push(s); });

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("schedulesTitle")} subtitle={t("schedulesSubtitle")} actions={
        <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addSchedule")}</button>
      }/>
      <div className="mb-4">
        <select value={selectedGrade} onChange={e=>setSelectedGrade(e.target.value)} className="form-input max-w-xs">
          <option value="">{t("allClasses")}</option>
          {grades.map((g: any) => <option key={g.id} value={g.id}>Grade {g.name}{g.section||""}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[0,1,2,3,4].map(day => (
            <div key={day} className="space-y-2">
              <div className="text-sm font-bold text-center dark:text-[var(--color-dark-text)] mb-2">{DAYS[day]}</div>
              {(byDay[day] ?? []).sort((a,b)=>a.start_time.localeCompare(b.start_time)).map((s: any, i: number) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.03 }}
                  className={`p-3 rounded-xl border ${DAY_COLORS[day]} relative group`}>
                  <div className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3" />{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                  </div>
                  <div className="text-sm font-bold dark:text-[var(--color-dark-text)]">{s.subject?.name}</div>
                  {s.teacher && <div className="text-xs text-[var(--color-text-muted)]">{s.teacher?.user?.first_name} {s.teacher?.user?.last_name}</div>}
                  {s.room && <div className="text-xs text-[var(--color-text-muted)]">Room {s.room}</div>}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button onClick={() => { setSelected(s); setShowModal(true); }} className="p-1 rounded bg-white/80 dark:bg-[var(--color-surface-2)] text-blue-600 dark:text-blue-400"><Pencil className="w-3 h-3"/></button>
                    <button onClick={() => { if(confirm(t("deleteConfirm"))) del.mutate(s.id); }} className="p-1 rounded bg-white/80 dark:bg-[var(--color-surface-2)] text-red-500 dark:text-red-400"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </motion.div>
              ))}
              {!(byDay[day]?.length) && <div className="text-xs text-center text-[var(--color-text-muted)] py-4">{t("noSchedules")}</div>}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addSchedule")}>
        <ScheduleForm existing={selected} grades={grades} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["schedules"] }); }} />
      </Modal>
    </DashboardLayout>
  );
}

function ScheduleForm({ existing, grades, onSuccess }: any) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ grade_id: existing?.grade_id ?? "", subject_id: existing?.subject_id ?? "", teacher_id: existing?.teacher_id ?? "", day_of_week: existing?.day_of_week ?? 0, start_time: existing?.start_time?.slice(0,5) ?? "08:00", end_time: existing?.end_time?.slice(0,5) ?? "09:00", room: existing?.room ?? "" });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects-for-grade", form.grade_id], queryFn: () => api.get("/admin/subjects", { params: { grade_id: form.grade_id } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []), enabled: !!form.grade_id });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers-all"], queryFn: () => api.get("/admin/teachers", { params: { page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/schedules/${existing.id}`, form) : await api.post("/admin/schedules", form);
      toast.success(t("scheduleSaved")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("selectClass")}</label>
        <select value={form.grade_id} onChange={e=>set("grade_id",e.target.value)} className="form-input" required>
          <option value="">{t("select")}</option>
          {grades.map((g: any) => <option key={g.id} value={g.id}>Grade {g.name}{g.section||""}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("subject")}</label>
        <select value={form.subject_id} onChange={e=>set("subject_id",e.target.value)} className="form-input" required>
          <option value="">{t("select")}</option>
          {(subjects as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("teacher")}</label>
        <select value={form.teacher_id} onChange={e=>set("teacher_id",e.target.value)} className="form-input">
          <option value="">{t("select")}</option>
          {(teachers as any[]).map((tc: any) => <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>)}
        </select>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("day")}</label>
        <select value={form.day_of_week} onChange={e=>set("day_of_week",parseInt(e.target.value))} className="form-input">
          {[0,1,2,3,4].map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("startTime")}</label><input type="time" value={form.start_time} onChange={e=>set("start_time",e.target.value)} className="form-input" required /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("endTime")}</label><input type="time" value={form.end_time} onChange={e=>set("end_time",e.target.value)} className="form-input" required /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("room")}</label><input value={form.room} onChange={e=>set("room",e.target.value)} className="form-input" /></div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : t("save")}</button>
    </form>
  );
}
