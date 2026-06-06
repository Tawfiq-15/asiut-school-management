"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, FileText, BookMarked, Users, Calendar, Clock } from "lucide-react";
import { DashboardLayout, StatCard, StatCardSkeleton, PageHeader, DataTable, Badge } from "@/components/ui";
import { formatDate, dayName, statusColor, cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherDashboardPage() {
  const t = useTranslations("Dashboard.teacher");
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: () => api.get("/teacher/profile").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: schedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ["teacher-schedule"],
    queryFn: () => api.get("/teacher/schedule").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: () => api.get("/teacher/assignments").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: exams, isLoading: isExamsLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => api.get("/teacher/exams").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const isLoading = isProfileLoading || isScheduleLoading || isAssignmentsLoading || isExamsLoading;

  const today = new Date().getDay();
  const todaySchedule = (schedule ?? []).filter((s: any) => s.day_of_week === today);

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title={t("myClasses")}      value={(schedule ?? []).length}    icon={Calendar}     color="blue"   delay={0} />
            <StatCard title={t("assignmentsActive")} value={(assignments ?? []).length} icon={FileText}     color="purple" delay={0.05} />
            <StatCard title={t("upcomingExams")}  value={(exams ?? []).length}       icon={BookMarked}   color="green"  delay={0.1} />
            <StatCard title={t("todayClasses")}   value={todaySchedule.length}       icon={ClipboardList} color="orange" delay={0.15} />
          </>
        )}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="xl:col-span-1 card p-5">
          <h2 className="font-semibold text-base mb-4 dark:text-[var(--color-dark-text)]">{t("todaySchedule")}</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : todaySchedule.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">{t("noClassesToday")} 🎉</div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]"
                >
                  <div className="text-center flex-shrink-0">
                     <div className="text-xs font-semibold text-[var(--color-primary-600)]">{s.start_time?.slice(0, 5)}</div>
                     <div className="text-xs text-[var(--color-text-muted)]">{s.end_time?.slice(0, 5)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium dark:text-[var(--color-dark-text)]">{s.subject?.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{s.room ? `Room ${s.room}` : "TBA"}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="font-semibold text-base mb-4 dark:text-[var(--color-dark-text)]">{t("recentAssignments")}</h2>
          <DataTable
            loading={isLoading}
            columns={[
              { key: "title",   label: t("titleLabel"),   render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</span> },
              { key: "subject", label: t("subject"), render: (r: any) => r.subject?.name ?? "—" },
              { key: "due",     label: t("dueDate"),     render: (r: any) => formatDate(r.due_date) },
              { key: "status",  label: t("status"),  render: (r: any) => <span className={`badge ${r.is_published ? "badge-green" : "badge-yellow"}`}>{r.is_published ? t("published") : t("draft")}</span> },
            ]}
            data={(assignments ?? []).slice(0, 6)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
