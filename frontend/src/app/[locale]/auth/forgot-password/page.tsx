"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Cog, Mail, ArrowLeft, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import api from "@/lib/api";
import { FadeIn } from "@/components/FadeIn";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/auth/forgot-password", { email });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-[var(--color-primary-900)] flex-col relative overflow-hidden flex-shrink-0 border-r border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="relative z-10 flex flex-col h-full p-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[var(--color-primary-800)] flex items-center justify-center">
              <Cog className="w-5 h-5 text-white" />
            </div>
            <div className="text-white font-bold text-sm">Assiut Technical School</div>
          </Link>
          <div className="flex-1 flex flex-col justify-center">
            <FadeIn duration={0.4} y={8}>
              <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center mb-6">
                <KeyRound className="w-8 h-8 text-white/70" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Reset your password</h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Enter your email address and we&apos;ll send you instructions to reset your password.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5">
          <Link href="/auth/login" className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] dark:text-white/60 hover:text-[var(--color-text-base)] dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Back to login
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-[var(--color-text-muted)] dark:text-white/60" />
            <LanguageSwitcher />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            {status === "sent" ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-md bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">Check your email</h2>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-6">
                  We&apos;ve sent password reset instructions to <strong className="text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{email}</strong>.
                </p>
                <Link href="/auth/login" className="btn-primary px-6 py-2.5">
                  Return to login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-1">Forgot password?</h2>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                    No worries, we&apos;ll send you reset instructions.
                  </p>
                </div>

                {status === "error" && (
                  <div className="p-3 mb-5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
                    Failed to send reset email. Please try again.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-base)] dark:text-white/80">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input ltr:pl-10 rtl:pr-10"
                        placeholder="you@assiutmc.edu.eg"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn-primary w-full py-2.5 text-sm mt-2"
                  >
                    {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {status === "sending" ? "Sending..." : "Reset password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
