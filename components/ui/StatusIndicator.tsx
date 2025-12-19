import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const statusVariants = cva(
  "inline-flex items-center gap-2 text-sm font-medium",
  {
    variants: {
      status: {
        online: "text-success-400 status-online",
        warning: "text-warning-400 status-warning", 
        danger: "text-danger-400 status-danger",
        offline: "text-muted",
        processing: "text-cyan-400"
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base"
      }
    },
    defaultVariants: {
      status: "online",
      size: "default"
    }
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  label: string;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, pulse = true, icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusVariants({ status, size }), className)}
        {...props}
      >
        {/* Status dot */}
        <div className={cn(
          "w-2 h-2 rounded-full relative",
          {
            "bg-success-400": status === 'online',
            "bg-warning-400": status === 'warning',
            "bg-danger-400": status === 'danger',
            "bg-muted": status === 'offline',
            "bg-cyan-400": status === 'processing'
          }
        )}>
          {pulse && status !== 'offline' && (
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping",
              {
                "bg-success-400": status === 'online',
                "bg-warning-400": status === 'warning',
                "bg-danger-400": status === 'danger',
                "bg-cyan-400": status === 'processing'
              }
            )} />
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <span className="flex-shrink-0">
            {icon}
          </span>
        )}
        
        {/* Label */}
        <span>{label}</span>
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator };