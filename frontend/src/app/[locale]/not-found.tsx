import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-[var(--color-primary-500)]" />
        </div>
        <h1 className="text-7xl font-black text-gradient mb-2">404</h1>
        <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-3">
          Page Not Found
        </h2>
        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-6 py-3"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
