import { PublicLayout } from "@/components/PublicLayout";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";
import {
  ChevronRight, FileText, CheckCircle2, Calendar,
  CreditCard, UserPlus, ClipboardList, HelpCircle,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  FileText, ClipboardList, UserPlus, CheckCircle2
};

export default function AdmissionsPage() {
  const t = useTranslations("Admissions");
  
  const steps = t.raw("steps") as any[];
  const requirements = t.raw("requirements") as string[];
  const fees = t.raw("fees") as any[];
  const faqs = t.raw("faqs") as any[];
  const importantDates = t.raw("importantDates") as any[];

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
            <p className="text-lg text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed mb-8">
              {t("heroDesc")}
            </p>
            <Link href="/apply" className="btn-primary px-8 py-3 text-base">
              {t("startApp")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("processTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("processTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Icon = ICON_MAP[Object.keys(ICON_MAP)[i]] || FileText;
              return (
                <FadeIn key={i} whileInView delay={i * 0.04} className="card p-6 relative">
                  <div className="absolute -top-3 start-4 w-7 h-7 rounded-md bg-[var(--color-primary-800)] text-white flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center mb-4 mt-2">
                    <Icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{step.desc}</p>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements + Fees */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Requirements */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("requirementsTitle")}</h2>
              </div>
              <ul className="space-y-3">
                {requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success-500)] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fees */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("feesTitle")}</h2>
              </div>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-start">{t("feeItem")}</th>
                      <th className="text-end">{t("feeAmount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f, i) => (
                      <tr key={i}>
                        <td>
                          <div className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{f.item}</div>
                          <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{f.note}</div>
                        </td>
                        <td className="text-end text-sm font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{f.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-14 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-y border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("datesTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {importantDates.map((d, i) => (
              <div key={i} className="card p-6 text-center">
                <Calendar className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mx-auto mb-3" />
                <div className="text-sm font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{d.event}</div>
                <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1">{d.date}</div>
                <span className={`inline-block mt-3 text-xs font-medium px-2.5 py-0.5 rounded-sm ${d.statusCode === "open" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-[var(--color-primary-50)] text-[var(--color-primary-600)] dark:bg-[var(--color-primary-950)] dark:text-[var(--color-primary-400)]"}`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("faqTag")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("faqTitle")}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} whileInView delay={i * 0.03} className="card p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-1">{faq.q}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{faq.a}</p>
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
            <Link href="/apply" className="btn-primary px-8 py-3 text-base">{t("startApp")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Link>
            <Link href="/contact" className="btn-secondary px-8 py-3 text-base">{t("contactAdmissions")}</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
