"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, School, Construction, Rocket, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

interface ComingSoonProps {
  title: string;
  subtitle?: string;
}

export function ComingSoon({ title, subtitle }: ComingSoonProps) {
  const t = useTranslations("Nav");
  
  return (
    <div className="min-h-screen bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)] flex flex-col">
      <nav className="h-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex items-center px-4 justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
            <School className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">Assiut Metals Center</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] hover:text-[var(--color-primary-600)] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t("home")}
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <FadeIn className="max-w-xl w-full text-center">
          <div className="w-16 h-16 rounded-md bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] flex items-center justify-center mx-auto mb-6">
            <Construction className="w-8 h-8 animate-pulse" />
          </div>
          
          <h1 className="text-4xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-4">{title}</h1>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] text-base mb-10 leading-relaxed">
            {subtitle || "We are working hard to bring you a world-class digital experience. This section will be available soon as part of our platform expansion."}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { icon: Rocket, label: "Progress", val: "85%" },
              { icon: Clock, label: "Estimated", val: "2 Weeks" },
              { icon: School, label: "Priority", val: "High" },
            ].map((stat, i) => (
              <div key={i} className="card p-4 text-center">
                <stat.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mx-auto mb-2" />
                <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{stat.label}</div>
                <div className="font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mt-1">{stat.val}</div>
              </div>
            ))}
          </div>

          <Link href="/" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </FadeIn>
      </div>
    </div>
  );
}
