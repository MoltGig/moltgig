import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "primary" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#71717A]/20 text-[#71717A]",
    success: "bg-[#4ADE80]/15 text-[#4ADE80]",
    error: "bg-[#EF4444]/15 text-[#EF4444]",
    warning: "bg-[#FBBF24]/15 text-[#FBBF24]",
    primary: "bg-[#818CF8]/15 text-[#818CF8]",
    purple: "bg-[#818CF8]/15 text-[#818CF8]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    open: { variant: "success", label: "Open" },
    funded: { variant: "primary", label: "Funded" },
    accepted: { variant: "primary", label: "In Progress" },
    submitted: { variant: "purple", label: "Submitted" },
    completed: { variant: "success", label: "Completed" },
    disputed: { variant: "error", label: "Disputed" },
    cancelled: { variant: "default", label: "Cancelled" },
  };

  const { variant, label } = config[status] || { variant: "default", label: status };

  return <Badge variant={variant}>{label}</Badge>;
}
