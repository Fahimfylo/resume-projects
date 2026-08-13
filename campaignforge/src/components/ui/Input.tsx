import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps {
  label?: string;
  [key: string]: any;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface TextAreaProps {
  label?: string;
  [key: string]: any;
}

export function TextArea({ label, className, id, ...props }: TextAreaProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg p-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all resize-none',
          className
        )}
        {...props}
      />
    </div>
  );
}
