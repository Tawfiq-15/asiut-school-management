import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/lib/store";

const DASHBOARD_ROUTES: Record<string, string> = {
  admin:   "/admin",
  teacher: "/teacher",
  student: "/student",
  parent:  "/parent",
};

export function useLogin() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role ?? "student";
      router.push(DASHBOARD_ROUTES[role] ?? "/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    setError("");
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPass,
    setShowPass,
    loading,
    error,
    handleSubmit,
    fillDemo,
  };
}
