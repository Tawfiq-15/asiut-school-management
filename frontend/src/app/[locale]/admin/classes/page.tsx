"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, School, Users, BookOpen, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, Modal, DataTable, StatCard } from "@/components/ui";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ClassesPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState<any>(null);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-all"],
    queryFn: () => api.get("/admin/teachers", { params: { page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/grades/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grades"] }); toast.success(t("classDeleted")); setDeleteTarget(null); },
    onError: () => toast.error(t("operationFailed")),
  });

  const classLabel = (g: any) => `${g.name}${g.section ? `-${g.section}` : ""}`;

  const totalStudents = (grades as any[]).reduce((s, g) => s + (g.student_count ?? 0), 0);
  const totalCapacity = (grades as any[]).reduce((s, g) => s + (g.capacity ?? 0), 0);

  const filtered = search
    ? (grades as any[]).filter((g: any) => classLabel(g).toLowerCase().includes(search.toLowerCase()) || g.room?.toLowerCase().includes(search.toLowerCase()))
    : grades;

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("classesTitle")}
        subtitle={t("classesSubtitle", { count: grades?.length ?? 0 })}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addClass")}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard title="Total Classes"   value={(grades as any[]).length} icon={School} color="blue"   />
        <StatCard title="Total Students"  value={totalStudents}            icon={Users}  color="green"  />
        <StatCard title="Total Capacity"  value={totalCapacity}            icon={School} color="purple" />
      </div>

      {/* Search */}
      <div className="card p-4 mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchClasses")} className="form-input pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-md" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(filtered as any[] || []).map((g: any, i: number) => {
            const classSubjects = (subjects || []).filter((s: any) => s.grade_id === g.id);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { setSelectedClassDetails(g); setShowDetailsModal(true); }}
                className="card p-5 hover:shadow-lg transition-all flex flex-col justify-between h-52 cursor-pointer border border-transparent hover:border-[var(--color-primary-200)] dark:hover:border-[var(--color-primary-800)]/40 group hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
                      <School className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedClassForSubjects(g); setShowSubjectsModal(true); }}
                        title={t("currentSubjects")}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-green-600"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(g); setShowModal(true); }}
                        title={t("editClass")}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(g); }}
                        title={t("delete")}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="font-bold text-lg dark:text-[var(--color-dark-text)]">{classLabel(g)}</div>
                  {g.room && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{t("room")} {g.room}</div>}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mt-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{g.student_count ?? 0} / {g.capacity} {t("studentsCount")}</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium text-purple-600">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{classSubjects.length} {t("subjectsTitle")}</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--color-surface-3)] dark:bg-[var(--color-dark-surface-3)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-primary-600)] transition-all" style={{ width: `${Math.min(100, ((g.student_count ?? 0) / g.capacity) * 100)}%` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editClass") : t("addClass")}>
        <ClassForm
          existing={selected}
          teachers={teachers}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["grades"] }); }}
        />
      </Modal>

      <Modal
        open={showSubjectsModal}
        onClose={() => setShowSubjectsModal(false)}
        title={selectedClassForSubjects ? `${t("currentSubjects")} — ${classLabel(selectedClassForSubjects)}` : ""}
      >
        {selectedClassForSubjects && (
          <ClassSubjectsManager
            gradeId={selectedClassForSubjects.id}
            subjects={subjects}
            teachers={teachers}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["subjects"] })}
          />
        )}
      </Modal>

      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={selectedClassDetails ? `${t("enrolledRoster")} — ${classLabel(selectedClassDetails)}` : ""}
        maxWidth="max-w-4xl"
      >
        {selectedClassDetails && (
          <ClassDetailsRoster grade={selectedClassDetails} teachers={teachers} />
        )}
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Delete class <span className="font-semibold dark:text-[var(--color-dark-text)]">{classLabel(deleteTarget)}</span>? This will also remove all associated subjects.
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

