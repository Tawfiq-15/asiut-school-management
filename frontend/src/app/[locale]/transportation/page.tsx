import { PublicLayout } from "@/components/PublicLayout";
import { Bus, Clock, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

const statIconMap: Record<number, any> = {
  0: Bus,
  1: Clock,
  2: Phone,
};

export default function TransportationPage() {
  const t = useTranslations("Transportation");

  const stats = t.raw("stats") as any[];
  const routes = t.raw("routes") as any[];

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
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.map((s, i) => {
              const IconComp = statIconMap[i] || Bus;
              return (
                <div key={i} className="card p-5 flex items-center gap-4 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                  </div>
                  <div>
                    <div className="text-xs section-label mb-0.5">{s.label}</div>
                    <div className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{s.value}</div>
                    <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Routes */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-2">{t("scheduleLabel")}</p>
            <h2 className="text-3xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("routesTitle")}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {routes.map((route, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04}
                className="card p-6 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">{route.id}</span>
                    <h3 className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{route.name}</h3>
                  </div>
                  <div className="text-right text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    <div>{t("departsText")}<span className="font-semibold"> {route.departure}</span></div>
                    <div>{t("returnsText")}<span className="font-semibold"> {route.return}</span></div>
                  </div>
                </div>
                <div className="space-y-2 font-arabic-support">
                  {route.stops.map((stop: string, si: number) => (
                    <div key={si} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${si === route.stops.length - 1 ? "bg-[var(--color-primary-600)] dark:bg-[var(--color-primary-400)]" : "bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"}`} />
                      {stop}
                      {si === route.stops.length - 1 && <span className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] ml-2 rtl:mr-2">{t("terminusText")}</span>}
                    </div>
                  ))}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
