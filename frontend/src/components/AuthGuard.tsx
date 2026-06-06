"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Give zustand persist time to hydrate
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace("/auth/login");
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        // Redirect to correct dashboard
        router.replace(`/${user.role}`);
        return;
      }

      setChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[var(--color-primary-500)] animate-spin" />
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
