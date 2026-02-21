import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: 1080, padding: "0 48px" }}
    >
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, label, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        {label && (
          <p
            className="mb-3"
            style={{
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#3F3F46",
            }}
          >
            {label}
          </p>
        )}
        <h1 className="font-semibold" style={{ fontSize: "1.35rem", letterSpacing: "-0.01em" }}>{title}</h1>
        {description && <p className="mt-1" style={{ fontSize: "0.875rem", color: "#71717A" }}>{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