function ClassForm({ existing, teachers, onSuccess }: { existing: any; teachers: any[]; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    section: existing?.section ?? "",
    capacity: existing?.capacity ?? 30,
    room: existing?.room ?? "",
    class_teacher_id: existing?.class_teacher_id ?? "",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, class_teacher_id: form.class_teacher_id || null };
      existing ? await api.put(`/admin/grades/${existing.id}`, payload) : await api.post("/admin/grades", payload);
      toast.success(existing ? t("classUpdated") : t("classCreated")); onSuccess();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("className")}</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="10" className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("section")}</label>
          <input value={form.section} onChange={e => set("section", e.target.value)} placeholder="A" className="form-input" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("capacity")}</label>
          <input type="number" min={1} value={form.capacity} onChange={e => set("capacity", parseInt(e.target.value))} className="form-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("room")}</label>
          <input value={form.room} onChange={e => set("room", e.target.value)} placeholder="101" className="form-input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("classTeacher")}</label>
        <select value={form.class_teacher_id} onChange={e => set("class_teacher_id", e.target.value)} className="form-input">
          <option value="">{t("unassigned")}</option>
          {(teachers || []).map((tc: any) => (
            <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : existing ? t("editClass") : t("addClass")}
      </button>
    </form>
  );
}

interface ClassSubjectsManagerProps {
  gradeId: string;
  subjects: any[];
  teachers: any[];
  onSuccess: () => void;
}

