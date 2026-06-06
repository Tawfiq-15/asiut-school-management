import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Cog, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { PublicNavbar } from "./PublicNavbar";

const Facebook = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
const Twitter = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const Instagram = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
const Linkedin = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;

export function PublicFooter() {
  const tn = useTranslations("Nav");
  const tf = useTranslations("Footer");

  return (
    <footer className="bg-[var(--color-primary-900)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-md bg-[var(--color-primary-800)] border border-white/10 flex items-center justify-center">
                <Cog className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">{tn("siteName")}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider">{tn("technicalTraining")}</div>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6">{tf("desc")}</p>
            <div className="flex items-center gap-2">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-md border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/20 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Institute */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/30 mb-5">{tf("institute")}</h4>
            <ul className="space-y-3">
              {[
                { label: tn("about"),    href: "/about" },
                { label: tn("programs"), href: "/programs" },
                { label: tn("teachers"), href: "/teachers" },
                { label: tn("events"),   href: "/events" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {l.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admissions */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/30 mb-5">{tf("admissions")}</h4>
            <ul className="space-y-3">
              {[
                { label: tf("applyNow"), href: "/apply" },
                { label: tf("fees"),     href: "/fees" },
                { label: tf("faq"),      href: "/faq" },
                { label: tf("policies"), href: "/policies" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/50 hover:text-white transition-colors inline-flex items-center gap-1 group">
                    {l.label}
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider text-white/30 mb-5">{tf("contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/50">Assiut Industrial Zone<br/>New Assiut City, Egypt</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-sm text-white/50" dir="ltr">+20 88 214 5555</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                <span className="text-sm text-white/50">info@assiutmetals.edu.eg</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} {tn("siteName")}. {tf("rights")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/policies" className="text-xs text-white/30 hover:text-white/60 transition-colors">{tf("privacyPolicy")}</Link>
            <Link href="/policies" className="text-xs text-white/30 hover:text-white/60 transition-colors">{tf("termsOfService")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
      <PublicNavbar />
      <main className="flex-1 pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
