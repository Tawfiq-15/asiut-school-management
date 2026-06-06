import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "@/i18n/routing";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function FeesPage() {
  const t = useTranslations("Fees");

  const semesterFees = t.raw("semesterFees") as any[];
  const oneTimeFees = t.raw("oneTimeFees") as any[];
  const scholarships = t.raw("scholarships") as any[];

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

      {/* Fee Tables */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {[
              { title: t("semesterFeesTitle"), subtitle: t("semesterFeesSub"), items: semesterFees },
              { title: t("oneTimeFeesTitle"), subtitle: t("oneTimeFeesSub"), items: oneTimeFees },
            ].map((table, ti) => (
              <FadeIn key={ti} whileInView delay={ti * 0.04}>
                <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-1">{table.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-6">{table.subtitle}</p>
                <div className="overflow-hidden rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="text-left rtl:text-right">{t("tableHeaderItem")}</th>
                        <th className="text-right rtl:text-left">{t("tableHeaderAmount")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                      {table.items.map((f, i) => (
                        <tr key={i}>
                          <td>
                            <div className="text-sm font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{f.item}</div>
                            <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-0.5">{f.note}</div>
                          </td>
                          <td className="text-right rtl:text-left text-sm font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{f.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Scholarships */}
      <section className="py-20 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("financialSupportTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("scholarshipsTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {scholarships.map((s, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04}
                className="card p-6 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success-500)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{s.name}</h3>
                    <p className="text-sm font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mt-1">{s.coverage}</p>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-2 leading-relaxed">{s.criteria}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/contact" className="btn-primary px-8 py-3 text-base">
              {t("inquireFinancialAid")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