function ClassSubjectsManager({ gradeId, subjects, teachers, onSuccess }: ClassSubjectsManagerProps) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", code: "", teacher_id: "", credits: 1 });

  const classSubjects = subjects.filter((s: any) => s.grade_id === gradeId);

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/subjects", { ...newSub, grade_id: gradeId, credits: Number(newSub.credits) || 1 });
      toast.success(t("subjectCreated"));
      setNewSub({ name: "", code: "", teacher_id: "", credits: 1 });
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const assignTeacher = async (subject: any, teacherId: string) => {
    try {
      await api.put(`/admin/subjects/${subject.id}`, {
        name: subject.name, code: subject.code, grade_id: gradeId,
        teacher_id: teacherId || null, credits: subject.credits || 1, description: subject.description || "",
      });
      toast.success(t("subjectUpdated"));
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await api.delete(`/admin/subjects/${id}`);
      toast.success(t("subjectDeleted"));
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-muted)] uppercase tracking-wide">{t("currentSubjects")}</h4>
        {classSubjects.length === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)] p-4 text-center border-2 border-dashed border-[var(--color-surface-3)] dark:border-[var(--color-dark-surface-3)] rounded-md">
            {t("noSubjectsAssigned")}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {classSubjects.map((sub: any) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] rounded-md border border-[var(--color-surface-3)] dark:border-[var(--color-dark-surface-3)]">
                <div>
                  <div className="font-semibold text-sm dark:text-[var(--color-dark-text)]">{sub.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">{sub.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sub.teacher_id || ""}
                    onChange={(e) => assignTeacher(sub, e.target.value)}
                    className="form-input text-xs py-1.5 px-2 bg-white dark:bg-zinc-950 w-44"
                  >
                    <option value="">{t("unassigned")}</option>
                    {teachers.map((tc: any) => (
                      <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteSubject(sub.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-[var(--color-surface-3)] dark:border-[var(--color-dark-surface-3)]" />

      <div>
        <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-muted)] uppercase tracking-wide">{t("addNewSubject")}</h4>
        <form onSubmit={addSubject} className="space-y-3 p-4 bg-[var(--color-surface-2)] dark:bg-zinc-900/50 rounded-xl border border-[var(--color-border)] dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-[var(--color-text-muted)]">{t("subjectName")}</label>
              <input
                value={newSub.name}
                onChange={(e) => setNewSub(p => ({ ...p, name: e.target.value }))}
                placeholder="Physics"
                className="form-input text-sm py-1.5"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[var(--color-text-muted)]">{t("subjectCode")}</label>
              <input
                value={newSub.code}
                onChange={(e) => setNewSub(p => ({ ...p, code: e.target.value }))}
                placeholder="PHYS101"
                className="form-input text-sm py-1.5 font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-[var(--color-text-muted)]">{t("assignTeacher")}</label>
              <select
                value={newSub.teacher_id}
                onChange={(e) => setNewSub(p => ({ ...p, teacher_id: e.target.value }))}
                className="form-input text-sm py-1.5"
              >
                <option value="">{t("unassigned")}</option>
                {teachers.map((tc: any) => (
                  <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[var(--color-text-muted)]">{t("creditHours")}</label>
              <input
                type="number"
                min={1}
                value={newSub.credits}
                onChange={(e) => setNewSub(p => ({ ...p, credits: Number(e.target.value) || 1 }))}
                className="form-input text-sm py-1.5"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm py-2 mt-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t("addSubject")}
          </button>
        </form>
      </div>
    </div>
  );
}

function ClassDetailsRoster({ grade, teachers }: { grade: any; teachers: any[] }) {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", code: "", teacher_id: "", credits: 1 });
  const [savingSub, setSavingSub] = useState(false);

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["grade-students-admin", grade.id],
    queryFn: () => api.get("/admin/students", { params: { grade_id: grade.id, page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!grade.id,
  });

  // Use the same ["subjects"] key as the page so any invalidation (from BookOpen modal or inline add) refreshes this too
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get("/admin/subjects").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });
  const classSubjects = allSubjects.filter((s: any) => s.grade_id === grade.id);

  const classTeacher = teachers.find((tc: any) => tc.id === grade.class_teacher_id);

  const subjectList = classSubjects.map((sub: any) => {
    const teacher = teachers.find((tc: any) => tc.id === sub.teacher_id);
    return {
      ...sub,
      teacherName: teacher ? `${teacher.user?.first_name} ${teacher.user?.last_name}` : t("unassigned"),
    };
  });

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSub(true);
    try {
      await api.post("/admin/subjects", { ...newSub, grade_id: grade.id, credits: Number(newSub.credits) || 1 });
      toast.success(t("subjectCreated"));
      setNewSub({ name: "", code: "", teacher_id: "", credits: 1 });
      setAddingSubject(false);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["grades"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? t("operationFailed"));
    } finally { setSavingSub(false); }
  };

  const assignTeacher = async (sub: any, teacherId: string) => {
    try {
      await api.put(`/admin/subjects/${sub.id}`, { name: sub.name, code: sub.code, grade_id: grade.id, teacher_id: teacherId || null, credits: sub.credits || 1, description: sub.description || "" });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success(t("subjectUpdated"));
    } catch { toast.error(t("operationFailed")); }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await api.delete(`/admin/subjects/${id}`);
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["grades"] });
      toast.success(t("subjectDeleted"));
    } catch { toast.error(t("operationFailed")); }
  };

  const studentColumns = [
    {
      key: "name",
      label: t("name"),
      render: (r: any) => (
        <div className="flex items-center gap-2 py-1">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center text-white text-xs font-bold">
            {r.user?.first_name?.[0]}{r.user?.last_name?.[0]}
          </div>
          <div>
            <div className="font-semibold text-sm dark:text-[var(--color-dark-text)]">{r.user?.first_name} {r.user?.last_name}</div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono">{r.admission_no}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: t("email"),
      render: (r: any) => <span className="text-sm dark:text-[var(--color-dark-text)] font-mono">{r.user?.email || "—"}</span>,
    },
    {
      key: "gender",
      label: t("gender"),
      render: (r: any) => (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] dark:text-[var(--color-dark-text)]">
          {r.gender || "—"}
        </span>
      ),
    },
    {
      key: "guardian",
      label: t("guardian"),
      render: (r: any) => <span className="text-sm dark:text-[var(--color-dark-text)]">{r.guardian_name || "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{t("classOverview")}</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("room")}</span>
              <span className="font-semibold dark:text-[var(--color-dark-text)]">{grade.room || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("capacityLabel")}</span>
              <span className="font-semibold dark:text-[var(--color-dark-text)]">{grade.capacity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("enrolledCount")}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{students.length}</span>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{t("classAdvisor")}</div>
          {classTeacher ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-[var(--color-primary-700)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {classTeacher.user?.first_name?.[0]}{classTeacher.user?.last_name?.[0]}
              </div>
              <div>
                <div className="font-semibold text-sm dark:text-[var(--color-dark-text)]">{classTeacher.user?.first_name} {classTeacher.user?.last_name}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{classTeacher.department || t("classAdvisor")}</div>
                <div className="text-xs text-[var(--color-text-muted)] font-mono">{classTeacher.employee_no}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] italic mt-2">{t("noAdvisorAssigned")}</p>
          )}
        </div>

        <div className="card p-5 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
          <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{t("academicStaff")}</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("totalSubjects")}</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{classSubjects.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("assignedInstructors")}</span>
              <span className="font-semibold dark:text-[var(--color-dark-text)]">
                {classSubjects.filter((s: any) => s.teacher_id).length} / {classSubjects.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-[var(--color-text-muted)] uppercase tracking-wide">{t("classSubjectsList")}</h4>
            <button onClick={() => setAddingSubject(v => !v)} className="btn-primary text-xs py-1 px-2 gap-1">
              <Plus className="w-3 h-3" /> {t("addSubject")}
            </button>
          </div>

          {addingSubject && (
            <form onSubmit={addSubject} className="p-3 bg-[var(--color-surface-2)] dark:bg-zinc-900/50 rounded-xl border border-[var(--color-border)] dark:border-zinc-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input value={newSub.name} onChange={e => setNewSub(p => ({ ...p, name: e.target.value }))} placeholder={t("subjectName")} className="form-input text-xs py-1.5" required />
                <input value={newSub.code} onChange={e => setNewSub(p => ({ ...p, code: e.target.value }))} placeholder={t("subjectCode")} className="form-input text-xs py-1.5 font-mono" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={newSub.teacher_id} onChange={e => setNewSub(p => ({ ...p, teacher_id: e.target.value }))} className="form-input text-xs py-1.5">
                  <option value="">{t("unassigned")}</option>
                  {teachers.map((tc: any) => <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>)}
                </select>
                <input type="number" min={1} value={newSub.credits} onChange={e => setNewSub(p => ({ ...p, credits: Number(e.target.value) || 1 }))} placeholder={t("creditHours")} className="form-input text-xs py-1.5" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingSub} className="btn-primary text-xs py-1.5 flex-1 justify-center">
                  {savingSub ? <Loader2 className="w-3 h-3 animate-spin" /> : t("save")}
                </button>
                <button type="button" onClick={() => setAddingSubject(false)} className="btn-secondary text-xs py-1.5">{t("cancel") ?? "Cancel"}</button>
              </div>
            </form>
          )}

          {subjectList.length === 0 ? (
            <div className="text-xs text-[var(--color-text-muted)] p-4 text-center border-2 border-dashed border-[var(--color-surface-3)] dark:border-[var(--color-dark-surface-3)] rounded-md">
              {t("noSubjectsAssigned")}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {subjectList.map((sub: any) => (
                <div key={sub.id} className="p-3 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] rounded-md border border-[var(--color-surface-3)] dark:border-[var(--color-dark-surface-3)]">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-sm dark:text-[var(--color-dark-text)]">{sub.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">{sub.code}</span>
                      <button onClick={() => deleteSubject(sub.id)} className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <select value={sub.teacher_id || ""} onChange={e => assignTeacher(sub, e.target.value)} className="form-input text-xs py-1 w-full">
                      <option value="">{t("unassigned")}</option>
                      {teachers.map((tc: any) => <option key={tc.id} value={tc.id}>{tc.user?.first_name} {tc.user?.last_name}</option>)}
                    </select>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">{sub.credits} {t("creditHours")}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 lg:col-span-2">
          <h4 className="font-semibold text-sm text-[var(--color-text-muted)] uppercase tracking-wide">
            {t("enrolledRoster")} ({students.length})
          </h4>
          <div className="max-h-96 overflow-y-auto pr-1 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-md">
            <DataTable
              columns={studentColumns}
              data={students}
              loading={studentsLoading}
              emptyMessage={t("noStudentsEnrolled")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
