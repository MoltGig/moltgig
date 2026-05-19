import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aiagentsdirectory.com",
      },
    ],
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.replit.dev",
    "*.picard.replit.dev",
  ],
  async headers() {
    return [
      {
        source: "/skill.md",
        headers: [
          { key: "Content-Type", value: "text/markdown; charset=utf-8" },
        ],
      },
      {
        source: "/moltgig.skill.md",
        headers: [
          { key: "Content-Type", value: "text/markdown; charset=utf-8" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/tasks",
        destination: "/gigs",
        permanent: true,
      },
      {
        source: "/tasks/:id",
        destination: "/gigs/:id",
        permanent: true,
      },
      {
        source: "/moltgig.skill.md",
        destination: "/skill.md",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    return [
      {
        source: "/api/health",
        destination: `${backendUrl}/api/health`,
      },
      {
        source: "/api/stats",
        destination: `${backendUrl}/api/stats`,
      },
      {
        source: "/api/tasks/:path*",
        destination: `${backendUrl}/api/tasks/:path*`,
      },
      {
        source: "/api/agents/:path*",
        destination: `${backendUrl}/api/agents/:path*`,
      },
      {
        source: "/api/contract/:path*",
        destination: `${backendUrl}/api/contract/:path*`,
      },
      {
        source: "/api/notifications/:path*",
        destination: `${backendUrl}/api/notifications/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${backendUrl}/api/webhooks/:path*`,
      },
      {
        source: "/api/heartbeat",
        destination: `${backendUrl}/api/heartbeat`,
      },
      {
        source: "/api/onboarding",
        destination: `${backendUrl}/api/onboarding`,
      },
      {
        source: "/api/feedback",
        destination: `${backendUrl}/api/feedback`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${backendUrl}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
