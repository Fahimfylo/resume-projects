import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'dark-pill' | 'dark-pill-uppercase' | 'ghost' | 'liquid-glass' | 'liquid-glass-dark';

interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const variantClasses: Record<ButtonVariant, string> = {
  'dark-pill': 'inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-[#FFFFFF] font-semibold text-[14px] tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] active:translate-y-[1px] active:scale-[0.98]',
  'dark-pill-uppercase': 'inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-[#FFFFFF] font-semibold text-[11px] tracking-[0.08em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] active:translate-y-[1px] active:scale-[0.98] uppercase',
  'ghost': 'inline-flex items-center justify-center px-[20px] py-[10px] rounded-[9999px] bg-transparent text-[#111111] font-medium text-[14px] border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] hover:border-[rgba(17,17,17,0.35)] active:scale-[0.97]',
  'liquid-glass': 'relative inline-flex items-center justify-center px-[28px] py-[14px] rounded-[9999px] text-[rgba(255,255,255,0.95)] font-semibold text-[15px] tracking-[0.01em] backdrop-blur-[30px] saturate-[200%] bg-gradient-to-b from-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] shadow-[inset_0_1px_0_rgba(255,255,255,0.40),inset_0_-1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden cursor-pointer transition-all duration-[0.35s] hover:translate-y-[-3px] hover:scale-[1.03] hover:bg-gradient-to-b hover:from-[rgba(255,255,255,0.35)] hover:to-[rgba(255,255,255,0.12)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_16px_40px_rgba(0,0,0,0.25)] active:translate-y-[-1px] active:scale-[0.98]',
  'liquid-glass-dark': 'relative inline-flex items-center justify-center px-[28px] py-[14px] rounded-[9999px] text-[rgba(255,255,255,0.95)] font-semibold text-[15px] tracking-[0.01em] backdrop-blur-[30px] saturate-[200%] bg-gradient-to-b from-[rgba(255,255,255,0.16)] to-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.30),inset_0_-1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.40)] overflow-hidden cursor-pointer transition-all duration-[0.35s] hover:translate-y-[-3px] hover:scale-[1.03] hover:bg-gradient-to-b hover:from-[rgba(255,255,255,0.22)] hover:to-[rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_40px_rgba(0,0,0,0.50)]',
};

export function Button({ variant = 'dark-pill', className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </button>
  );
}
