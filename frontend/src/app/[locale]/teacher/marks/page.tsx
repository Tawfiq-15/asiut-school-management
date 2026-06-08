"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader } from "@/components/ui";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

export default function TeacherMarksPage() {
  const t = useTranslations("T");
  const qc = useQueryClient();

  const [subjectId, setSubjectId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [marks, setMarks] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 1. Fetch Teacher's Subjects
  const { data: subjectsData, isLoading: sLoading } = useQuery({
    queryKey: ["teacher-subjects"],
    queryFn: () => api.get("/teacher/subjects").then((r: any) => r.data?.data ?? r.data ?? []),
  });
  const subjects = subjectsData || [];

  // 2. Fetch Students for selected Subject/Grade
  const selectedSubject = subjects.find((s: any) => s.id === subjectId);
  const gradeId = selectedSubject?.grade_id;

  const { data: studentsData, isLoading: stLoading } = useQuery({
    queryKey: ["grade-students", gradeId],
    queryFn: () => api.get(`/teacher/students?grade_id=${gradeId}`).then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
    enabled: !!gradeId,
  });
  const students = studentsData || [];

  // 3. Fetch Existing Marks
  const { data: marksData, isLoading: mLoading } = useQuery({
    queryKey: ["teacher-marks", subjectId, month],
    queryFn: () => api.get("/teacher/marks", { params: { subject_id: subjectId, month } }).then((r: any) => r.data?.data ?? r.data ?? []),
    enabled: !!subjectId && !!month,
  });

  // Pre-fill state when marks arrive
  useEffect(() => {
    if (marksData) {
      const initial: Record<string, any> = {};
      const marksList = Array.isArray(marksData) ? marksData : (marksData?.data ?? marksData?.records ?? []);
      students.forEach((student: any) => {
        const existing = marksList.find((m: any) => m.student_id === student.id);
        initial[student.id] = existing ? {
          activity: existing.activity ?? 0,
          behavior: existing.behavior ?? 0,
          project: existing.project ?? 0,
          midterm: existing.midterm ?? 0,
          final: existing.final ?? 0,
          attendance: existing.attendance ?? 0,
          practical: existing.practical ?? 0,
        } : {
          activity: 0, behavior: 0, project: 0, midterm: 0, final: 0, attendance: 0, practical: 0
        };
      });
      setMarks(initial);
      setIsDirty(false);
    }
  }, [marksData, students]);

  // Warn user if they try to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleMarkChange = (studentId: string, field: string, val: string) => {
    let v: number | string = val;
    if (val !== "") {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        if (num < 0 || num > 100) {
          toast.error("Marks must be between 0 and 100");
          return;
        }
        v = num;
      }
    }
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: v },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = students.map((s: any) => ({
      student_id: s.id,
      subject_id: subjectId,
      month,
      activity: parseFloat(marks[s.id]?.activity) || 0,
      behavior: parseFloat(marks[s.id]?.behavior) || 0,
      project: parseFloat(marks[s.id]?.project) || 0,
      midterm: parseFloat(marks[s.id]?.midterm) || 0,
      final: parseFloat(marks[s.id]?.final) || 0,
      attendance: parseFloat(marks[s.id]?.attendance) || 0,
      practical: parseFloat(marks[s.id]?.practical) || 0,
    }));

    // Verify sum does not exceed 100 for any student
    for (const item of payload) {
      const total = item.activity + item.behavior + item.project + item.midterm + item.final + item.attendance + item.practical;
      if (total > 100) {
        const student = students.find((s: any) => s.id === item.student_id);
        const name = student ? `${student.user?.first_name} ${student.user?.last_name}` : "Student";
        toast.error(`Total marks for ${name} cannot exceed 100 (current: ${total})`);
        setIsSaving(false);
        return;
      }
    }

    try {
      await api.post("/teacher/marks", { marks: payload });
      toast.success(t("marksSaved"));
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["teacher-marks", subjectId, month] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save marks");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!students || students.length === 0) return toast.error("No data to export");

    // Load xlsx on demand — it's a heavy library, so keep it out of the route's
    // initial bundle / compile graph until the user actually exports.
    const XLSX = await import("xlsx");

    const exportData = students.map((s: any) => {
      const m = marks[s.id] || {};
      const act = parseFloat(m.activity) || 0;
      const beh = parseFloat(m.behavior) || 0;
      const prj = parseFloat(m.project) || 0;
      const mid = parseFloat(m.midterm) || 0;
      const fin = parseFloat(m.final) || 0;
      const att = parseFloat(m.attendance) || 0;
      const prc = parseFloat(m.practical) || 0;
      const total = act + beh + prj + mid + fin + att + prc;
      return {
        "Student Name": `${s.user?.first_name} ${s.user?.last_name}`,
        "Admission No": s.admission_no,
        "Activity": act,
        "Behavior": beh,
        "Project": prj,
        "Midterm": mid,
        "Final": fin,
        "Attendance": att,
        "Practical": prc,
        "Total (100)": total
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marks");
    
    // Generate filename
    const filename = `Marks_${selectedSubject?.name || "Subject"}_${month}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const isLoading = sLoading || stLoading || mLoading;

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t("marks")} 
        subtitle={t("marksSubtitle")} 
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} disabled={!students.length} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> {t("exportExcel")}
            </button>
            <button onClick={handleSave} disabled={isSaving || !students.length} className="btn-primary flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("saveMarks")}
            </button>
          </div>
        }
      />

      <div className="card p-4 mb-6 flex gap-4 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t("selectSubject")}</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="form-input bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500"
            disabled={sLoading}
          >
            <option value="" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-[var(--color-dark-text)]">
              {t("selectSubject")}
            </option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-[var(--color-dark-text)]">
                {s.name} - {s.grade?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">{t("selectMonth")}</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="form-input bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
      ) : subjectId && students.length === 0 ? (
        <div className="text-center p-12 text-zinc-500">{t("noStudents")}</div>
      ) : subjectId && students.length > 0 ? (
        <div className="card overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4">{t("student")}</th>
                  <th className="p-4 w-24">{t("activity")}</th>
                  <th className="p-4 w-24">{t("behavior")}</th>
                  <th className="p-4 w-24">{t("project")}</th>
                  <th className="p-4 w-24">{t("midterm")}</th>
                  <th className="p-4 w-24">{t("final")}</th>
                  <th className="p-4 w-24">{t("attendance")}</th>
                  <th className="p-4 w-24">{t("practical")}</th>
                  <th className="p-4 w-24 text-center">{t("total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {students.map((student: any) => {
                  const m = marks[student.id] || {};
                  const total = (parseFloat(m.activity) || 0) + (parseFloat(m.behavior) || 0) + (parseFloat(m.project) || 0) + (parseFloat(m.midterm) || 0) + (parseFloat(m.final) || 0) + (parseFloat(m.attendance) || 0) + (parseFloat(m.practical) || 0);
                  
                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{student.user?.first_name} {student.user?.last_name}</div>
                        <div className="text-xs text-zinc-500">{student.admission_no}</div>
                      </td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.activity ?? ""} onChange={(e) => handleMarkChange(student.id, "activity", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.behavior ?? ""} onChange={(e) => handleMarkChange(student.id, "behavior", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.project ?? ""} onChange={(e) => handleMarkChange(student.id, "project", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.midterm ?? ""} onChange={(e) => handleMarkChange(student.id, "midterm", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.final ?? ""} onChange={(e) => handleMarkChange(student.id, "final", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.attendance ?? ""} onChange={(e) => handleMarkChange(student.id, "attendance", e.target.value)} /></td>
                      <td className="p-4"><input type="number" min="0" max="100" className="form-input py-1 px-2 text-center text-sm font-mono bg-white dark:bg-zinc-950 dark:text-[var(--color-dark-text)] border-zinc-200 dark:border-zinc-800 focus:ring-primary-500" value={m.practical ?? ""} onChange={(e) => handleMarkChange(student.id, "practical", e.target.value)} /></td>
                      <td className="p-4">
                        <div className={`text-center font-bold text-sm px-2 py-1 rounded-lg ${total === 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : total > 100 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                          {total.toFixed(1)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
