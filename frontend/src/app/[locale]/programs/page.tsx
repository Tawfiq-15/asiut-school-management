import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "@/i18n/routing";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import {
  BookOpen, Clock, Award, GraduationCap,
  MonitorSmartphone, Cpu, Building2, Wrench, Zap, FlaskConical, ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function ProgramsPage() {
  const t = useTranslations("Programs");

  const programs = [
    { icon: Cpu, title: t("program1Title"), duration: t("semesters"), level: t("diploma"), desc: t("program1Desc"), courses: [t("program1Course1"), t("program1Course2"), t("program1Course3"), t("program1Course4")] },
    { icon: Zap, title: t("program2Title"), duration: t("semesters"), level: t("diploma"), desc: t("program2Desc"), courses: [t("program2Course1"), t("program2Course2"), t("program2Course3"), t("program2Course4")] },
    { icon: Wrench, title: t("program3Title"), duration: t("semesters"), level: t("diploma"), desc: t("program3Desc"), courses: [t("program3Course1"), t("program3Course2"), t("program3Course3"), t("program3Course4")] },
    { icon: Building2, title: t("program4Title"), duration: t("semesters"), level: t("diploma"), desc: t("program4Desc"), courses: [t("program4Course1"), t("program4Course2"), t("program4Course3"), t("program4Course4")] },
    { icon: FlaskConical, title: t("program5Title"), duration: t("semesters"), level: t("diploma"), desc: t("program5Desc"), courses: [t("program5Course1"), t("program5Course2"), t("program5Course3"), t("program5Course4")] },
    { icon: MonitorSmartphone, title: t("program6Title"), duration: t("semesters"), level: t("diploma"), desc: t("program6Desc"), courses: [t("program6Course1"), t("program6Course2"), t("program6Course3"), t("program6Course4")] },
  ];

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

      {/* Program Info Bar */}
      <section className="py-10 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: BookOpen, label: t("numPrograms"), sub: t("numProgramsSub") },
              { icon: Clock, label: t("duration"), sub: t("durationSub") },
              { icon: GraduationCap, label: t("placement"), sub: t("placementSub") },
              { icon: Award, label: t("accreditation"), sub: t("accreditationSub") },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <s.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                <div className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{s.label}</div>
                <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-4">
            {programs.map((prog, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04} className="card p-8 card-hover">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center flex-shrink-0">
                    <prog.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{prog.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-medium text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] px-2 py-0.5 rounded-sm">{prog.level}</span>
                      <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{prog.duration}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed mb-5">{prog.desc}</p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-2">{t("keyCourses")}</p>
                  <div className="flex flex-wrap gap-2">
                    {prog.courses.map((c, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 rounded-sm border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">{c}</span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-4">{t("ctaTitle")}</h2>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="btn-primary px-8 py-3 text-base">{t("applyNow")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Link>
            <Link href="/contact" className="btn-secondary px-8 py-3 text-base">{t("contactAdmissions")}</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
