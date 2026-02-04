import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0052FF",
          dark: "#1E40AF",
          light: "#3B82F6",
        },
        "bg-deep": "#050506",
        background: "#0A0B0D",
        "bg-raised": "#111214",
        surface: "#18191C",
        "surface-2": "#1E1F23",
        "surface-hover": "#252629",
        "border-subtle": "#2A2B2F",
        border: "#3A3B40",
        "border-strong": "#4A4B52",
        success: "#10B981",
        error: "#EF4444",
        warning: "#F59E0B",
        amber: "#F59E0B",
        muted: "#6B7280",
        "muted-light": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
