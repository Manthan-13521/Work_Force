import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="text-muted-foreground mb-4">
        {icon || <Inbox className="h-12 w-12 mx-auto" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
