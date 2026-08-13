import React from 'react';
import { cn } from '../../lib/utils';

interface SegmentedControlProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="grid gap-1 p-1 bg-black/5 border border-black/5 rounded-full"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full text-[11px] font-semibold transition-all cursor-pointer h-9',
            value === option ? 'bg-[#1A1A1A] text-white' : 'text-neutral-500 hover:text-neutral-800'
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
