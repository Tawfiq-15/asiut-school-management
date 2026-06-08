"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable, Modal, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function LibraryPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [tab, setTab] = useState<"books"|"loans">("books");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: books = [], isLoading: bLoading } = useQuery({
    queryKey: ["books", search],
    queryFn: () => api.get("/admin/library/books", { params: { search } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });
  const { data: loans = [], isLoading: lLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: () => api.get("/admin/library/loans").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: tab === "loans",
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/library/books/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); toast.success(t("delete")); setDeleteTarget(null); },
  });

  const returnBook = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/library/loans/${id}/return`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); qc.invalidateQueries({ queryKey: ["books"] }); toast.success(t("save")); },
  });

  const bookCols = [
    { key: "title", label: t("bookTitle"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.author}</div>
      </div>
    )},
    { key: "isbn",     label: t("isbn"),     render: (r: any) => r.isbn ?? "—" },
    { key: "category", label: t("type"),     render: (r: any) => r.category ? <span className="badge badge-purple">{r.category}</span> : "—" },
    { key: "available",label: t("available"),render: (r: any) => <span className={`badge ${r.available > 0 ? "badge-green" : "badge-red"}`}>{r.available}/{r.total_copies}</span> },
    { key: "actions",  label: "", render: (r: any) => (
      <div className="flex gap-1">
        <button onClick={() => { setSelected(r); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
        <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-[var(--color-text-muted)] hover:text-red-500 dark:hover:text-red-400"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ];

  const loanCols = [
    { key: "book",    label: t("bookTitle"), render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.book?.title}</span> },
    { key: "student", label: t("student"),   render: (r: any) => `${r.student?.user?.first_name} ${r.student?.user?.last_name}` },
    { key: "loaned_at",label: t("date"),     render: (r: any) => formatDate(r.loaned_at) },
    { key: "due_date", label: t("dueDate"),  render: (r: any) => formatDate(r.due_date) },
    { key: "status",   label: t("status"),   render: (r: any) => (
      <span className={`badge ${r.status === "active" ? "badge-yellow" : r.status === "returned" ? "badge-green" : "badge-red"}`}>{r.status}</span>
    )},
    { key: "actions",  label: "", render: (r: any) => (
      r.status === "active"
        ? <button onClick={() => returnBook.mutate(r.id)} className="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40">{t("returnBook")}</button>
        : null
    )},
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("libraryTitle")}
        subtitle={t("librarySubtitle")}
        actions={
          tab === "books"
            ? <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> {t("addBook")}</button>
            : <button onClick={() => setShowCheckout(true)} className="btn-primary"><Plus className="w-4 h-4" /> {t("checkoutBook")}</button>
        }
      />

      {/* Stats */}
      {(() => {
        const bookList = books as any[];
        const loanList = loans as any[];
        const totalBooks = bookList.reduce((s, b) => s + (b.total_copies ?? 0), 0);
        const available  = bookList.reduce((s, b) => s + (b.available ?? 0), 0);
        const activeLoans = loanList.filter((l: any) => l.status === "active").length;
        return (
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatCard title="Total Titles"  value={bookList.length} icon={BookOpen} color="blue"   />
            <StatCard title="Available"     value={available}       icon={BookOpen} color="green"  />
            <StatCard title="Active Loans"  value={activeLoans}     icon={BookOpen} color="orange" />
          </div>
        );
      })()}

      <div className="flex gap-3 mb-4">
        <button onClick={() => setTab("books")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "books" ? "btn-primary" : "btn-secondary"}`}>
          {t("libraryTitle")}
        </button>
        <button onClick={() => setTab("loans")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "loans" ? "btn-primary" : "btn-secondary"}`}>
          {t("loansTab")}
        </button>
      </div>

      {tab === "books" && (
        <>
          <div className="card p-4 mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="form-input pl-9"/>
            </div>
          </div>
          <div className="card overflow-hidden">
            <DataTable columns={bookCols} data={books} loading={bLoading} emptyMessage={t("noBooks")} />
          </div>
        </>
      )}

      {tab === "loans" && (
        <div className="card overflow-hidden">
          <DataTable columns={loanCols} data={loans} loading={lLoading} emptyMessage={t("noBooks")} />
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? t("edit") : t("addBook")}>
        <BookForm existing={selected} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ["books"] }); }} />
      </Modal>

      <Modal open={showCheckout} onClose={() => setShowCheckout(false)} title={t("checkoutBook")}>
        <CheckoutForm
          books={(books as any[]).filter((b: any) => b.available > 0)}
          onSuccess={() => {
            setShowCheckout(false);
            qc.invalidateQueries({ queryKey: ["loans"] });
            qc.invalidateQueries({ queryKey: ["books"] });
          }}
        />
      </Modal>

      {deleteTarget && (
        <Modal open={true} onClose={() => setDeleteTarget(null)} title={t("deleteConfirm")}>
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Delete book <span className="font-semibold dark:text-[var(--color-dark-text)]">"{deleteTarget.title}"</span>? Active loans will be affected.</p>
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

function CheckoutForm({ books, onSuccess }: { books: any[]; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ student_id: "", book_id: "", due_date: defaultDue });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const { data: students = [], isLoading: sLoading } = useQuery({
    queryKey: ["students-all-lib"],
    queryFn: () => api.get("/admin/students", { params: { page_size: 200 } }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post("/admin/library/loans", form);
      toast.success(t("loanCreated")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("student")}</label>
        <select value={form.student_id} onChange={e=>set("student_id",e.target.value)} className="form-input" required>
          <option value="">{sLoading ? "Loading..." : t("select")}</option>
          {students.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.user?.first_name} {s.user?.last_name} ({s.admission_no})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("bookTitle")}</label>
        <select value={form.book_id} onChange={e=>set("book_id",e.target.value)} className="form-input" required>
          <option value="">{t("select")}</option>
          {books.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.title} — {b.author} ({b.available} available)
            </option>
          ))}
        </select>
        {books.length === 0 && <p className="text-xs text-yellow-600 mt-1">{t("noBooksAvailableCheckout")}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("dueDate")}</label>
        <input type="date" value={form.due_date} onChange={e=>set("due_date",e.target.value)} className="form-input" required min={new Date().toISOString().slice(0,10)} />
      </div>
      <button type="submit" disabled={loading || books.length === 0} className="btn-primary w-full justify-center">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("saving")}</> : t("checkoutBook")}
      </button>
    </form>
  );
}

function BookForm({ existing, onSuccess }: { existing: any; onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    author: existing?.author ?? "",
    isbn: existing?.isbn ?? "",
    category: existing?.category ?? "",
    total_copies: existing?.total_copies ?? 1,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      existing ? await api.put(`/admin/library/books/${existing.id}`, form) : await api.post("/admin/library/books", form);
      toast.success(t("save")); onSuccess();
    } catch(err: any) { toast.error(err?.response?.data?.error ?? t("operationFailed")); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("bookTitle")}</label><input value={form.title} onChange={e=>set("title",e.target.value)} className="form-input" required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("author")}</label><input value={form.author} onChange={e=>set("author",e.target.value)} className="form-input" /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("isbn")}</label><input value={form.isbn} onChange={e=>set("isbn",e.target.value)} className="form-input" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("type")}</label><input value={form.category} onChange={e=>set("category",e.target.value)} className="form-input" /></div>
        <div><label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">{t("available")}</label><input type="number" min={1} value={form.total_copies} onChange={e=>set("total_copies",parseInt(e.target.value))} className="form-input" /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">{loading ? t("saving") : t("save")}</button>
    </form>
  );
}
