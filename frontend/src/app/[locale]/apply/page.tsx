"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/routing";
import { School, User, Mail, Phone, Calendar, BookOpen, Building2, UserCircle, CheckCircle2, AlertCircle, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ApplyPage() {
  const t = useTranslations("Apply");
  const tn = useTranslations("Nav");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    api.get("/public/grades").then((r: any) => setGrades(r.data?.data ?? r.data?.records ?? r.data ?? [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const dobVal = formData.get("date_of_birth") as string;
    const data = {
      student_name: `${formData.get("first_name")} ${formData.get("last_name")}`.trim(),
      date_of_birth: dobVal ? `${dobVal}T00:00:00Z` : null,
      gender: formData.get("gender"),
      applying_grade: formData.get("program"),
      parent_name: formData.get("guardian_name"),
      parent_email: formData.get("email"),
      parent_phone: formData.get("guardian_phone"),
      previous_school: formData.get("previous_school"),
      address: "",
    };

    try {
      await api.post("/public/admissions", data);
      setSubmitted(true);
      toast.success(t("success"));
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error || t("error");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full card p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold dark:text-[var(--color-dark-text)] mb-2">{t("success")}</h1>
          <p className="text-[var(--color-text-muted)] mb-8">{t("successDesc")}</p>
          <Link href="/" className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> {t("backToHome")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-800)] flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold dark:text-[var(--color-dark-text)]">{tn("siteName")}</span>
          </div>
        </div>

        <div className="card p-8 sm:p-10">
          <div className="mb-10">
            <h1 className="text-3xl font-bold dark:text-[var(--color-dark-text)]">{t("title")}</h1>
            <p className="text-[var(--color-text-muted)] mt-2">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <UserCircle className="w-5 h-5 text-[var(--color-primary-600)]" />
                <h2 className="font-semibold dark:text-[var(--color-dark-text)]">{t("personalInfo")}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("firstName")}</label>
                  <div className="relative">
                    <User className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="first_name" required className="form-input ltr:pl-10 rtl:pr-10" placeholder={t("firstName")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("lastName")}</label>
                  <div className="relative">
                    <User className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="last_name" required className="form-input ltr:pl-10 rtl:pr-10" placeholder={t("lastName")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("email")}</label>
                  <div className="relative">
                    <Mail className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="email" type="email" required className="form-input ltr:pl-10 rtl:pr-10" placeholder="you@school.com" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("phone")}</label>
                  <div className="relative">
                    <Phone className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="phone" required className="form-input ltr:pl-10 rtl:pr-10" placeholder="01xxxxxxxxx" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("gender")}</label>
                  <select name="gender" required className="form-input">
                    <option value="">{t("selectGender")}</option>
                    <option value="male">{t("male")}</option>
                    <option value="female">{t("female")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("dateOfBirth")}</label>
                  <div className="relative">
                    <Calendar className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="date_of_birth" type="date" required className="form-input ltr:pl-10 rtl:pr-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <BookOpen className="w-5 h-5 text-[var(--color-primary-600)]" />
                <h2 className="font-semibold dark:text-[var(--color-dark-text)]">{t("programInfo")}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("program")}</label>
                  <select name="program" required className="form-input">
                    <option value="">{t("selectProgram")}</option>
                    {grades.length > 0
                      ? grades.map((g: any) => (
                          <option key={g.id} value={g.name + (g.section ? `-${g.section}` : "")}>
                            {g.name}{g.section ? ` - ${g.section}` : ""}
                          </option>
                        ))
                      : <>
                          <option value="software_eng">{t("softwareEng")}</option>
                          <option value="network_admin">{t("networkAdmin")}</option>
                          <option value="cyber_security">{t("cyberSecurity")}</option>
                          <option value="civil_eng">{t("civilEng")}</option>
                          <option value="electrical_eng">{t("electricalEng")}</option>
                        </>
                    }
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("prevSchool")}</label>
                  <div className="relative">
                    <Building2 className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="previous_school" required className="form-input ltr:pl-10 rtl:pr-10" placeholder={t("prevSchool")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Info */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <Shield className="w-5 h-5 text-[var(--color-primary-600)]" />
                <h2 className="font-semibold dark:text-[var(--color-dark-text)]">{t("guardianInfo")}</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("guardianName")}</label>
                  <div className="relative">
                    <User className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="guardian_name" required className="form-input ltr:pl-10 rtl:pr-10" placeholder={t("guardianName")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium dark:text-[var(--color-dark-text)]">{t("guardianPhone")}</label>
                  <div className="relative">
                    <Phone className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input name="guardian_phone" required className="form-input ltr:pl-10 rtl:pr-10" placeholder="01xxxxxxxxx" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {t("submit")}
              </button>
              <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
                {t("termsText")}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
