import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-primary/25 hover:shadow-lg",
        secondary: "bg-surface border border-border text-foreground hover:bg-surfaceHighlight hover:border-cyan-400/50",
        danger: "bg-danger text-white hover:bg-danger/90 shadow-lg hover:shadow-danger/25",
        ghost: "text-foreground hover:bg-surfaceHighlight hover:text-cyan-400",
        neon: "bg-transparent border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 hover:shadow-neon hover:text-white",
        cyber: "bg-gradient-to-r from-cyan-500/20 to-primary/20 border border-cyan-400/40 text-cyan-400 hover:from-cyan-500/30 hover:to-primary/30 hover:border-cyan-400 hover:shadow-neon hover:text-white backdrop-blur-sm"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10"
      },
      glow: {
        true: "hover:shadow-glow",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      glow: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Cyber effect overlay */}
        {variant === 'cyber' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        )}
        
        {/* Loading spinner */}
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        
        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className="mr-2 flex-shrink-0">{icon}</span>
        )}
        
        {/* Button content */}
        <span className={cn("flex-1", loading && "opacity-70")}>
          {children}
        </span>
        
        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className="ml-2 flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };