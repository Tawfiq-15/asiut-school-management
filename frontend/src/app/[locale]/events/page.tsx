import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "@/i18n/routing";
import { FadeIn } from "@/components/FadeIn";
import {
  Calendar, Clock, MapPin, Users,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function EventsPage() {
  const t = useTranslations("Events");

  const upcomingEvents = t.raw("upcomingEvents") as any[];
  const pastEvents = t.raw("pastEvents") as any[];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-3">{t("heroTag")}</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] leading-tight mb-4">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">
              {t("heroDesc")}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("highlightsTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("featuredEventsTitle")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingEvents.filter(e => e.featured).map((event, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04} className="card p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge badge-gray">{event.category}</span>
                  <span className="badge badge-green">{t("highlightsTag")}</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-3">{event.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed mb-5">{event.desc}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    <Calendar className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    <Clock className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    <MapPin className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                    {event.location}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* All Upcoming Events */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("scheduleTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("upcomingEventsTitle")}</h2>
          </div>
          <div className="space-y-3">
            {upcomingEvents.filter(e => !e.featured).map((event, i) => {
              const dateParts = event.date.split(" ");
              const month = dateParts[0];
              const day = dateParts[1]?.replace(",", "") || "";
              return (
                <FadeIn key={i} whileInView delay={i * 0.03} className="card p-5 flex flex-col md:flex-row md:items-center gap-5">
                  {/* Date Badge */}
                  <div className="w-14 h-14 rounded-lg bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)] flex flex-col items-center justify-center flex-shrink-0 border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                    <div className="text-[10px] font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] uppercase">{month}</div>
                    <div className="text-lg font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{day}</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{event.title}</h3>
                      <span className="badge badge-gray">{event.category}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed mb-2">{event.desc}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Past Events */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("archiveTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("pastEventsTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pastEvents.map((event, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04} className="card p-5">
                <span className="badge badge-gray">{event.category}</span>
                <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mt-3 mb-1">{event.title}</h3>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                  <Calendar className="w-3.5 h-3.5" /> {event.date}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1">
                  <Users className="w-3.5 h-3.5" /> {t("attendeesText", { count: event.attendees })}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-14 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-4">{t("ctaTitle")}</h2>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8">{t("ctaDesc")}</p>
          <Link href="/contact" className="btn-primary px-8 py-3 text-base">{t("ctaBtn")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
