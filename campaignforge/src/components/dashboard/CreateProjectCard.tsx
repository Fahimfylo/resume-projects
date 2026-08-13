import React from 'react';
import { Plus } from 'lucide-react';

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="border border-dashed border-neutral-300 hover:border-neutral-500 bg-white/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center py-12 cursor-pointer transition-all hover:translate-y-[-3px] hover:shadow-md"
    >
      <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center mb-4 text-neutral-600">
        <Plus size={18} />
      </div>
      <h4 className="text-sm font-bold text-neutral-800">Create new workspace</h4>
      <p className="text-xs text-neutral-400 max-w-[180px] mt-1.5 leading-relaxed">
        Generate custom strategies, social drafts, and calendars in seconds.
      </p>
    </div>
  );
}
