"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, BarChart3, CreditCard } from "lucide-react";
import { DashboardLayout, StatCard, StatCardSkeleton, PageHeader, DataTable } from "@/components/ui";
import { formatDate, formatCurrency, statusColor } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations, useLocale } from "next-intl";

export default function ParentDashboardPage() {
  const t = useTranslations("Dashboard.parent");
  const { data: children, isLoading: isChildrenLoading } = useQuery({
    queryKey: ["parent-children"],
    queryFn: () => api.get("/parent/children").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: fees, isLoading: isFeesLoading } = useQuery({
    queryKey: ["parent-fees"],
    queryFn: () => api.get("/parent/fees").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const isLoading = isChildrenLoading || isFeesLoading;

  const pendingFees = (fees ?? []).filter((f: any) => f.status === "pending" || f.status === "overdue");
  const pendingAmount = pendingFees.reduce((sum: number, f: any) => sum + (f.amount ?? 0), 0);

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title={t("children")}       value={(children ?? []).length} icon={Users}        color="blue"   delay={0} />
            <StatCard title={t("pendingFees")}   value={pendingFees.length}      icon={CreditCard}   color="orange" delay={0.05} />
            <StatCard title={t("amountDue")}     value={formatCurrency(pendingAmount)} icon={CreditCard} color="red"  delay={0.1} />
            <StatCard title={t("messages")}       value={0}                        icon={BarChart3}    color="green"  delay={0.15} />
          </>
        )}
      </div>

      {/* Children cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-md" />
          ))
        ) : (
          (children ?? []).map((child: any) => (
            <ChildCard key={child.id} child={child} />
          ))
        )}
      </div>

      {/* Fees Table */}
      <div className="card p-5">
        <h2 className="font-semibold text-base mb-4 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("feeStatus")}</h2>
        <DataTable
          loading={isLoading}
          columns={[
            { key: "type",    label: t("type"),    render: (r: any) => r.payment_type },
            { key: "amount",  label: t("amount"),  render: (r: any) => formatCurrency(r.amount) },
            { key: "due",     label: t("dueDate"),render: (r: any) => r.due_date ? formatDate(r.due_date) : "—" },
            { key: "status",  label: t("status"),  render: (r: any) => <span className={`badge ${statusColor(r.status)}`}>{r.status}</span> },
          ]}
          data={fees ?? []}
        />
      </div>
    </DashboardLayout>
  );
}

function ChildCard({ child }: { child: any }) {
  const t = useTranslations("Dashboard.parent");
  const locale = useLocale();
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["child-attendance", child.id],
    queryFn: () => api.get(`/parent/children/${child.id}/attendance`).then((r: any) => r.data),
  });

  if (isLoading) {
    return <div className="skeleton h-32 rounded-md" />;
  }

  const summary = attendance?.summary ?? { present: 0, absent: 0, late: 0 };
  const total = summary.present + summary.absent + summary.late;
  const pct = total > 0 ? Math.round((summary.present / total) * 100) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {child.user?.first_name?.[0]}{child.user?.last_name?.[0]}
        </div>
        <div className="flex-1">
          <div className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
            {child.user?.first_name} {child.user?.last_name}
          </div>
          <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
            {child.grade ? `${t("grade")} ${child.grade.name}${child.grade.section ? `-${child.grade.section}` : ""}` : "Unassigned"} · Adm# {child.admission_no}
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{t("attendance")}</div>
              <div className={`font-semibold ${pct >= 75 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>{pct}%</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{locale === "ar" ? "غائب" : "Absent"}</div>
              <div className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{summary.absent}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{locale === "ar" ? "متأخر" : "Late"}</div>
              <div className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{summary.late}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
