"use client";

import { PublicLayout } from "@/components/PublicLayout";
import { useTranslations } from "next-intl";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import {
  Target, Award, Users, BookOpen, Globe, Shield,
  GraduationCap, Building2, Lightbulb, Handshake,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Users, BookOpen, Award, Building2, Target, Lightbulb, Handshake, Globe
};

export default function AboutPage() {
  const t = useTranslations("About");
  
  const timeline = t.raw("timeline") as any[];
  const values = t.raw("values") as any[];
  const leadership = t.raw("leadership") as any[];
  const accreditations = t.raw("accreditations") as string[];

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

      {/* Mission & Vision */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <FadeIn whileInView className="card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("missionTitle")}</h2>
              </div>
              <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed text-sm">
                {t("missionDesc")}
              </p>
            </FadeIn>

            <FadeIn whileInView delay={0.05} className="card p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("visionTitle")}</h2>
              </div>
              <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed text-sm">
                {t("visionDesc")}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-y border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "2,400+", label: t("statsStudents") },
              { icon: BookOpen, value: "40+", label: t("statsPrograms") },
              { icon: Award, value: "98%", label: t("statsEmployment") },
              { icon: Building2, value: "15+", label: t("statsPartners") },
            ].map((s, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04} className="text-center">
                <div className="w-11 h-11 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center mx-auto mb-3">
                  <s.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{s.value}</div>
                <div className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1">{s.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("valuesTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("valuesTitle")}</h2>
          </div>
          <StaggerContainer whileInView className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => {
              const Icon = ICON_MAP[Object.keys(ICON_MAP)[i + 4]] || Target;
              return (
                <StaggerItem key={i}>
                  <div className="card p-6 card-hover h-full">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{v.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{v.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("journeyTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("journeyTitle")}</h2>
          </div>
          <div className="relative">
            <div className="absolute top-0 bottom-0 start-[16px] w-px bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <FadeIn key={i} whileInView delay={i * 0.04} className="relative ps-12">
                  <div className="absolute start-0 top-0 w-8 h-8 rounded-md bg-[var(--color-primary-800)] dark:bg-[var(--color-primary-700)] text-white flex items-center justify-center text-xs font-bold">
                    {item.year.slice(-2)}
                  </div>
                  <div className="card p-5">
                    <div className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] uppercase tracking-wider mb-1">{item.year}</div>
                    <h3 className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-1">{item.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("governanceTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("governanceTitle")}</h2>
          </div>
          <StaggerContainer whileInView className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {leadership.map((p, i) => (
              <StaggerItem key={i}>
                <div className="card p-6 text-center card-hover">
                  <div className="w-14 h-14 rounded-md bg-[var(--color-primary-800)] text-white flex items-center justify-center mx-auto mb-4 text-base font-bold">
                    {p.initials}
                  </div>
                  <h3 className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{p.name}</h3>
                  <p className="text-xs text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-semibold mt-1 mb-3">{p.role}</p>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Accreditations */}
      <section className="py-14 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-8">{t("accreditationsTag")}</p>
          <div className="flex flex-wrap justify-center gap-3 items-center">
            {accreditations.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]"
              >
                <Shield className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] flex-shrink-0" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
