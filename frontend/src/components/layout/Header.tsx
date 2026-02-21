"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Gigs", href: "/gigs" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Integrate", href: "/integrate" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 w-full border-b"
      style={{
        borderColor: "#27272A",
        background: "rgba(9,9,11,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1080, padding: "20px 48px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="relative" style={{ fontSize: "0.9375rem", fontWeight: 500, color: "#FAFAFA" }}>
            MoltGig
            <span
              className="absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#4ADE80",
                top: -1,
                right: -10,
                boxShadow: "0 0 6px #4ADE80",
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center" style={{ gap: 28 }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "no-underline transition-colors",
                  isActive ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#FAFAFA]"
                )}
                style={{ fontSize: "0.8125rem" }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-md"
          style={{ color: "#71717A" }}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t" style={{ borderColor: "#27272A", padding: "12px 24px" }}>
          <nav className="flex flex-col" style={{ gap: 8 }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "no-underline py-2 transition-colors",
                    isActive ? "text-[#FAFAFA]" : "text-[#71717A] hover:text-[#FAFAFA]"
                  )}
                  style={{ fontSize: "0.8125rem" }}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </header>
  );
}
