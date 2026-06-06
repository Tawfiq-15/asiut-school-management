import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // "standalone" is a build-time option (used by Docker).
  // Set via env so it does NOT interfere with `next dev`.
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" } : {}),

  // Production hardening / performance.
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8080" },
      { protocol: "https", hostname: "**" },
    ],
  },

  // Strict security headers applied to every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
