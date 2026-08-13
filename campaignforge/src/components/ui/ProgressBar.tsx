import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, className, barClassName, showLabel, label }: ProgressBarProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
          <span>{label || 'PROGRESS'}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-[3px] w-full bg-black/5 rounded-full overflow-hidden">
        <div
          className={cn('h-full bg-[#1A1A1A] rounded-full transition-all duration-300', barClassName)}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
