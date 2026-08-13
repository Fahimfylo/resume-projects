import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'pro' | 'content' | 'task';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-black/5 text-neutral-700',
  active: 'bg-black/5 text-neutral-700',
  pro: 'bg-[#1A1A1A] text-white',
  content: 'bg-[#1A1A1A] text-white',
  task: 'bg-[#B45309]/10 text-[#B45309]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider uppercase',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}

interface StatusDotProps {
  color?: string;
}

export function StatusDot({ color = 'bg-[#2D6A4F]' }: StatusDotProps) {
  return <span className={cn('w-1.5 h-1.5 rounded-full inline-block', color)} />;
}
