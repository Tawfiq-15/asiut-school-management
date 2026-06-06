import { PublicLayout } from "@/components/PublicLayout";
import { FileText, Shield, Eye, Database, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

const iconMap: Record<string, any> = {
  Shield,
  Eye,
  Database,
  Lock,
};

export default function PoliciesPage() {
  const t = useTranslations("Policies");
  const policies = t.raw("policiesList") as any[];

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

      {/* Policies */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {policies.map((policy, i) => {
            const IconComp = iconMap[policy.icon] || FileText;
            return (
              <FadeIn key={i} whileInView delay={i * 0.04}
                className="card overflow-hidden bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                <div className="flex items-center gap-4 p-6 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-3)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{policy.title}</h2>
                </div>
                <div className="p-6">
                  <ol className="space-y-4">
                    {policy.content.map((clause: string, ci: number) => (
                      <li key={ci} className="flex gap-3 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">
                        <span className="font-bold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] flex-shrink-0">{ci + 1}.</span>
                        {clause}
                      </li>
                    ))}
                  </ol>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </section>
    </PublicLayout>
  );
}
