"use client";

import { Link } from "@/i18n/routing";
import {
  Users, BookOpen, Trophy, Star, ArrowRight,
  CheckCircle2, Globe, Shield, BarChart3, Calendar,
  MessageSquare, Bell, ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicLayout";
import { ScrollToTop, StatCard } from "@/components/ui";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";

const iconMap: Record<string, any> = {
  Users, BookOpen, Trophy, Globe,
  BarChart3, Shield, MessageSquare, Bell, Calendar
};

export default function HomePage() {
  const t = useTranslations("Landing");
  const heroBadges = t.raw("heroBadges") as string[];
  const stats = t.raw("stats") as any[];
  const features = t.raw("features") as any[];
  const testimonials = t.raw("testimonials") as any[];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="pt-24 pb-20 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn duration={0.4} y={12} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] border border-[var(--color-primary-100)] dark:border-[var(--color-primary-900)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] text-sm font-medium mb-6">
              {t("accepting")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-tight tracking-tight text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
              {t("heroTitle1")}
              <br />
              <span className="text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">{t("heroTitle2")}</span>
              <br />
              {t("heroTitle3")}
            </h1>

            <p className="mt-6 text-lg text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] max-w-2xl mx-auto leading-relaxed">
              {t("heroDesc")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/apply" className="btn-primary text-base px-8 py-3">
                {t("applyBtn")} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
              <Link href="/auth/login" className="btn-secondary text-base px-8 py-3">
                {t("accessBtn")}
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[var(--color-text-muted)]">
              {heroBadges.map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success-500)]" />
                  {item}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const IconComp = iconMap[s.iconName] || Globe;
              return (
                <StatCard
                  key={s.label}
                  title={s.label}
                  value={s.value}
                  icon={IconComp}
                  delay={i * 0.05}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn whileInView className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
              {t("featuresTitle")}
            </h2>
            <p className="mt-3 text-base text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] max-w-2xl mx-auto">
              {t("featuresDesc")}
            </p>
          </FadeIn>

          <StaggerContainer whileInView stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const IconComp = iconMap[f.iconName] || Globe;
              return (
                <StaggerItem key={f.title}>
                  <div className="card p-6 card-hover h-full">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] border border-[var(--color-primary-100)] dark:border-[var(--color-primary-900)] flex items-center justify-center mb-4">
                      <IconComp className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                    </div>
                    <h3 className="font-semibold text-base mb-2 text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{f.title}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-y border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn whileInView className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
              {t("testimonialsTitle")}
            </h2>
          </FadeIn>
          <StaggerContainer whileInView className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <div className="card p-6 h-full flex flex-col">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed flex-1">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                    <div className="w-9 h-9 rounded-md bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] text-sm font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{t.role}</div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn whileInView>
            <div className="p-12 rounded-lg bg-[var(--color-primary-900)] dark:bg-[var(--color-dark-surface-2)] border border-transparent dark:border-[var(--color-dark-border)]">
              <h2 className="text-3xl font-bold text-white">
                {t("ctaTitle")}
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto">
                {t("ctaDesc")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-white text-[var(--color-primary-900)] font-semibold text-base hover:bg-white/90 transition-colors">
                  {t("ctaStart")} <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </Link>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md border border-white/20 text-white font-medium text-base hover:bg-white/10 transition-colors">
                  {t("ctaTalk")}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
      <ScrollToTop />
    </div>
  );
}
