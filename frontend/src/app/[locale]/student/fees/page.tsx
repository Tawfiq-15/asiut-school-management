"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable, StatCard } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentFeesPage() {
  const t = useTranslations("P");
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["student-fees"],
    queryFn: () => api.get("/student/fees").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const list = fees as any[];
  const paid    = list.filter((f) => f.status === "paid");
  const pending = list.filter((f) => f.status === "pending");
  const overdue = list.filter((f) => f.status === "overdue");
  const totalDue = pending.concat(overdue).reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

  const columns = [
    { key: "payment_type", label: t("type"), render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.payment_type}</span> },
    { key: "amount", label: t("amount"), render: (r: any) => <span className="font-semibold dark:text-[var(--color-dark-text)]">{formatCurrency(r.amount)}</span> },
    { key: "due_date", label: t("dueDate"), render: (r: any) => r.due_date ? formatDate(r.due_date) : "—" },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { paid: "badge-green", pending: "badge-yellow", overdue: "badge-red", cancelled: "badge-gray" };
      return <span className={`badge ${map[r.status]}`}>{t(r.status)}</span>;
    }},
    { key: "paid_at", label: t("date"), render: (r: any) => r.paid_at ? formatDate(r.paid_at) : "—" },
  ];

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("studentFeesTitle")} subtitle={t("studentFeesSubtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t("paid")}           value={paid.length}             icon={CheckCircle2}  color="green"  />
        <StatCard title={t("pending")}        value={pending.length}          icon={Clock}         color="orange" />
        <StatCard title={t("overdue")}        value={overdue.length}          icon={AlertTriangle} color="red"    />
        <StatCard title="Total Outstanding"   value={formatCurrency(totalDue)} icon={CreditCard}   color="blue"   />
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={columns} data={list} loading={isLoading} emptyMessage={t("noPayments")} />
      </div>
    </DashboardLayout>
  );
}
