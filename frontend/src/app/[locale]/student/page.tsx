"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ClipboardList, BarChart3, FileText, CreditCard,
  TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { DashboardLayout, StatCard, StatCardSkeleton, PageHeader, DataTable, Badge } from "@/components/ui";
import { formatDate, formatCurrency, attendancePercent, gradeLetterFromPercent, statusColor } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function StudentDashboardPage() {
  const t = useTranslations("Dashboard.student");
  const { data: attendance, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ["student-attendance"],
    queryFn: () => api.get("/student/attendance").then((r: any) => r.data),
  });

  const { data: grades, isLoading: isGradesLoading } = useQuery({
    queryKey: ["student-grades"],
    queryFn: () => api.get("/student/grades").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ["student-assignments"],
    queryFn: () => api.get("/student/assignments").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: fees, isLoading: isFeesLoading } = useQuery({
    queryKey: ["student-fees"],
    queryFn: () => api.get("/student/fees").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const { data: announcements, isLoading: isAnnouncementsLoading } = useQuery({
    queryKey: ["student-announcements"],
    queryFn: () => api.get("/student/announcements").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const isLoading = isAttendanceLoading || isGradesLoading || isAssignmentsLoading || isFeesLoading || isAnnouncementsLoading;

  const summary = attendance?.summary ?? { present: 0, absent: 0, late: 0 };
  const total = summary.present + summary.absent + summary.late;
  const attendancePct = attendancePercent(summary.present, total);

  const pendingFees = (fees ?? []).filter((f: any) => f.status === "pending" || f.status === "overdue");

  return (
    <DashboardLayout role="student">
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
            <StatCard title={t("attendanceRate")} value={`${attendancePct}%`}          icon={ClipboardList} color="blue"   delay={0} />
            <StatCard title={t("avgGrade")}       value={getAvgGrade(grades)}           icon={BarChart3}     color="green"  delay={0.05} />
            <StatCard title={t("assignmentsDue")} value={getPendingAssignments(assignments)} icon={FileText} color="orange" delay={0.1} />
            <StatCard title={t("pendingFees")}    value={pendingFees.length}             icon={CreditCard}    color="red"    delay={0.15} />
          </>
        )}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Attendance gauge */}
        <div className="card p-5 flex flex-col items-center">
          <h2 className="font-semibold text-base mb-2 dark:text-[var(--color-dark-text)] self-start">{t("attendanceRate")}</h2>
          {isLoading ? (
            <div className="skeleton w-32 h-32 rounded-full my-4" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="90%"
                  data={[{ value: attendancePct, fill: attendancePct >= 75 ? "#22c55e" : "#ef4444" }]}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-16">
                <div className="text-4xl font-extrabold dark:text-[var(--color-dark-text)]">{attendancePct}%</div>
                <div className="text-sm text-[var(--color-text-muted)]">{summary.present} {t("present")} · {summary.absent} {t("absent")}</div>
              </div>
              {attendancePct < 75 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg w-full">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {t("attendanceBelowThreshold")}
                </div>
              )}
            </>
          )}
        </div>

        {/* Grade Chart */}
        <div className="xl:col-span-2 card p-5">
          <h2 className="font-semibold text-base mb-4 dark:text-[var(--color-dark-text)]">{t("gradesBySubject")}</h2>
          {isLoading ? (
            <div className="skeleton w-full h-[180px] rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={buildGradeData(grades)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={((v: any) => [`${v}%`, "Score"]) as any}
                  contentStyle={{ borderRadius: 12, fontSize: 13 }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Announcements & Recent assignments */}
      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-base mb-4 dark:text-[var(--color-dark-text)]">{t("recentAssignments")}</h2>
          <DataTable
            loading={isLoading}
            columns={[
              { key: "title",   label: t("assignment"), render: (r: any) => <span className="font-medium dark:text-[var(--color-dark-text)]">{r.title}</span> },
              { key: "subject", label: t("subject"),    render: (r: any) => r.subject?.name ?? "—" },
              { key: "due",     label: t("dueDate"),   render: (r: any) => formatDate(r.due_date) },
              {
                key: "submitted",
                label: t("status"),
                render: (r: any) => r.submission
                  ? <span className="badge badge-green"><CheckCircle2 className="w-3 h-3 inline mr-1" />{t("submitted")}</span>
                  : <span className="badge badge-yellow">{t("pending")}</span>,
              },
            ]}
            data={(assignments ?? []).slice(0, 5)}
          />
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-base mb-4 dark:text-[var(--color-dark-text)]">{t("latestAnnouncements")}</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : announcements?.length ? (
              announcements.slice(0, 3).map((a: any, i: number) => (
                <div key={i} className="pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                  <h3 className="text-sm font-bold dark:text-[var(--color-dark-text)] mb-1">{a.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-2">{a.content}</p>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                    {formatDate(a.created_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                {t("noRecentAnnouncements")}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function getAvgGrade(grades: any[]): string {
  if (!grades?.length) return "N/A";
  const scores = grades.filter((g) => g.marks_obtained != null && g.exam?.total_marks);
  if (!scores.length) return "N/A";
  const avg = scores.reduce((sum, g) => sum + (g.marks_obtained / g.exam.total_marks) * 100, 0) / scores.length;
  return gradeLetterFromPercent(avg);
}

function getPendingAssignments(assignments: any[]): number {
  if (!assignments?.length) return 0;
  const now = new Date();
  return assignments.filter((a) => !a.submission && new Date(a.due_date) > now).length;
}

function buildGradeData(grades: any[]) {
  if (!grades?.length) return [];
  return grades.slice(0, 6).map((g) => ({
    subject: g.exam?.subject?.name?.slice(0, 8) ?? "—",
    score: g.marks_obtained != null && g.exam?.total_marks
      ? Math.round((g.marks_obtained / g.exam.total_marks) * 100)
      : 0,
  }));
}
