"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Clock, CheckCircle2, XCircle, Eye, MessageSquare, Send, X, Smartphone, Mail, FileText, User } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader, DataTable } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations, useLocale } from "next-intl";

export default function AdminAdmissionsPage() {
  const t = useTranslations("AdmissionsAdmin");
  const locale = useLocale();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modal States
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [selectedCommApplicant, setSelectedCommApplicant] = useState<any>(null);
  
  // Communication States
  const [commType, setCommType] = useState<"whatsapp"|"email">("whatsapp");
  const [commTemplate, setCommTemplate] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commMessage, setCommMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Enrollment States
  const [enrollResult, setEnrollResult] = useState<{
    email: string;
    temp_password: string;
    whatsapp_url?: string;
    email_sent: boolean;
  } | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admissions", statusFilter],
    queryFn: () => api.get("/admin/admissions", { params: { status: statusFilter, page_size: 30 } }).then((r: any) => r.data),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/admissions/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ["admissions"] });
      qc.invalidateQueries({ queryKey: ["pendingAdmissionsCount"] });

      if (status === "approved") {
        // Immediately enroll so the student appears in the students section
        setIsEnrolling(true);
        try {
          const res = await api.post(`/admin/admissions/${id}/enroll`);
          qc.invalidateQueries({ queryKey: ["admissions"] });
          qc.invalidateQueries({ queryKey: ["students"] });
          setEnrollResult(res.data);
          if (selectedApplicant?.id === id) setSelectedApplicant({ ...selectedApplicant, status: "enrolled" });
          toast.success(res.data.email_sent
            ? "Student enrolled — credentials emailed to parent."
            : "Student enrolled — share credentials with parent manually.");
        } catch (e: any) {
          toast.error(e.response?.data?.error || "Approved but failed to create account. Try enrolling manually.");
        } finally {
          setIsEnrolling(false);
        }
      } else {
        toast.success(t("successUpdate", { status: t(status) }));
        if (selectedApplicant?.id === id) setSelectedApplicant({ ...selectedApplicant, status });
      }
    } catch {
      toast.error(t("failUpdate"));
    }
  };

  const handleCommunicate = async () => {
    if (!commMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await api.post(`/admin/admissions/${selectedCommApplicant.id}/communicate`, {
        type: commType,
        subject: commSubject || "Message from School",
        message: commMessage,
      });

      const result = res.data?.data;

      if (result?.channel === "whatsapp" && result?.whatsapp_url) {
        // Open WhatsApp Web / WhatsApp app pre-filled with the message.
        window.open(result.whatsapp_url, "_blank", "noopener,noreferrer");
        toast.success("WhatsApp opened — message is pre-filled and ready to send.");
      } else {
        toast.success(t("messageSent") || "Email sent successfully.");
      }

      setSelectedCommApplicant(null);
      setCommMessage("");
      setCommSubject("");
      setCommTemplate("");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to send message. Check SMTP settings.");
    } finally {
      setIsSending(false);
    }
  };


  const handleTemplateChange = (val: string) => {
    setCommTemplate(val);
    const name = selectedCommApplicant?.parent_name || "";
    const student = selectedCommApplicant?.student_name || "";
    
    if (val === "welcome") {
      setCommSubject(t("welcomeTemplate") || "Welcome & Account Setup");
      if (locale === "ar") {
        setCommMessage(`أهلاً بك ${name}! يسعدنا إخبارك بأنه تمت الموافقة على طلب التحاق الطالب ${student}!\nيُرجى استكمال تسجيل حسابكم عبر الرابط التالي: http://localhost:3000/register?email=${selectedCommApplicant?.parent_email}&name=${name}`);
      } else {
        setCommMessage(`Hello ${name}! We are thrilled to inform you that your admission application for ${student} has been APPROVED!\nPlease continue your child's registration by completing the profile at http://localhost:3000/register?email=${selectedCommApplicant?.parent_email}&name=${name}`);
      }
    } else if (val === "docs") {
      setCommSubject(t("docsTemplate") || "Missing Documents Request");
      if (locale === "ar") {
        setCommMessage(`السيد/ة ${name}،\nنقوم حالياً بمراجعة طلب التحاق ${student}. يُرجى تزويدنا بشهادات المدرسة السابقة والسجلات الطبية الرسمية لنتمكن من استكمال إجراءات القبول.\nشكراً لك!`);
      } else {
        setCommMessage(`Dear ${name},\nWe are currently reviewing the application for ${student}. Please provide the official previous school transcripts and medical records so we can proceed with the admission.\nThank you!`);
      }
    } else if (val === "interview") {
      setCommSubject(t("interviewTemplate") || "Schedule Admission Interview");
      if (locale === "ar") {
        setCommMessage(`السيد/ة ${name}،\nندعوك و ${student} لإجراء مقابلة شخصية عائلية في حرم المدرسة. يُرجى الاتصال بنا على 01012345678 لحجز موعد مناسب لكم.\nمع تحيات مكتب القبول`);
      } else {
        setCommMessage(`Dear ${name},\nWe invite you and ${student} for a family interview at the school campus. Please call us at 01012345678 to book your convenient slot.\nRegards, Admissions Office`);
      }
    } else if (val === "fees") {
      setCommSubject(t("feesTemplate") || "Admission Approved - Fees & Documentation");
      if (locale === "ar") {
        setCommMessage(`أهلاً بك ${name}!\nيسعدنا إخبارك بأنه تمت الموافقة على طلب التحاق الطالب ${student}!\n\nيُرجى زيارة مقر المدرسة خلال الثلاثة أيام القادمة لتقديم المستندات والأوراق الرسمية ودفع رسوم التسجيل في قسم الحسابات لضمان حجز مقعدكم.\n\nشكراً لكم،\nمكتب القبول والتسجيل`);
      } else {
        setCommMessage(`Hello ${name}!\nWe are thrilled to inform you that your admission application for ${student} has been APPROVED!\n\nPlease visit the school campus within the next 3 days to submit the official physical papers and pay the registration fees at the accounting office to secure your seat.\n\nThank you,\nSchool Admissions Office`);
      }
    } else {
      setCommSubject("");
      setCommMessage("");
    }
  };

  const columns = [
    { key: "student", label: t("applicant"), render: (r: any) => (
      <div>
        <div className="font-medium dark:text-[var(--color-dark-text)]">{r.student_name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{t("grade")}: {r.applying_grade ?? "TBD"}</div>
      </div>
    )},
    { key: "parent", label: t("parent"), render: (r: any) => (
      <div>
        <div className="text-sm dark:text-[var(--color-dark-text)]">{r.parent_name}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{r.parent_email}</div>
      </div>
    )},
    { key: "applied_at", label: t("applied"), render: (r: any) => formatDate(r.applied_at) },
    { key: "status", label: t("status"), render: (r: any) => {
      const map: Record<string, string> = { pending: "badge-yellow", reviewing: "badge-blue", approved: "badge-green", rejected: "badge-red" };
      return <span className={`badge ${map[r.status]}`}>{t(r.status)}</span>;
    }},
    { key: "actions", label: t("actions"), render: (r: any) => (
      <div className="flex gap-2 items-center">
        <button onClick={() => setSelectedApplicant(r)} title={t("viewDetails")} className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => { setSelectedCommApplicant(r); setCommType("whatsapp"); handleTemplateChange(""); }} title={t("communicate")} className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors">
          <MessageSquare className="w-4 h-4" />
        </button>
        {(r.status === "pending" || r.status === "reviewing") && (
          <>
            <button onClick={() => updateStatus(r.id, "approved")} disabled={isEnrolling} title={t("approve") + " & Enroll"} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors">
              {isEnrolling ? <Clock className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
            </button>
            <button onClick={() => updateStatus(r.id, "rejected")} title={t("reject")} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"><XCircle className="w-4 h-4"/></button>
          </>
        )}
      </div>
    )},
  ];

  const records = data?.data ?? [];
  const filteredRecords = statusFilter 
    ? records.filter((r: any) => r.status === statusFilter) 
    : records;
  const counts = { 
    pending: records.filter((r: any) => r.status === "pending").length, 
    reviewing: records.filter((r: any) => r.status === "reviewing").length, 
    approved: records.filter((r: any) => r.status === "approved").length 
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { key: "pending", label: t("pending"), value: counts.pending, cls: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/40", icon: Clock },
          { key: "reviewing", label: t("reviewing"), value: counts.reviewing, cls: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-800/40", icon: UserCheck },
          { key: "approved", label: t("approved"), value: counts.approved, cls: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/40", icon: CheckCircle2 },
        ].map(s => (
          <div key={s.key} className={`card p-4 flex items-center gap-3 border ${s.cls} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setStatusFilter(s.key)}>
            <s.icon className="w-5 h-5" />
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs / Filters */}
      <div className="flex gap-3 mb-4">
        {["", "pending", "reviewing", "approved", "rejected"].map(s => (
          <button 
            key={s} 
            onClick={() => setStatusFilter(s)} 
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? "btn-primary" : "btn-secondary"}`}
          >
            {s === "" ? t("all") : t(s)}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <DataTable columns={columns} data={filteredRecords} loading={isLoading} emptyMessage={t("noApplications")} />
      </div>

      {/* ─── Details Modal ────────────────────────────────────────────────── */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xl font-bold flex items-center gap-2"><User className="w-5 h-5 text-indigo-500"/> {t("applicantDetails") || "Applicant Details"}</h3>
              <button onClick={() => setSelectedApplicant(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Profile */}
                <div className="card bg-zinc-50 dark:bg-zinc-800/30 border-0 p-5">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2"><UserCheck className="w-4 h-4"/> {t("personalInfo") || "Student Profile"}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-zinc-500">{t("applicant")}</div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedApplicant.student_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("grade")}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.applying_grade || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("dob") || "Date of Birth"}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.date_of_birth ? formatDate(selectedApplicant.date_of_birth) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("gender") || "Gender"}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.gender || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("prevSchool") || "Previous School"}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.previous_school || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Guardian Info */}
                <div className="card bg-zinc-50 dark:bg-zinc-800/30 border-0 p-5">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2"><Mail className="w-4 h-4"/> {t("guardianInfo") || "Guardian Information"}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-zinc-500">{t("parent")}</div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedApplicant.parent_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("email") || "Email"}</div>
                      <div className="font-medium text-indigo-600 dark:text-indigo-400">{selectedApplicant.parent_email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("phone") || "Phone"}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.parent_phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">{t("address") || "Address"}</div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{selectedApplicant.address || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">{t("status")}</div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      { pending: "badge-yellow", reviewing: "badge-blue", approved: "badge-green", rejected: "badge-red", enrolled: "badge-purple" }[selectedApplicant.status as string]
                    }`}>{t(selectedApplicant.status)}</span>
                    <span className="text-xs text-zinc-400">&bull; Applied {formatDate(selectedApplicant.applied_at)}</span>
                  </div>
                </div>
                
                {/* Actions Inside Modal */}
                <div className="flex gap-2">
                  {(selectedApplicant.status === "pending" || selectedApplicant.status === "reviewing") && (
                    <>
                      <button onClick={() => updateStatus(selectedApplicant.id, "approved")} disabled={isEnrolling} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm shadow-sm bg-green-600 hover:bg-green-700 text-white border-none">
                        {isEnrolling ? <Clock className="w-4 h-4 animate-spin"/> : <UserCheck className="w-4 h-4"/>}
                        {t("approve")} & Enroll
                      </button>
                      <button onClick={() => updateStatus(selectedApplicant.id, "rejected")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2">
                        <XCircle className="w-4 h-4"/> {t("reject")}
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelectedCommApplicant(selectedApplicant); setCommType("whatsapp"); handleTemplateChange(""); }} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                    <MessageSquare className="w-4 h-4"/> {t("communicate") || "Communicate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Communicate Modal ────────────────────────────────────────────── */}
      {selectedCommApplicant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {commType === "whatsapp" ? <Smartphone className="w-5 h-5 text-green-500" /> : <Mail className="w-5 h-5 text-blue-500" />}
                {t("communicate") || "Communicate"}
              </h3>
              <button onClick={() => setSelectedCommApplicant(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4">
              {/* Type Toggle */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-full">
                <button onClick={() => { setCommType("whatsapp"); handleTemplateChange(""); }} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${commType === "whatsapp" ? "bg-white dark:bg-zinc-700 shadow-sm text-green-600 dark:text-green-400" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}>
                  <Smartphone className="w-4 h-4"/> WhatsApp
                </button>
                <button onClick={() => { setCommType("email"); handleTemplateChange(""); }} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${commType === "email" ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}>
                  <Mail className="w-4 h-4"/> Email
                </button>
              </div>

              {/* Recipient Details */}
              <div className="text-sm bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                  {selectedCommApplicant.parent_name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{selectedCommApplicant.parent_name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {commType === "whatsapp" ? selectedCommApplicant.parent_phone || "No phone number" : selectedCommApplicant.parent_email}
                  </div>
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t("selectTemplate") || "Select Template"}</label>
                <select value={commTemplate} onChange={(e) => handleTemplateChange(e.target.value)} className="input-field w-full cursor-pointer">
                  <option value="">-- {t("customMessage") || "Custom Message"} --</option>
                  <option value="welcome">{t("welcomeTemplate") || "Welcome & Account Setup"}</option>
                  <option value="fees">{t("feesTemplate") || "Fees & Submit Papers"}</option>
                  <option value="docs">{t("docsTemplate") || "Missing Documents Request"}</option>
                  <option value="interview">{t("interviewTemplate") || "Schedule Admission Interview"}</option>
                </select>
              </div>

              {/* Email Subject */}
              {commType === "email" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{t("subject") || "Subject"}</label>
                  <input type="text" value={commSubject} onChange={e => setCommSubject(e.target.value)} className="input-field w-full" placeholder="Enter subject..." />
                </div>
              )}

              {/* Channel hint */}
              {commType === "whatsapp" ? (
                <div className="text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Smartphone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Clicking Send will open WhatsApp Web with this message pre-filled. You still need to press Send inside WhatsApp.
                </div>
              ) : (
                <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Email will be delivered immediately via the school SMTP server.
                </div>
              )}

              {/* Message Body */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {commType === "whatsapp" ? "WhatsApp Message" : "Email Body"}
                </label>
                <textarea
                  value={commMessage}
                  onChange={e => setCommMessage(e.target.value)}
                  className="input-field w-full min-h-[140px] resize-none"
                  placeholder={t("typeMessage") || "Type your message here..."}
                />
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setSelectedCommApplicant(null)} className="btn-secondary">{t("close") || "Close"}</button>
              <button onClick={handleCommunicate} disabled={isSending || !commMessage.trim()} className={`btn-primary flex items-center gap-2 ${commType === "whatsapp" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? (t("sending") || "Sending...") : (t("send") || "Send Message")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Account Created Modal ───────────────────────────────────────── */}
      {enrollResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                {t("accountGenerated") || "Account Created"}
              </h3>
              <button onClick={() => setEnrollResult(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {t("generatedEmail") || "Student Login Email"}
                </label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-mono text-sm border border-zinc-100 dark:border-zinc-800 select-all break-all">
                  {enrollResult.email}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Temporary Password
                </label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl font-mono text-sm border border-zinc-100 dark:border-zinc-800 select-all tracking-wider">
                  {enrollResult.temp_password}
                </div>
              </div>

              {/* Email status */}
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                enrollResult.email_sent
                  ? "bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/40 text-yellow-700 dark:text-yellow-400"
              }`}>
                <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {enrollResult.email_sent
                  ? "Credentials were emailed to the parent automatically."
                  : "Email delivery failed — share credentials manually via WhatsApp below."}
              </div>

              {/* Action buttons */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${enrollResult.email}\nPassword: ${enrollResult.temp_password}`
                  );
                  toast.success("Credentials copied to clipboard");
                }}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Copy Both Credentials
              </button>

              {enrollResult.whatsapp_url && (
                <button
                  onClick={() => window.open(enrollResult.whatsapp_url!, "_blank", "noopener,noreferrer")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <Smartphone className="w-4 h-4" /> Send via WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
