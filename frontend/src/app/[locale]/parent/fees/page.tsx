"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentFeesPage() {
  const t = useTranslations("P");
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["parent-fees"],
    queryFn: () => api.get("/parent/fees").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const columns = [
    { key: "student", label: t("student"), render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.student?.user?.first_name}</span> },
    { key: "payment_type", label: t("type"), render: (r: any) => r.payment_type },
    { key: "amount", label: t("amount"), render: (r: any) => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { key: "due_date", label: t("dueDate"), render: (r: any) => r.due_date ? formatDate(r.due_date) : "—" },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { paid: "badge-green", pending: "badge-yellow", overdue: "badge-red", cancelled: "badge-gray" };
      return <span className={`badge ${map[r.status]}`}>{t(r.status)}</span>;
    }},
    { key: "paid_at", label: t("date"), render: (r: any) => r.paid_at ? formatDate(r.paid_at) : "—" },
  ];

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("studentFeesTitle")} subtitle={t("studentFeesSubtitle")} />
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={fees} loading={isLoading} emptyMessage={t("noPayments")} />
      </div>
    </DashboardLayout>
  );
}
