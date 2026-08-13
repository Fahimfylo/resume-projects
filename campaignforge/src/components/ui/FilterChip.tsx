import React from 'react';
import { cn } from '../../lib/utils';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap',
        active
          ? 'bg-[#1A1A1A] text-white border-transparent font-semibold'
          : 'bg-white border-black/10 text-neutral-500 hover:bg-[#1A1A1A]/5'
      )}
    >
      {label}
    </button>
  );
};
