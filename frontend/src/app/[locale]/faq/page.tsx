import { PublicLayout } from "@/components/PublicLayout";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function FaqPage() {
  const t = useTranslations("FAQ");
  const faqs = t.raw("sections") as any[];

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

      {/* FAQs */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {faqs.map((section, si) => (
            <div key={si} className="space-y-4">
              <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] pb-2 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">{section.category}</h2>
              <div className="space-y-3">
                {section.questions.map((faq: any, fi: number) => (
                  <FadeIn key={fi} whileInView delay={fi * 0.04}
                    className="card p-5 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
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
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
