import { PublicLayout } from "@/components/PublicLayout";
import { GraduationCap, Cpu, DoorOpen, Bot, Flag, Building2, Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

const iconMap: Record<string, any> = {
  GraduationCap,
  Cpu,
  DoorOpen,
  Bot,
  Flag,
  Building2,
};

export default function GalleryPage() {
  const t = useTranslations("Gallery");
  const albums = t.raw("albums") as any[];

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

      {/* Gallery Grid */}
      <section className="py-16 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album, i) => {
              const IconComp = iconMap[album.icon] || Camera;
              return (
                <FadeIn key={i} whileInView delay={i * 0.04}
                  className="group card overflow-hidden bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] cursor-pointer card-hover">
                  {/* Album cover */}
                  <div className="h-44 bg-[var(--color-primary-900)] dark:bg-[var(--color-dark-surface-3)] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full border-[16px] border-white/20" />
                      <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full border-[12px] border-white/10" />
                    </div>
                    <div className="text-center relative z-10">
                      <IconComp className="w-8 h-8 text-white/60 mx-auto mb-2" />
                      <div className="flex items-center gap-1.5 justify-center text-white/70">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{t("photosCount", { count: album.count })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">{album.category}</span>
                      <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{album.date}</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{album.title}</h3>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
