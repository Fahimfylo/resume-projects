import React from 'react';

interface StatsCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

export function StatsCard({ label, value, subtitle, icon: Icon }: StatsCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-5 rounded-xl flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-bold">{label}</span>
        <Icon size={14} className="text-neutral-400" />
      </div>
      <div className="mt-4">
        <div className="text-3xl font-black font-display text-neutral-900">{value}</div>
        <div className="text-[11px] text-neutral-500 font-bold mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
