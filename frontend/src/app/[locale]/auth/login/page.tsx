"use client";

import { Cog } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const tn = useTranslations("Nav");
  const tf = useTranslations("Footer");

  return (
    <div className="min-h-screen flex bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">

      {/* ── Left panel (branding) ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-[var(--color-primary-900)] flex-col relative overflow-hidden flex-shrink-0 border-r border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="relative z-10 flex flex-col h-full p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
              <Cog className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">{tn("siteName")}</div>
              <div className="text-white/40 text-[10px] uppercase tracking-widest">{t("portalSubtitle")}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <FadeIn duration={0.4} y={8}>
              <h1 className="text-3xl font-bold text-white mb-3 leading-snug">
                {t("welcomeTo")}<br />
                <span className="text-white/70">{t("portalTitle")}</span>
              </h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                {t("portalDesc")}
              </p>

              <div className="mt-8 space-y-3">
                {[
                  t("bullet1"),
                  t("bullet2"),
                  t("bullet3"),
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-sm text-white/60"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)] flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <p className="relative z-10 text-[11px] text-white/25">
            © {new Date().getFullYear()} {tn("siteName")}. {tf("rights")}
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
              <Cog className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm dark:text-white">{tn("siteName")}</span>
          </div>
          <div className="lg:ms-auto flex items-center gap-2">
            <ThemeToggle className="text-[var(--color-text-muted)] dark:text-white/60" />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
