import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "primary" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-muted/20 text-muted",
    success: "bg-success/20 text-success",
    error: "bg-error/20 text-error",
    warning: "bg-warning/20 text-warning",
    primary: "bg-primary/20 text-primary",
    purple: "bg-purple-500/20 text-purple-400",
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
