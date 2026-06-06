"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // 5 minutes
            gcTime: 10 * 60 * 1000,          // 10 minutes garbage collection
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            // Retry transient failures, but never client errors (4xx) — those
            // won't succeed on retry and just delay the error state.
            retry: (failureCount, error: unknown) => {
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
