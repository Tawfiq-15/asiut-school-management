"use client";
import { AuthGuard } from "@/components/AuthGuard";
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["student"]}>{children}</AuthGuard>;
}
