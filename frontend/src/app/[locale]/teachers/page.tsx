import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "@/i18n/routing";
import {
  BookOpen, Award, GraduationCap, Mail,
  Briefcase, ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function TeachersPage() {
  const t = useTranslations("Teachers");

  const departments = t.raw("departments") as any[];
  const faculty = t.raw("faculty") as any[];

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

      {/* Stats */}
      <section className="py-12 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: GraduationCap, value: "120+", label: t("statFacultyMembers") },
              { icon: Award, value: "85%", label: t("statPhdDegrees") },
              { icon: Briefcase, value: "60%", label: t("statIndustryExperience") },
              { icon: BookOpen, value: "200+", label: t("statPublishedPapers") },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <s.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                <div className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{s.value}</div>
                <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("departmentsTag")}</p>
            <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("departmentsTitle")}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((d, i) => (
              <div key={i} className="card p-4 text-center">
                <div className="text-lg font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{d.count}</div>
                <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Grid */}
      <section className="py-20 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("directoryTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("directoryTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {faculty.map((p, i) => (
              <FadeIn
                key={i}
                whileInView
                delay={i * 0.04}
                className="card p-6 card-hover bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]"
              >
                <div className="w-14 h-14 rounded-md bg-[var(--color-primary-800)] dark:bg-[var(--color-primary-700)] text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {p.initials}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{p.name}</h3>
                  <p className="text-xs text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-semibold mt-1">{p.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-0.5">{p.dept}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1">
                    <span className="font-semibold">{t("labelSpecialization")}:</span> {p.specialization}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    <span className="font-semibold">{t("labelEducation")}:</span> {p.education}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Join Faculty CTA */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Mail className="w-8 h-8 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-4">{t("ctaTitle")}</h2>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8">{t("ctaDesc")}</p>
          <Link href="/contact" className="btn-primary px-8 py-3 text-base">{t("ctaBtn")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
