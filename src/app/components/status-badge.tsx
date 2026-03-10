import { cn } from "./ui/utils";

interface StatusBadgeProps {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'warning';
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const statusStyles = {
    idle: 'bg-muted text-muted-foreground',
    running: 'bg-accent text-accent-foreground',
    paused: 'bg-warning text-warning-foreground',
    completed: 'bg-success text-success-foreground',
    failed: 'bg-destructive text-destructive-foreground',
    warning: 'bg-warning text-warning-foreground',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {children}
    </span>
  );
}
