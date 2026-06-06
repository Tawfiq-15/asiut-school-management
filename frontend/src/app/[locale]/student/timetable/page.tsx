"use client";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout, PageHeader } from "@/components/ui";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations, useLocale } from "next-intl";

const DAY_COLORS = [
  "border-l-blue-500",
  "border-l-violet-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
];

export default function StudentTimetablePage() {
  const t = useTranslations("Sidebar");
  const locale = useLocale();

  // School week: Sunday(0) → Thursday(4). Friday & Saturday are weekend.
  const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
  const DAYS = locale === "ar" ? DAYS_AR : DAYS_EN;

  const currentDayOfWeek = new Date().getDay(); // 0=Sun,1=Mon...

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ["student-timetable"],
    queryFn: () => api.get("/student/timetable").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const byDay: Record<number, any[]> = {};
  (schedule as any[]).forEach(s => { (byDay[s.day_of_week] ??= []).push(s); });

  return (
    <DashboardLayout role="student">
      <PageHeader title={t("timetable")} subtitle={locale === "ar" ? "جدول الحصص الأسبوعي" : "Your weekly class schedule"} />
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="skeleton h-8 w-24 mx-auto rounded-lg" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0,1,2,3,4].map((day, i) => {
            const isToday = day === currentDayOfWeek;
            return (
              <div key={day} className="space-y-3">
                <div className={cn(
                  "text-sm font-bold text-center py-2 rounded-lg transition-colors",
                  isToday
                    ? "bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary-700)] dark:text-[var(--color-primary-400)]"
                    : "text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]"
                )}>
                  {DAYS[day]}
                  {isToday && <span className="block text-[10px] font-medium mt-0.5 opacity-70">{locale === "ar" ? "اليوم" : "Today"}</span>}
                </div>
                {(byDay[day] ?? []).sort((a,b) => a.start_time.localeCompare(b.start_time)).map((s: any) => (
                  <div key={s.id} className={cn("card p-3 border-l-4 hover:shadow-md transition-all", DAY_COLORS[i])}>
                    <div className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" />{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                    </div>
                    <div className="text-sm font-bold dark:text-[var(--color-dark-text)]">{s.subject?.name}</div>
                    {s.teacher?.user && (
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {s.teacher.user.first_name} {s.teacher.user.last_name}
                      </div>
                    )}
                    {s.room && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{locale === "ar" ? `قاعة ${s.room}` : `Room ${s.room}`}</div>}
                  </div>
                ))}
                {!(byDay[day]?.length) && (
                  <div className="text-xs text-center text-[var(--color-text-muted)] py-8 card">
                    {locale === "ar" ? "لا توجد حصص" : "No classes"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
