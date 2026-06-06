"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:text-[var(--color-text-base)] dark:hover:text-[var(--color-dark-text)] hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)] transition-colors rounded-md"
      aria-label="Toggle Language"
    >
      <span className="text-xs font-semibold uppercase tracking-wide">{locale === "en" ? "AR" : "EN"}</span>
    </button>
  );
}
