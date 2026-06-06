"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare, Send, Search, Plus, Inbox, Clock,
  User, Loader2,
} from "lucide-react";
import { DashboardLayout, PageHeader } from "@/components/ui";
import { useRole } from "@/lib/store";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

interface Message {
  id: string;
  subject: string;
  content: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const t = useTranslations("P");
  const role = useRole() ?? "student";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({ to: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => api.get("/messages").then((r: any) => r.data?.data ?? r.data?.records ?? r.data ?? []),
  });

  const filtered = (messages as Message[]).filter(
    (m) => m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selected = filtered.find((m) => m.id === selectedId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/messages", newMessage);
      setComposing(false);
      setNewMessage({ to: "", subject: "", content: "" });
    } catch { /* handle error */ } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader title={t("messagesTitle")} subtitle={t("messagesSubtitle")}
        actions={<button onClick={() => setComposing(true)} className="btn-primary text-sm"><Plus className="w-4 h-4" /> {t("newMessage")}</button>}
      />
      <div className="card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <div className="flex h-full">
          {/* List */}
          <div className={cn("w-full md:w-80 lg:w-96 border-r border-[var(--color-border)] dark:border-[var(--color-dark-border)] flex flex-col", selectedId && "hidden md:flex")}>
            <div className="p-3 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              <div className="relative">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t("searchPlaceholder")} className="form-input ltr:pl-9 rtl:pr-9 text-sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <Inbox className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-40" />
                  <p className="text-sm text-[var(--color-text-muted)]">{t("noAnnouncements")}</p>
                </div>
              ) : filtered.map((msg) => (
                <button key={msg.id} onClick={() => setSelectedId(msg.id)} className={cn("w-full text-left p-4 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:bg-[var(--color-surface-2)] dark:hover:bg-[var(--color-dark-surface-3)] transition-colors", selectedId === msg.id && "bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)]/20")}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] flex items-center justify-center flex-shrink-0 text-xs font-bold text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">{msg.sender_name?.charAt(0) ?? "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn("text-sm truncate", !msg.is_read ? "font-bold dark:text-[var(--color-dark-text)]" : "font-medium text-[var(--color-text-muted)]")}>{msg.sender_name}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 ml-2">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={cn("text-xs truncate", !msg.is_read ? "text-[var(--color-text-base)] dark:text-[var(--color-dark-text)]" : "text-[var(--color-text-muted)]")}>{msg.subject}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Detail */}
          <div className={cn("flex-1 flex flex-col", !selectedId && !composing && "hidden md:flex")}>
            {composing ? (
              <div className="flex-1 p-6">
                <h2 className="text-lg font-bold dark:text-[var(--color-dark-text)] mb-6">{t("newMessage")}</h2>
                <form onSubmit={handleSend} className="space-y-4 max-w-xl">
                  <div><label className="text-sm font-medium dark:text-[var(--color-dark-text)] mb-1.5 block">{t("student")}</label><input type="email" value={newMessage.to} onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })} className="form-input" placeholder="recipient@assiutmetals.edu.eg" required /></div>
                  <div><label className="text-sm font-medium dark:text-[var(--color-dark-text)] mb-1.5 block">{t("title")}</label><input type="text" value={newMessage.subject} onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })} className="form-input" placeholder={t("title")} required /></div>
                  <div><label className="text-sm font-medium dark:text-[var(--color-dark-text)] mb-1.5 block">{t("description")}</label><textarea value={newMessage.content} onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })} className="form-input resize-none" rows={8} placeholder="..." required /></div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={sending} className="btn-primary text-sm">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{sending ? t("saving") : t("save")}</button>
                    <button type="button" onClick={() => setComposing(false)} className="btn-secondary text-sm">{t("deleteConfirm")}</button>
                  </div>
                </form>
              </div>
            ) : selected ? (
              <div className="flex-1 flex flex-col">
                <div className="p-5 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                  <button onClick={() => setSelectedId(null)} className="md:hidden text-sm text-[var(--color-primary-600)] mb-3">← {t("deleteConfirm")}</button>
                  <h2 className="text-lg font-bold dark:text-[var(--color-dark-text)]">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-[var(--color-text-muted)]"><User className="w-4 h-4" /><span>{selected.sender_name}</span><span>·</span><Clock className="w-3.5 h-3.5" /><span>{new Date(selected.created_at).toLocaleString()}</span></div>
                </div>
                <div className="flex-1 p-5"><p className="text-sm leading-relaxed dark:text-[var(--color-dark-text)] whitespace-pre-wrap">{selected.content}</p></div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4 opacity-20" /><p className="text-[var(--color-text-muted)]">{t("noAnnouncements")}</p></div></div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
