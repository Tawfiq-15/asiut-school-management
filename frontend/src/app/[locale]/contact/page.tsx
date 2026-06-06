"use client";

import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import {
  Mail, Phone, MapPin, Send, Clock,
  Loader2, CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/FadeIn";

export default function ContactPage() {
  const t = useTranslations("Contact");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const contactInfo = [
    { icon: Mail, label: t("email"), value: "info@assiutmetals.edu.eg", sub: t("emailSub") },
    { icon: Phone, label: t("telephone"), value: "+20 88 234 5678", sub: t("telephoneSub") },
    { icon: MapPin, label: t("address"), value: t("addressSub"), sub: "" },
    { icon: Clock, label: t("officeHours"), value: t("officeHoursSub"), sub: "" },
  ];

  const departments = [
    { name: t("deptGeneral"), email: "info@assiutmetals.edu.eg", ext: "100" },
    { name: t("deptAdmissions"), email: "admissions@assiutmetals.edu.eg", ext: "200" },
    { name: t("deptStudents"), email: "students@assiutmetals.edu.eg", ext: "300" },
    { name: t("deptHR"), email: "hr@assiutmetals.edu.eg", ext: "400" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      await api.post("/public/contact", data);
      setStatus("sent");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] mb-3">{t("heroTag")}</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] leading-tight mb-4">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] leading-relaxed">
              {t("heroDesc")}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-10 bg-[var(--color-surface-2)] dark:bg-[var(--color-dark-surface-2)] border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((c, i) => (
              <div key={i} className="card p-5 card-hover">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center mb-3">
                  <c.icon className="w-5 h-5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1">{c.label}</div>
                <div className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{c.value}</div>
                {c.sub && <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1">{c.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Departments */}
      <section className="py-16 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{t("sendTitle")}</h2>
              <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8">{t("sendSubtitle")}</p>

              {status === "sent" ? (
                <div className="card p-8 text-center border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-10 h-10 text-[var(--color-success-500)] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{t("successTitle")}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{t("successDesc")}</p>
                  <button onClick={() => setStatus("idle")} className="btn-secondary mt-6 text-sm">{t("sendAnother")}</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("fullName")} <span className="text-red-500">*</span></label>
                      <input name="name" required className="form-input" placeholder={t("fullNamePlaceholder")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("emailLabel")} <span className="text-red-500">*</span></label>
                      <input name="email" type="email" required className="form-input" placeholder="your@email.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("subject")} <span className="text-red-500">*</span></label>
                    <select name="subject" required className="form-input">
                      <option value="">{t("selectSubject")}</option>
                      <option value="General Inquiry">{t("subjectGeneral")}</option>
                      <option value="Admissions">{t("subjectAdmissions")}</option>
                      <option value="Technical Support">{t("subjectSupport")}</option>
                      <option value="Feedback">{t("subjectFeedback")}</option>
                      <option value="Partnership">{t("subjectPartnership")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("message")} <span className="text-red-500">*</span></label>
                    <textarea name="message" required rows={6} className="form-input resize-none" placeholder={t("messagePlaceholder")} />
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-600 dark:text-red-400">{t("errorMsg")}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {status === "sending" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {t("sending")}</>
                    ) : (
                      <><Send className="w-4 h-4" /> {t("submit")}</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Department Directory */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)] mb-2">{t("directoryTitle")}</h2>
              <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-8">{t("directoryDesc")}</p>

              <div className="space-y-3">
                {departments.map((d, i) => (
                  <div key={i} className="card p-4 card-hover">
                    <h3 className="font-semibold text-sm text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{d.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                      <Mail className="w-3.5 h-3.5" /> {d.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                      <Phone className="w-3.5 h-3.5" /> {t("ext")} {d.ext}
                    </div>
                  </div>
                ))}
              </div>

              {/* Campus Location */}
              <div className="mt-6 overflow-hidden card">
                <iframe
                  title={t("locationTitle")}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3564.5!2d31.1783!3d27.1809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDEwJzUxLjIiTiAzMcKwMTAnNDEuOSJF!5e0!3m2!1sen!2seg!4v1700000000000"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale opacity-70 dark:opacity-50"
                />
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{t("locationTitle")}</p>
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-1 whitespace-pre-line">{t("locationAddress")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
