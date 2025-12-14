import React, { useEffect, useRef } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'saffron';
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, unit, icon, color = 'primary' }) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value && valueRef.current) {
      valueRef.current.classList.remove('animate-tick-up');
      // void valueRef.current.offsetWidth; // Trigger reflow to restart animation
      setTimeout(() => {
         if (valueRef.current) valueRef.current.classList.add('animate-tick-up');
      }, 10);
    }
    prevValueRef.current = value;
  }, [value]);


  const colors = {
    primary: 'border-l-blue-500 text-blue-400 bg-blue-500/10',
    accent: 'border-l-cyan-500 text-cyan-400 bg-cyan-500/10',
    success: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/10',
    warning: 'border-l-amber-500 text-amber-400 bg-amber-500/10',
    danger: 'border-l-red-500 text-red-500 bg-red-500/10',
    saffron: 'border-l-orange-500 text-orange-400 bg-orange-500/10',
  };

  const colorClass = colors[color];

  return (
    <div className={`
      relative pl-4 pr-4 py-3 border-l-[3px]
      ${colorClass} glass
      transition-all duration-300 group hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5
    `}>
      {/* Tech Corner Marker */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20"></div>

      <div className="flex justify-between items-start relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold group-hover:text-gray-400 transition-colors">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span ref={valueRef} className="text-2xl font-tech font-bold text-gray-100 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all leading-none">
              {value}
            </span>
            {unit && <span className="text-[10px] text-gray-500 font-mono mt-1">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className="opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 transform p-1.5 rounded-md bg-white/5 border border-white/5">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};