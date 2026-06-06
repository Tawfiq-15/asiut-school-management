"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera, Eye, EyeOff, Lock, User, Phone, Mail,
  ShieldCheck, Calendar, Clock, CheckCircle2, AlertCircle,
  Pencil, X, Save, LogOut, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/ui";
import { getInitials } from "@/lib/utils";
import { useAuthStore, useUser } from "@/lib/store";
import api from "@/lib/api";

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)         s++;
  if (pw.length >= 12)        s++;
  if (/[A-Z]/.test(pw))      s++;
  if (/[0-9]/.test(pw))      s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Too short",   color: "bg-red-500"    },
    { label: "Weak",        color: "bg-orange-400"  },
    { label: "Fair",        color: "bg-yellow-400"  },
    { label: "Good",        color: "bg-blue-400"    },
    { label: "Strong",      color: "bg-green-500"   },
    { label: "Very strong", color: "bg-emerald-500" },
  ];
  return { score: s, ...levels[Math.min(s, 5)] };
}

// ─── Password input with show/hide ────────────────────────────────────────────

function PasswordInput({ label, value, onChange, autoComplete, required, minLength }: {
  label: string; value: string;
  onChange: (v: string) => void;
  autoComplete?: string; required?: boolean; minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="form-input pr-11"
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute inset-y-0 end-0 pe-3 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ url, initials }: { url?: string | null; initials: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post("/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Upload failed");
    } finally { setUploading(false); e.target.value = ""; }
  };

  return (
    <div className="relative inline-block">
      {url ? (
        <img src={url} alt="avatar" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-[var(--color-dark-surface-2)]" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] flex items-center justify-center text-white text-2xl font-bold select-none ring-4 ring-white dark:ring-[var(--color-dark-surface-2)]">
          {initials}
        </div>
      )}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1.5 -end-1.5 w-7 h-7 rounded-lg bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white flex items-center justify-center shadow-md transition-colors ring-2 ring-white dark:ring-[var(--color-dark-surface-2)]"
        title="Change photo"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={upload} />
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, action }: {
  icon: React.ElementType; title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]" />
        </div>
        <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] last:border-0">
      <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
        {value || <span className="text-[var(--color-text-muted)]">—</span>}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfilePage({ role }: { role: string }) {
  const storeUser = useUser();
  const { logout, setUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get("/me").then((r: any) => r.data),
    staleTime: 30_000,
  });

  useEffect(() => { if (me?.email) setUser(me); }, [me, setUser]);

  const user = me ?? storeUser;
  const initials = getInitials(user?.first_name ?? "?", user?.last_name ?? "?");

  // ── Edit profile ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name ?? "", last_name: user.last_name ?? "", phone: user.phone ?? "" });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await api.put("/me", form);
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "Failed"); }
    finally { setSaving(false); }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);
  const strength = getStrength(pw.next);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm)  { toast.error("Passwords do not match"); return; }
    if (pw.next.length < 8)     { toast.error("Password must be at least 8 characters"); return; }
    setChangingPw(true);
    try {
      await api.post("/me/change-password", { current_password: pw.current, new_password: pw.next });
      toast.success("Password changed successfully");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "Failed"); }
    finally { setChangingPw(false); }
  };

  if (isLoading && !storeUser) {
    return (
      <DashboardLayout role={role}>
        <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── Profile header card ──────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Blue accent bar */}
          <div className="h-24 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-800)]" />

          <div className="px-6 pb-6">
            {/* Avatar overlapping the bar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <Avatar url={user?.avatar_url} initials={initials} />
              <div className="flex gap-2 pb-1">
                {user?.is_active
                  ? <span className="badge badge-green">Active</span>
                  : <span className="badge badge-red">Suspended</span>}
                {user?.is_verified && <span className="badge badge-purple">Verified</span>}
                <span className="badge badge-blue capitalize">{user?.role}</span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">
              {user?.first_name} {user?.last_name}
            </h2>
            <div className="flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)]">
              Click the camera icon on your photo to update your profile picture (PNG, JPG, max 5 MB).
            </p>
          </div>
        </div>

        {/* ── Personal information ─────────────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader
            icon={User}
            title="Personal Information"
            action={
              !editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm py-1.5 px-3 gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              ) : null
            }
          />

          {!editing ? (
            <div>
              <InfoRow label="First Name" value={user?.first_name} />
              <InfoRow label="Last Name"  value={user?.last_name}  />
              <InfoRow label="Email"      value={user?.email}      />
              <InfoRow label="Phone"      value={user?.phone}      />
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1.5">
                    First Name *
                  </label>
                  <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="form-input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1.5">
                    Last Name *
                  </label>
                  <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="form-input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mb-1.5">
                  Phone Number
                </label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="+20 1XX XXX XXXX" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Change password ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={Lock} title="Change Password" />

          <form onSubmit={changePassword} className="space-y-4">
            <PasswordInput
              label="Current Password"
              value={pw.current}
              onChange={v => setPw(p => ({ ...p, current: v }))}
              autoComplete="current-password"
              required
            />

            <div>
              <PasswordInput
                label="New Password"
                value={pw.next}
                onChange={v => setPw(p => ({ ...p, next: v }))}
                autoComplete="new-password"
                required
                minLength={8}
              />
              {pw.next && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-[var(--color-border)] dark:bg-[var(--color-dark-border)]"}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-yellow-500" : strength.score <= 3 ? "text-blue-500" : "text-green-600"}`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <PasswordInput
                label="Confirm New Password"
                value={pw.confirm}
                onChange={v => setPw(p => ({ ...p, confirm: v }))}
                autoComplete="new-password"
                required
              />
              {pw.confirm && (
                <p className={`mt-1.5 text-xs flex items-center gap-1 ${pw.next === pw.confirm ? "text-green-600" : "text-red-500"}`}>
                  {pw.next === pw.confirm
                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</>
                    : <><AlertCircle className="w-3.5 h-3.5" /> Passwords do not match</>}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={changingPw || !pw.current || !pw.next || pw.next !== pw.confirm}
              className="btn-primary gap-2 w-full justify-center"
            >
              {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {changingPw ? "Changing Password…" : "Change Password"}
            </button>
          </form>
        </div>

        {/* ── Account information ──────────────────────────────────────────── */}
        <div className="card p-6">
          <SectionHeader icon={ShieldCheck} title="Account Information" />
          <div>
            <InfoRow
              label="Account Created"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : undefined}
            />
            <InfoRow
              label="Last Login"
              value={user?.last_login ? new Date(user.last_login).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not recorded"}
            />
            <InfoRow label="Role"   value={user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) ?? "")} />
            <InfoRow label="Status" value={user?.is_active ? "Active" : "Suspended"} />
          </div>
        </div>

        {/* ── Sign out ─────────────────────────────────────────────────────── */}
        <div className="card p-6 border-red-200 dark:border-red-900/40" style={{ borderColor: "rgb(254 202 202 / 1)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]">Sign Out</h3>
              <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-muted)] mt-0.5">
                You will be logged out and redirected to the login page.
              </p>
            </div>
            <button
              onClick={() => { logout(); window.location.href = "/auth/login"; }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
