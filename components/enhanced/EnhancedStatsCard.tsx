import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { cn } from '../utils/cn';

interface EnhancedStatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'saffron';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export const EnhancedStatsCard: React.FC<EnhancedStatsCardProps> = ({
  label,
  value,
  unit,
  icon,
  color = 'primary',
  trend,
  loading = false,
  className
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate number changes
  useEffect(() => {
    if (typeof value === 'number' && !loading) {
      setIsAnimating(true);
      const startValue = displayValue;
      const endValue = value;
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (endValue - startValue) * easeOutCubic;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, loading]);

  const colorClasses = {
    primary: {
      bg: 'from-primary/20 to-primary/5',
      border: 'border-primary/30',
      text: 'text-primary',
      glow: 'shadow-primary/20'
    },
    accent: {
      bg: 'from-cyan-500/20 to-cyan-500/5',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20'
    },
    success: {
      bg: 'from-success-500/20 to-success-500/5',
      border: 'border-success-500/30',
      text: 'text-success-400',
      glow: 'shadow-success-500/20'
    },
    warning: {
      bg: 'from-warning-500/20 to-warning-500/5',
      border: 'border-warning-500/30',
      text: 'text-warning-400',
      glow: 'shadow-warning-500/20'
    },
    danger: {
      bg: 'from-danger-500/20 to-danger-500/5',
      border: 'border-danger-500/30',
      text: 'text-danger-400',
      glow: 'shadow-danger-500/20'
    },
    saffron: {
      bg: 'from-saffron/20 to-saffron/5',
      border: 'border-saffron/30',
      text: 'text-saffron',
      glow: 'shadow-saffron/20'
    }
  };

  const colorClass = colorClasses[color];

  return (
    <Card
      variant="cyber"
      className={cn(
        "relative overflow-hidden group hover:scale-105 transition-all duration-300",
        `bg-gradient-to-br ${colorClass.bg}`,
        `border ${colorClass.border}`,
        `hover:shadow-lg ${colorClass.glow}`,
        className
      )}
      hudBrackets
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-cyber-grid" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn("p-2 rounded-lg", `bg-gradient-to-br ${colorClass.bg}`)}>
                <div className={cn("w-4 h-4", colorClass.text)}>
                  {icon}
                </div>
              </div>
            )}
            <span className="text-xs font-tech font-medium text-muted uppercase tracking-wider">
              {label}
            </span>
          </div>

          {/* Trend Indicator */}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full",
              trend.isPositive 
                ? "bg-success-500/20 text-success-400" 
                : "bg-danger-500/20 text-danger-400"
            )}>
              <span className={cn(
                "text-xs",
                trend.isPositive ? "text-success-400" : "text-danger-400"
              )}>
                {trend.isPositive ? "↗" : "↘"}
              </span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border-2 border-current border-t-transparent animate-spin opacity-50" />
              <span className="text-sm text-muted">Loading...</span>
            </div>
          ) : (
            <>
              <span className={cn(
                "text-2xl font-display font-bold tracking-tight",
                colorClass.text,
                isAnimating && "animate-pulse-glow"
              )}>
                {typeof value === 'number' ? displayValue.toFixed(1) : value}
              </span>
              {unit && (
                <span className="text-sm font-mono text-muted ml-1">
                  {unit}
                </span>
              )}
            </>
          )}
        </div>

        {/* Data Flow Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 data-flow" />
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </Card>
  );
};