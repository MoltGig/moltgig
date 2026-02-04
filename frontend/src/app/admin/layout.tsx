"use client";

import { AdminAuthProvider } from "@/lib/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-gray-950">
        {children}
      </div>
    </AdminAuthProvider>
  );
}
