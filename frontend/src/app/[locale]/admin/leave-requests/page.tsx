"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Clock, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const STATUSES = ["all", "pending", "approved", "rejected"] as const;

export default function LeaveRequestsPage() {
  const t = useTranslations("P");
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["leave-requests", statusFilter],
    queryFn: () =>
      api.get("/admin/leave-requests", {
        params: statusFilter !== "all" ? { status: statusFilter } : {},
      }).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/leave-requests/${id}/status`, { status }),
    onSuccess: (_data, { status }) => {
      qc.invalidateQueries({ queryKey: ["leave-requests"] });
      toast.success(status === "approved" ? t("leaveApproved") : t("leaveRejected"));
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? t("operationFailed")),
  });

  const pending  = requests.filter((r: any) => r.status === "pending").length;
  const approved = requests.filter((r: any) => r.status === "approved").length;
  const rejected = requests.filter((r: any) => r.status === "rejected").length;

  const columns = [
    {
      key: "student",
      label: t("student"),
      render: (r: any) => (
        <div>
          <div className="font-medium dark:text-[var(--color-dark-text)]">
            {r.student?.user?.first_name} {r.student?.user?.last_name}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-mono">{r.student?.admission_no}</div>
        </div>
      ),
    },
    {
      key: "from_date",
      label: t("fromDate"),
      render: (r: any) => <span className="text-sm dark:text-[var(--color-dark-text)]">{formatDate(r.from_date)}</span>,
    },
    {
      key: "to_date",
      label: t("toDate"),
      render: (r: any) => <span className="text-sm dark:text-[var(--color-dark-text)]">{formatDate(r.to_date)}</span>,
    },
    {
      key: "reason",
      label: t("reason"),
      render: (r: any) => (
        <span className="text-sm text-[var(--color-text-muted)] line-clamp-2 max-w-xs">{r.reason ?? "—"}</span>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (r: any) => {
        const map: Record<string, string> = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };
        return <span className={`badge ${map[r.status] ?? "badge-blue"}`}>{r.status}</span>;
      },
    },
    {
      key: "actions",
      label: "",
      render: (r: any) =>
        r.status === "pending" ? (
          <div className="flex gap-1">
            <button
              onClick={() => updateStatus.mutate({ id: r.id, status: "approved" })}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 hover:bg-green-100 font-medium transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("approveLeave")}
            </button>
            <button
              onClick={() => updateStatus.mutate({ id: r.id, status: "rejected" })}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 font-medium transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("rejectLeave")}
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("leaveRequestsTitle")} subtitle={t("leaveRequestsSubtitle")} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t("pending"),  value: pending,  icon: Clock,         cls: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/40" },
          { label: t("approved"), value: approved, icon: CheckCircle2,  cls: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/40" },
          { label: t("rejected"), value: rejected, icon: XCircle,       cls: "text-red-500 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/40" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card p-4 flex items-center gap-3 border ${s.cls}`}
          >
            <s.icon className="w-5 h-5" />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs capitalize">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
              statusFilter === s ? "btn-primary" : "btn-secondary"
            }`}
          >
            {s === "all" ? t("all") : t(s as any)}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={requests}
          loading={isLoading}
          emptyMessage={t("noLeaveRequests")}
        />
      </div>
    </DashboardLayout>
  );
}
