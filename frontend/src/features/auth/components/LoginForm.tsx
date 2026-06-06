"use client";

import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle, LayoutDashboard, GraduationCap, Users, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useLogin } from "../hooks/useLogin";

const DEMO_ACCOUNTS = [
  {
    roleKey: "admin",
    email: "admin@school.com",
    password: "Admin@123",
    icon: LayoutDashboard,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600",
  },
  {
    roleKey: "teacher",
    email: "teacher@school.com",
    password: "Teacher@123",
    icon: Users,
    gradient: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600",
  },
  {
    roleKey: "student",
    email: "student@school.com",
    password: "Student@123",
    icon: GraduationCap,
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600",
  },
  {
    roleKey: "parent",
    email: "parent@school.com",
    password: "Parent@123",
    icon: Heart,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600",
  },
];

export function LoginForm() {
  const t = useTranslations("Auth");
  const {
    email, setEmail, password, setPassword, showPass, setShowPass,
    loading, error, handleSubmit, fillDemo
  } = useLogin();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[400px]"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-white mb-1">
          {t("welcomeBack")}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] dark:text-white/50">
          {t("signInPortal")}
        </p>
      </div>

      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] dark:text-white/35 mb-2.5">
          {t("quickDemo")}
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            return (
              <button
                key={acc.roleKey}
                type="button"
                onClick={() => fillDemo(acc.email, acc.password)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium hover:-translate-y-0.5 hover:shadow-md",
                  acc.bg, acc.border
                )}
              >
                <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", acc.gradient)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[var(--color-text-base)] dark:text-white/70">
                  {t(acc.roleKey as any)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[var(--color-border)] dark:bg-white/10" />
        <span className="text-[11px] text-[var(--color-text-muted)] dark:text-white/30 uppercase tracking-widest">
          {t("orSignInManually")}
        </span>
        <div className="flex-1 h-px bg-[var(--color-border)] dark:bg-white/10" />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-text-base)] dark:text-white/80">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="you@assuitmc.edu.eg"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--color-text-base)] dark:text-white/80">
              {t("password")}
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] hover:text-[var(--color-primary-700)] dark:hover:text-[var(--color-primary-300)] transition-colors">
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input ltr:pr-10 rtl:pl-10"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] dark:text-white/40 hover:text-[var(--color-text-base)] dark:hover:text-white transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 text-sm mt-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? t("signingIn") : t("signIn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-text-muted)] dark:text-white/40">
        {t("newStudent")}{" "}
        <Link href="/apply" className="text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-medium hover:text-[var(--color-primary-700)] dark:hover:text-[var(--color-primary-300)] transition-colors">
          {t("applyNow")}
        </Link>
      </p>
    </motion.div>
  );
}
