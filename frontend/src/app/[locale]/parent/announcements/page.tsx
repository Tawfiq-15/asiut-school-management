"use client";
import { useQuery } from "@tanstack/react-query";
import { Bell, Pin } from "lucide-react";
import { DashboardLayout, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function ParentAnnouncementsPage() {
  const t = useTranslations("P");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements-parent"],
    queryFn: () =>
      api.get("/parent/announcements").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  return (
    <DashboardLayout role="parent">
      <PageHeader title={t("announcementsTitle")} subtitle={t("announcementsSubtitle")} />

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-text-muted)]">{t("noAnnouncements")}</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: any, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`card p-5 border-l-4 ${
                a.is_pinned
                  ? "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20"
                  : "border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold dark:text-[var(--color-dark-text)]">{a.title}</h3>
                    {a.is_pinned && (
                      <span className="badge badge-blue text-xs flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        {t("pinned")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="text-xs text-[var(--color-text-muted)] mt-2">
                    {formatDate(a.created_at)}
                    {a.author && ` · ${a.author.first_name} ${a.author.last_name}`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
