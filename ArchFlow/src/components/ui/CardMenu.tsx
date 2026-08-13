import React, { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface CardMenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  items: CardMenuItem[];
}

export const CardMenu: React.FC<Props> = ({ items }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (item: CardMenuItem) => {
    setOpen(false);
    item.onClick();
  };

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-3)] transition-colors hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]"
        title="More actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-[var(--border-3)] bg-[var(--bg-overlay)] py-1 shadow-2xl backdrop-blur-md">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(item);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold transition-all ${
                  item.danger
                    ? 'text-rose-400 hover:bg-rose-500/10'
                    : 'text-[var(--text-2)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-strong)]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
