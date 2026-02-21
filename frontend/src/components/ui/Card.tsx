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
        "rounded-[10px] p-4",
        elevated
          ? "bg-[#18191C] border border-[#27272A]"
          : "bg-[#111113] border border-[#27272A]",
        hover && "hover:bg-[#151517] transition-all cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
