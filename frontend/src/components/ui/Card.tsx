import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  elevated?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, elevated, onClick }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-4",
        elevated
          ? "bg-surface-2 border border-border"
          : "bg-surface border border-border",
        hover && "hover:border-border-strong hover:bg-surface-hover transition-all cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
