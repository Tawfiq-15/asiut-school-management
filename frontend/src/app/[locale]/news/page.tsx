import { PublicLayout } from "@/components/PublicLayout";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function NewsPage() {
  const t = useTranslations("News");
  const newsList = t.raw("newsList") as any[];

  const featured = newsList.filter(n => n.featured);
  const rest = newsList.filter(n => !n.featured);

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

      {/* Featured */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-8">{t("topStoriesLabel")}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {featured.map((article, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04}
                className="card p-8 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="badge badge-gray">{article.category}</span>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {article.date}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-3 leading-snug">{article.title}</h2>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{article.excerpt}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* All Articles */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-8">{t("allNewsLabel")}</p>
          <div className="space-y-4">
            {rest.map((article, i) => (
              <FadeIn key={i} whileInView delay={i * 0.04}
                className="card p-6 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-gray">{article.category}</span>
                  <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {article.date}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{article.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">{article.excerpt}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
