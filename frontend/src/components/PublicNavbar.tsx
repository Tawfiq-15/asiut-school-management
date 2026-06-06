"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { Cog, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const tn       = useTranslations("Nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const navLinks = useMemo(() => [
    { label: tn("home"),       href: "/" },
    { label: tn("about"),      href: "/about" },
    { label: tn("programs"),   href: "/programs" },
    { label: tn("admissions"), href: "/admissions" },
    { label: tn("teachers"),   href: "/teachers" },
    { label: tn("events"),     href: "/events" },
    { label: tn("news"),       href: "/news" },
    { label: tn("gallery"),    href: "/gallery" },
    { label: tn("contact"),    href: "/contact" },
  ], [tn]);

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
              <Cog className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
                {tn("siteName")}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] font-medium tracking-wider uppercase">
                {tn("technicalTraining")}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  isActive(l.href)
                    ? "text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]"
                    : "text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:text-[var(--color-text-base)] dark:hover:text-[var(--color-dark-text)]"
                )}
              >
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[var(--color-primary-600)] dark:bg-[var(--color-primary-400)] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden xl:flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:text-[var(--color-text-base)] dark:hover:text-[var(--color-dark-text)] transition-colors"
            >
              {tn("signIn")}
            </Link>
            <Link
              href="/apply"
              className="btn-primary text-sm px-4 py-2"
            >
              {tn("applyNow")}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="xl:hidden p-2 rounded-md text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)] transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="xl:hidden border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface-2)]">
          <div className="px-4 pb-4 pt-2 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive(l.href)
                    ? "text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-semibold"
                    : "text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:text-[var(--color-text-base)] dark:hover:text-[var(--color-dark-text)] hover:bg-[var(--color-surface-3)] dark:hover:bg-[var(--color-dark-surface-3)]"
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3 flex items-center gap-2 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] mt-3">
              <ThemeToggle />
              <LanguageSwitcher />
              <Link href="/auth/login" onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1 text-center">{tn("signIn")}</Link>
              <Link href="/apply"      onClick={() => setOpen(false)} className="btn-primary  text-sm flex-1 text-center">{tn("applyNow")}</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
