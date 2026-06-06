import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

export type Role = "admin" | "teacher" | "student" | "parent";

export interface User {
  id: string;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  must_change_password?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        set({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Best-effort server-side revocation of the refresh token. We clear
        // local state regardless of the result so logout always feels instant
        // and works offline.
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          api.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {});
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setUser: (user: User) => set({ user }),
    }),
    { name: "auth-store", partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

// Convenience selectors
export const useUser = () => useAuthStore((s) => s.user);
export const useRole = () => useAuthStore((s) => s.user?.role);
export const useIsAuth = () => useAuthStore((s) => s.isAuthenticated);
