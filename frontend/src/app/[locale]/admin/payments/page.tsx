"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, DollarSign, CheckCircle2, Clock, AlertTriangle, UserCheck,
  MessageSquare, X, List, Users, Search, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, StatCard, DataTable, Modal } from "@/components/ui";
import { formatDate, formatCurrency } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

const FEE_TYPES = [
  "Tuition Fee",
  "Semester 1 Fee",
  "Semester 2 Fee",
  "Annual Fee",
  "Exam Fee",
  "Library Fee",
  "Transport Fee",
  "Activity Fee",
];

const STATUS_BADGE: Record<string, string> = {
  paid: "badge-green",
  pending: "badge-yellow",
  overdue: "badge-red",
  cancelled: "badge-blue",
};

export default function PaymentsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [tab, setTab] = useState<"list" | "status">("list");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmPay, setConfirmPay] = useState<{ id: string; isAdmission: boolean; name: string } | null>(null);

  const [generatedCreds, setGeneratedCreds] = useState<{ email: string; password: string } | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedCommApplicant, setSelectedCommApplicant] = useState<any>(null);
  const [commType, setCommType] = useState<"whatsapp" | "email">("whatsapp");
  const [commSubject, setCommSubject] = useState("");
  const [commMessage, setCommMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: paymentsData, isLoading: pLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.get("/admin/payments", { params: { page_size: 500 } }).then((r: any) => r.data),
  });

  const { data: admissionsData, isLoading: aLoading } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => api.get("/admin/admissions", { params: { page_size: 100 } }).then((r: any) => r.data),
  });

  const isLoading = pLoading || aLoading;

  const paymentRecords = (paymentsData?.data ?? []).map((r: any) => ({
    id: r.id,
    isAdmission: false,
    studentName: `${r.student?.user?.first_name || ""} ${r.student?.user?.last_name || ""}`.trim(),
    admissionNo: r.student?.admission_no || "",
    paymentType: r.payment_type,
    amount: r.amount,
    dueDate: r.due_date,
    paidAt: r.paid_at,
    status: r.status,
    raw: r,
  }));

  const admissionRecords = (admissionsData?.data ?? []).map((r: any) => {
    const mappedStatus =
      r.status === "approved" || r.status === "enrolled" ? "paid" : "pending";
    return {
      id: r.id,
      isAdmission: true,
      studentName: r.student_name,
      admissionNo: "New Applicant",
      paymentType: "Registration & Admission Fee",
      amount: 500,
      dueDate: r.applied_at,
      paidAt: null as string | null,
      status: mappedStatus,
      raw: r,
    };
  });

  const records = [...paymentRecords, ...admissionRecords];

  const filteredRecords = records.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.studentName.toLowerCase().includes(q) ||
        r.admissionNo.toLowerCase().includes(q) ||
        r.paymentType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = records.reduce((s, r) => s + (r.amount || 0), 0);
  const collected = records.filter((r) => r.status === "paid").reduce((s, r) => s + (r.amount || 0), 0);
  const pendingAmt = records.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amount || 0), 0);
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const overdueCount = records.filter((r) => r.status === "overdue").length;
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;

  const confirmMarkPaid = (id: string, isAdmission: boolean, name: string) => {
    setConfirmPay({ id, isAdmission, name });
  };

  const markPaid = async () => {
    if (!confirmPay) return;
    const { id, isAdmission } = confirmPay;
    setConfirmPay(null);
    try {
      if (isAdmission) {
        await api.patch(`/admin/admissions/${id}/status`, { status: "approved" });
        qc.invalidateQueries({ queryKey: ["admissions"] });
      } else {
        await api.patch(`/admin/payments/${id}/status`, { status: "paid" });
        qc.invalidateQueries({ queryKey: ["payments"] });
      }
      toast.success("Marked as paid");
    } catch {
      toast.error("Failed");
    }
  };

  const handleEnroll = async (id: string) => {
    setIsEnrolling(true);
    try {
      const res = await api.post(`/admin/admissions/${id}/enroll`);
      qc.invalidateQueries({ queryKey: ["admissions"] });
      setGeneratedCreds({ email: res.data.email, password: res.data.password });
      toast.success("Account Generated Successfully!");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to generate account");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCommunicate = async () => {
    if (!commMessage.trim() || !selectedCommApplicant) return;
    setIsSending(true);
    try {
      await api.post(`/admin/admissions/${selectedCommApplicant.id}/communicate`, {
        type: commType,
        subject: commSubject,
        message: commMessage,
      });
      toast.success("Message sent successfully");
      setSelectedCommApplicant(null);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const columns = [
    {
      key: "student",
      label: t("student"),
      render: (r: any) => (
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)] flex items-center gap-2">
            {r.studentName}
            {r.isAdmission && (
              <span className="badge badge-purple text-[10px] uppercase">Applicant</span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">{r.admissionNo}</div>
        </div>
      ),
    },
    { key: "payment_type", label: t("type"), render: (r: any) => r.paymentType },
    {
      key: "amount",
      label: t("amount"),
      render: (r: any) => <span className="font-semibold tabular-nums">{formatCurrency(r.amount)}</span>,
    },
    {
      key: "due_date",
      label: t("dueDate"),
      render: (r: any) => (
        <div>
          <div className="text-sm">{r.dueDate ? formatDate(r.dueDate) : "—"}</div>
          {r.paidAt && (
            <div className="text-xs text-[var(--color-text-muted)]">
              Paid {formatDate(r.paidAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (r: any) => (
        <span className={`badge ${STATUS_BADGE[r.status] ?? "badge-blue"}`}>{r.status}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (r: any) => (
        <div className="flex gap-1.5 items-center justify-end">
          {r.status !== "paid" && r.status !== "cancelled" && (
            <button
              onClick={() => confirmMarkPaid(r.id, r.isAdmission, r.studentName)}
              className="px-2 py-1 rounded-lg bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 whitespace-nowrap"
            >
              {t("paid")}
            </button>
          )}
          {r.isAdmission && r.status === "paid" && r.raw.status !== "enrolled" && (
            <button
              onClick={() => handleEnroll(r.id)}
              disabled={isEnrolling}
              title="Create Account & Enroll"
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
            >
              {isEnrolling ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
            </button>
          )}
          {r.isAdmission && (
            <button
              onClick={() => {
                setSelectedCommApplicant(r.raw);
                setCommType("whatsapp");
              }}
              title="Communicate"
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t("paymentsTitle")}
        subtitle={t("paymentsSubtitle")}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> {t("addPayment")}
          </button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total Billed"  value={formatCurrency(total)}     icon={DollarSign}    color="blue"   />
        <StatCard title="Collected"     value={formatCurrency(collected)}  icon={CheckCircle2}  color="green"  />
        <StatCard title="Pending"       value={pendingCount}               icon={Clock}         color="orange" />
        <StatCard title="Overdue"       value={overdueCount}               icon={AlertTriangle} color="red"    />
      </div>

      {/* Collection rate bar */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <TrendingUp className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-[var(--color-text-muted)]">Collection Rate</span>
            <span className="text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{collectionRate}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-[var(--color-text-muted)]">Outstanding</div>
          <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
            {formatCurrency(pendingAmt)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <button
          onClick={() => setTab("list")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "list"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
          }`}
        >
          <List className="w-4 h-4" /> {t("paymentRecords")}
        </button>
        <button
          onClick={() => setTab("status")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === "status"
              ? "border-[var(--color-primary-600)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
          }`}
        >
          <Users className="w-4 h-4" /> {t("feeStatusByStudent")}
        </button>
      </div>

      {tab === "list" ? (
        <>
          {/* Search + status filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student, type..."
                className="form-input pl-9 w-full"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["", "pending", "paid", "overdue", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    statusFilter === s ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {s === ""
                    ? t("all")
                    : s === "paid"
                    ? t("paid")
                    : s === "pending"
                    ? t("pending")
                    : s === "overdue"
                    ? t("overdue")
                    : t("cancelled")}
                </button>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredRecords}
              loading={isLoading}
              emptyMessage={t("noPayments")}
            />
          </div>
        </>
      ) : (
        <FeeStatusTab allPayments={paymentsData?.data ?? []} />
      )}

      {/* Add Payment Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={t("addPayment")}>
        <PaymentForm
          onSuccess={() => {
            setShowModal(false);
            qc.invalidateQueries({ queryKey: ["payments"] });
          }}
        />
      </Modal>

      {/* Confirm Mark Paid */}
      {confirmPay && (
        <Modal open={true} onClose={() => setConfirmPay(null)} title="Confirm Payment">
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Mark payment for <span className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{confirmPay.name}</span> as paid?
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmPay(null)} className="btn-secondary">Cancel</button>
              <button onClick={markPaid} className="btn-primary">Confirm</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Communicate Modal */}
      {selectedCommApplicant && (
        <Modal
          open={true}
          onClose={() => setSelectedCommApplicant(null)}
          title="Communicate with Applicant"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select
                value={commType}
                onChange={(e) => setCommType(e.target.value as any)}
                className="form-input"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </select>
            </div>
            {commType === "email" && (
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  className="form-input"
                  placeholder="e.g., Admission Update"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={commMessage}
                onChange={(e) => setCommMessage(e.target.value)}
                rows={5}
                className="form-input"
                placeholder="Type your message here..."
              />
            </div>
            <button
              onClick={handleCommunicate}
              disabled={isSending}
              className="btn-primary w-full justify-center mt-2"
            >
              {isSending ? <Clock className="w-4 h-4 animate-spin" /> : "Send Message"}
            </button>
          </div>
        </Modal>
      )}

      {/* Generated Credentials */}
      {generatedCreds && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" /> Account Generated!
              </h3>
              <button
                onClick={() => setGeneratedCreds(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-mono text-sm border border-zinc-100 dark:border-zinc-800 select-all">
                  {generatedCreds.email}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-mono text-sm border border-zinc-100 dark:border-zinc-800 select-all">
                  {generatedCreds.password}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${generatedCreds.email}\nPassword: ${generatedCreds.password}`
                  );
                  toast.success("Credentials copied to clipboard");
                }}
                className="btn-primary w-full mt-2"
              >
                Copy Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Fee Status Tab ────────────────────────────────────────────────────────────
function FeeStatusTab({ allPayments }: { allPayments: any[] }) {
  const qc = useQueryClient();
  const [feeType, setFeeType] = useState("Semester 1 Fee");
  const [gradeFilter, setGradeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [addingFor, setAddingFor] = useState<any>(null);
  const [addAmount, setAddAmount] = useState("0");
  const [addDue, setAddDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState(false);

  const { data: students = [], isLoading: sLoading } = useQuery({
    queryKey: ["students-fee-status"],
    queryFn: () =>
      api
        .get("/admin/students", { params: { page_size: 500 } })
        .then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });
  const { data: grades = [] } = useQuery({
    queryKey: ["grades"],
    queryFn: () =>
      api
        .get("/admin/grades")
        .then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const paidSet = new Set(
    allPayments
      .filter((p: any) => p.payment_type === feeType && p.status === "paid")
      .map((p: any) => p.student_id)
  );
  const pendingSet = new Set(
    allPayments
      .filter((p: any) => p.payment_type === feeType && p.status !== "paid")
      .map((p: any) => p.student_id)
  );

  const filtered = (students as any[]).filter((s: any) => {
    if (gradeFilter && s.grade_id !== gradeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${s.user?.first_name ?? ""} ${s.user?.last_name ?? ""}`.toLowerCase();
      return name.includes(q) || (s.admission_no ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const paidCount = filtered.filter((s: any) => paidSet.has(s.id)).length;
  const unpaidCount = filtered.filter((s: any) => !paidSet.has(s.id)).length;
  const pendingCount = filtered.filter((s: any) => pendingSet.has(s.id) && !paidSet.has(s.id)).length;

  // Selectable = students with a pending record (can be bulk-marked paid)
  const pendingStudents = filtered.filter(
    (s: any) => pendingSet.has(s.id) && !paidSet.has(s.id)
  );
  const allPendingSelected =
    pendingStudents.length > 0 && pendingStudents.every((s: any) => selected.has(s.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingStudents.map((s: any) => s.id)));
    }
  };

  const handleBulkPaid = async () => {
    if (selected.size === 0) return;
    setBulking(true);
    try {
      await Promise.all(
        [...selected].map((studentId) => {
          const rec = allPayments.find(
            (p: any) =>
              p.student_id === studentId &&
              p.payment_type === feeType &&
              p.status !== "paid"
          );
          return rec
            ? api.patch(`/admin/payments/${rec.id}/status`, { status: "paid" })
            : Promise.resolve();
        })
      );
      toast.success(`${selected.size} payment(s) marked as paid`);
      qc.invalidateQueries({ queryKey: ["payments"] });
      setSelected(new Set());
    } catch {
      toast.error("Some payments failed to update");
    } finally {
      setBulking(false);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingFor) return;
    setSaving(true);
    try {
      await api.post("/admin/payments", {
        student_id: addingFor.id,
        amount: parseFloat(addAmount),
        payment_type: feeType,
        due_date: addDue || null,
      });
      toast.success("Fee record created");
      qc.invalidateQueries({ queryKey: ["payments"] });
      setAddingFor(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to create fee");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (studentId: string) => {
    const rec = allPayments.find(
      (p: any) =>
        p.student_id === studentId &&
        p.payment_type === feeType &&
        p.status !== "paid"
    );
    if (!rec) return;
    try {
      await api.patch(`/admin/payments/${rec.id}/status`, { status: "paid" });
      toast.success("Marked as paid");
      qc.invalidateQueries({ queryKey: ["payments"] });
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-text-muted)]">
            Fee Type
          </label>
          <select
            value={feeType}
            onChange={(e) => { setFeeType(e.target.value); setSelected(new Set()); }}
            className="form-input"
          >
            {FEE_TYPES.map((ft) => (
              <option key={ft}>{ft}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--color-text-muted)]">
            Filter by Class
          </label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Classes</option>
            {(grades as any[]).map((g: any) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.section ?? ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold mb-1 text-[var(--color-text-muted)]">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Student name or ID..."
              className="form-input pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800/30 text-center">
          <div className="text-2xl font-black text-green-700 dark:text-green-400">{paidCount}</div>
          <div className="text-xs text-green-800 dark:text-green-300 font-medium">Paid</div>
        </div>
        <div className="card p-3 border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800/30 text-center">
          <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Pending</div>
        </div>
        <div className="card p-3 border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800/30 text-center">
          <div className="text-2xl font-black text-red-600 dark:text-red-400">{unpaidCount}</div>
          <div className="text-xs text-red-700 dark:text-red-300 font-medium">Not Recorded</div>
        </div>
        <div className="card p-3 border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-center">
          <div className="text-2xl font-black dark:text-[var(--color-dark-text)]">{filtered.length}</div>
          <div className="text-xs text-[var(--color-text-muted)] font-medium">Total Students</div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--color-primary-600)]/10 border border-[var(--color-primary-600)]/30">
          <span className="text-sm font-medium text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]">
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="btn-secondary text-xs py-1 px-2">
              Clear
            </button>
            <button
              onClick={handleBulkPaid}
              disabled={bulking}
              className="btn-primary text-xs py-1 px-2"
            >
              {bulking ? "Updating..." : `Mark ${selected.size} as Paid`}
            </button>
          </div>
        </div>
      )}

      {/* Student list */}
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead className="bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
            <tr>
              <th className="w-10">
                {pendingStudents.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAll}
                    className="rounded"
                    title="Select all pending"
                  />
                )}
              </th>
              <th>Student</th>
              <th>Class</th>
              <th>Fee Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
            {sLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  No students found.
                </td>
              </tr>
            ) : (
              filtered.map((s: any) => {
                const isPaid = paidSet.has(s.id);
                const hasPending = pendingSet.has(s.id) && !isPaid;
                const isSelectable = hasPending;
                return (
                  <tr
                    key={s.id}
                    className={selected.has(s.id) ? "bg-[var(--color-primary-600)]/5" : ""}
                  >
                    <td>
                      {isSelectable && (
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td>
                      <div className="font-medium dark:text-[var(--color-dark-text)]">
                        {s.user?.first_name} {s.user?.last_name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">{s.admission_no}</div>
                    </td>
                    <td className="text-sm dark:text-[var(--color-dark-text)]">
                      {s.grade?.name}
                      {s.grade?.section ?? ""}
                    </td>
                    <td>
                      {isPaid ? (
                        <span className="badge badge-green flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : hasPending ? (
                        <span className="badge badge-yellow flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="badge badge-red flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Not Recorded
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {hasPending && (
                          <button
                            onClick={() => handleMarkPaid(s.id)}
                            className="px-2 py-1 rounded-lg bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 text-xs font-semibold hover:bg-green-100"
                          >
                            Mark Paid
                          </button>
                        )}
                        {!isPaid && (
                          <button
                            onClick={() => {
                              setAddingFor(s);
                              setAddAmount("0");
                              setAddDue("");
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100"
                          >
                            {hasPending ? "Add Another" : "Record Fee"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Fee Modal */}
      {addingFor && (
        <Modal
          open={true}
          onClose={() => setAddingFor(null)}
          title={`Record ${feeType} — ${addingFor.user?.first_name} ${addingFor.user?.last_name}`}
        >
          <form onSubmit={handleAddFee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
                Due Date
              </label>
              <input
                type="date"
                value={addDue}
                onChange={(e) => setAddDue(e.target.value)}
                className="form-input"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? "Saving..." : "Create Fee Record"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Add Payment Form ──────────────────────────────────────────────────────────
function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations("P");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_id: "",
    amount: "",
    payment_type: "Tuition Fee",
    due_date: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const { data: students } = useQuery({
    queryKey: ["students-all"],
    queryFn: () =>
      api
        .get("/admin/students", { params: { page_size: 200 } })
        .then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/payments", { ...form, amount: parseFloat(form.amount) });
      toast.success("Payment recorded");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
          Student
        </label>
        <select
          value={form.student_id}
          onChange={(e) => set("student_id", e.target.value)}
          className="form-input"
          required
        >
          <option value="">Select student</option>
          {(students ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.user?.first_name} {s.user?.last_name} ({s.admission_no})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
            Type
          </label>
          <select
            value={form.payment_type}
            onChange={(e) => set("payment_type", e.target.value)}
            className="form-input"
          >
            {FEE_TYPES.map((ft) => (
              <option key={ft}>{ft}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-[var(--color-dark-text)]">
          Due Date
        </label>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => set("due_date", e.target.value)}
          className="form-input"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? t("saving") : t("addPayment")}
      </button>
    </form>
  );
}
