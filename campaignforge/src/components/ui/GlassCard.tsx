import React from 'react';
import { cn } from '../../lib/utils';

type GlassVariant = 'light' | 'dark' | 'elevated' | 'ghost-panel';

interface GlassCardProps {
  variant?: GlassVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses: Record<GlassVariant, string> = {
  'light': 'bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)]',
  'dark': 'bg-[rgba(15,15,15,0.55)] backdrop-blur-[24px] saturate-[180%] border border-[rgba(255,255,255,0.08)] rounded-[16px]',
  'elevated': 'bg-[rgba(18,18,18,0.88)] backdrop-blur-[40px] saturate-[200%] border border-[rgba(255,255,255,0.10)] rounded-[20px] shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_24px_64px_rgba(0,0,0,0.5)]',
  'ghost-panel': 'bg-[rgba(240,238,232,0.06)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.06)] rounded-[12px]',
};

export function GlassCard({ variant = 'light', className, children, onClick }: GlassCardProps) {
  return (
    <div className={cn(variantClasses[variant], className)} onClick={onClick}>
      {children}
    </div>
  );
}
