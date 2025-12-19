import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const cardVariants = cva(
  "rounded-2xl transition-all duration-300 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "glass",
        cyber: "cyber-glass",
        solid: "bg-surface border border-border",
        gradient: "bg-gradient-to-br from-surface to-surfaceHighlight border border-border",
        neon: "bg-surface/50 border border-cyan-400/30 shadow-neon backdrop-blur-sm"
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
        xl: "p-8"
      },
      hover: {
        true: "hover:scale-[1.02] hover:shadow-glow cursor-pointer",
        false: ""
      },
      glow: {
        true: "shadow-glow",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      hover: false,
      glow: false
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hudBrackets?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, glow, hudBrackets, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover, glow }), className)}
        {...props}
      >
        {/* HUD Brackets */}
        {hudBrackets && (
          <>
            <div className="hud-bracket hud-bracket-tl" />
            <div className="hud-bracket hud-bracket-tr" />
            <div className="hud-bracket hud-bracket-bl" />
            <div className="hud-bracket hud-bracket-br" />
          </>
        )}
        
        {/* Cyber effect for cyber variant */}
        {variant === 'cyber' && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-primary/5 pointer-events-none" />
        )}
        
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-tech font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };