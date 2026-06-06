import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Throttle the global network-error toast so a burst of failed requests (e.g.
// a dashboard firing several queries while offline) shows a single message.
let lastNetworkToast = 0;
function notifyNetworkError() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastNetworkToast < 4000) return;
  lastNetworkToast = now;
  const isArabic = window.location.pathname.startsWith("/en") === false;
  toast.error(
    isArabic
      ? "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت."
      : "Could not reach the server. Check your internet connection."
  );
}

// Attach access token automatically.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Returns the login URL that preserves the user's current locale.
 *
 * Routing config: localePrefix = 'as-needed', defaultLocale = 'ar'
 *   • Arabic pages have NO locale prefix  → /auth/login
 *   • English pages have /en/ prefix      → /en/auth/login
 */
function localeAwareLoginPath(): string {
  if (typeof window === "undefined") return "/auth/login";
  // If the current path starts with /en, keep the English prefix.
  return window.location.pathname.startsWith("/en")
    ? "/en/auth/login"
    : "/auth/login";
}

// Auto-refresh on 401.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Surface a friendly message when the server is unreachable (offline,
    // DNS failure, timeout). These have no HTTP response.
    if (!error.response && (error.code === "ERR_NETWORK" || error.code === "ECONNABORTED")) {
      notifyNetworkError();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/auth/refresh`,
            { refresh_token: refreshToken }
          );
          localStorage.setItem("access_token", data.access_token);
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token);
          }
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          // Refresh failed — clear tokens and send user to login.
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = localeAwareLoginPath();
        }
      } else {
        // No refresh token at all.
        localStorage.removeItem("access_token");
        window.location.href = localeAwareLoginPath();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
