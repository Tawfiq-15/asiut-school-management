"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, GraduationCap, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, StatCard, DataTable, Modal } from "@/components/ui";
import { formatDate, getInitials } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

function useStudents(page: number, search: string, gradeId: string) {
  return useQuery({
    queryKey: ["students", page, search, gradeId],
    queryFn: async () => {
      const { data } = await api.get("/admin/students", {
        params: { page, page_size: 10, search, ...(gradeId ? { grade_id: gradeId } : {}) },
      });
      return data;
    },
  });
}

export default function StudentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = useStudents(page, debouncedSearch, gradeFilter);
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  // Stat counts — fetch all for summary (small payload, no pagination)
  const { data: allData } = useQuery({
    queryKey: ["students-summary"],
    queryFn: () => api.get("/admin/students", { params: { page_size: 500 } }).then((r: any) => r.data),
  });
  const allStudents: any[] = allData?.data ?? [];
  const activeCount   = allStudents.filter((s) => s.user?.is_active).length;
  const inactiveCount = allStudents.filter((s) => !s.user?.is_active).length;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["students-summary"] });
      toast.success(t("studentDeleted"));
      setDeleteTarget(null);
    },
    onError: () => toast.error(t("operationFailed")),
  });

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => { setPage(1); }, [gradeFilter]);

  const columns = [
    {
      key: "student",
      label: t("student"),
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary-800)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {getInitials(row.user?.first_name ?? "?", row.user?.last_name ?? "?")}
          </div>
          <div>
            <div className="font-medium dark:text-[var(--color-dark-text)]">
              {row.user?.first_name} {row.user?.last_name}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">{row.user?.email}</div>
          </div>
        </div>
      ),
    },
    { key: "admission_no", label: t("admissionNo") },
    {
      key: "grade",
      label: t("class"),
      render: (row: any) =>
        row.grade ? (
          <span className="badge badge-blue">
            {row.grade.name}{row.grade.section ? `-${row.grade.section}` : ""}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)] text-xs">{t("unassigned")}</span>
        ),
    },
    {
      key: "status",
      label: t("status"),
      render: (row: any) => (
        <span className={`badge ${row.user?.is_active ? "badge-green" : "badge-red"}`}>
          {row.user?.is_active ? t("active") : t("inactive")}
        </span>
      ),
    },
    {
      key: "admission_date",
      label: t("enrolled"),
      render: (row: any) => row.admission_date ? formatDate(row.admission_date) : "—",
    },
    {
      key: "actions",
      label: "",
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelected(row); setShowModal(true); }}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)] text-[var(--color-text-muted)] hover:text-blue-600 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("studentsTitle")}
        subtitle={t("studentsSubtitle", { count: data?.total ?? 0 })}
        actions={
          <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addStudent")}
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Students" value={allData?.total ?? 0}  icon={GraduationCap} color="blue"  />
        <StatCard title="Active"         value={activeCount}           icon={UserCheck}     color="green" />
        <StatCard title="Inactive"       value={inactiveCount}         icon={UserX}         color="red"   />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchStudents")}
            className="form-input pl-9 w-full"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="form-input max-w-xs"
        >
          <option value="">{t("allClasses")}</option>
          {(grades as any[]).map((g: any) => (
            <option key={g.id} value={g.id}>{g.name}{g.section ? `-${g.section}` : ""}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
          emptyMessage={t("noStudents")}
        />
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("page")} {page} {t("of")} {data.total_pages} · {data.total} {t("results")}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">{t("prev")}</button>
              <button disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">{t("next")}</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("editStudent") : t("addStudent")}>
        <StudentForm
          existing={selected}
          onSuccess={() => {
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ["students"] });
            qc.invalidateQueries({ queryKey: ["students-summary"] });
          }}
        />
      </Modal>

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteStudent")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              {t("deleteConfirm")} <span className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{deleteTarget.user?.first_name} {deleteTarget.user?.last_name}</span>?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{t("cancel")}</button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function StudentForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () => api.get("/admin/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const [form, setForm] = useState({
    first_name:    existing?.user?.first_name  ?? "",
    last_name:     existing?.user?.last_name   ?? "",
    email:         existing?.user?.email       ?? "",
    password:      "",
    admission_no:  existing?.admission_no      ?? "",
    grade_id:      existing?.grade_id          ?? "",
    gender:        existing?.gender            ?? "",
    address:       existing?.address           ?? "",
    guardian_name: existing?.guardian_name     ?? "",
  });

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (existing) {
        await api.put(`/admin/students/${existing.id}`, form);
        toast.success(t("studentUpdated"));
      } else {
        await api.post("/admin/students", form);
        toast.success(t("studentCreated"));
      }
      onSuccess();
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
          <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("lastName")}</label>
          <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className="form-input" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("email")}</label>
        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="form-input" required />
      </div>
      {!existing && (
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("password")}</label>
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="form-input" required minLength={8} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("admissionNo")}</label>
          <input value={form.admission_no} onChange={(e) => set("admission_no", e.target.value)} className="form-input" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("class")}</label>
          <select value={form.grade_id} onChange={(e) => set("grade_id", e.target.value)} className="form-input">
            <option value="">{t("unassigned")}</option>
            {(grades as any[]).map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}{g.section ? `-${g.section}` : ""}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("gender")}</label>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="form-input">
            <option value="">{t("select")}</option>
            <option value="Male">{t("male")}</option>
            <option value="Female">{t("female")}</option>
            <option value="Other">{t("other")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("guardian")}</label>
          <input value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} className="form-input" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("address")}</label>
        <textarea value={form.address} onChange={(e) => set("address", e.target.value)} className="form-input" rows={2} />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : existing ? t("editStudent") : t("addStudent")}
      </button>
    </form>
  );
}
