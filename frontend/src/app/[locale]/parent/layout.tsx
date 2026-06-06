"use client";
import { AuthGuard } from "@/components/AuthGuard";
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["parent"]}>{children}</AuthGuard>;
}
