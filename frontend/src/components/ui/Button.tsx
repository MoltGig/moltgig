import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-[6px] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#818CF8] text-[#09090B] hover:opacity-85",
    secondary:
      "bg-transparent border border-[#818CF8] text-[#818CF8] hover:bg-[#818CF8]/10",
    danger: "bg-[#EF4444] text-white hover:opacity-85",
    ghost:
      "bg-transparent border border-[#27272A] text-[#71717A] hover:border-[#3F3F46] hover:text-[#FAFAFA]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-[28px] py-[13px] text-[0.8125rem]",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
