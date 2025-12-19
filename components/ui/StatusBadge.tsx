import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const statusVariants = cva(
  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-tech font-medium transition-all duration-300",
  {
    variants: {
      status: {
        online: "bg-success-500/20 text-success-400 border border-success-500/30",
        offline: "bg-danger-500/20 text-danger-400 border border-danger-500/30",
        warning: "bg-warning-500/20 text-warning-400 border border-warning-500/30",
        idle: "bg-muted/20 text-muted border border-muted/30",
      },
    },
    defaultVariants: {
      status: "online",
    },
  }
);

export interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  className?: string;
  children?: React.ReactNode;
  showIndicator?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  children,
  showIndicator = true,
  ...props
}) => {
  return (
    <div className={cn(statusVariants({ status }), className)} {...props}>
      {showIndicator && (
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse-glow",
          status === "online" && "bg-success-400",
          status === "offline" && "bg-danger-400", 
          status === "warning" && "bg-warning-400",
          status === "idle" && "bg-muted"
        )} />
      )}
      {children}
    </div>
  );
};