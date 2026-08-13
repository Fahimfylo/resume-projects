import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Folder, Kanban, FileText, ArrowRight } from 'lucide-react';
import { useKeyboard } from '../../hooks/useKeyboard';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, projects, navigateTo } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboard('k', () => setCommandPaletteOpen(!commandPaletteOpen), [commandPaletteOpen]);
  useKeyboard('Escape', () => commandPaletteOpen && setCommandPaletteOpen(false), [commandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setQuery('');
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const filteredProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.businessName.toLowerCase().includes(query.toLowerCase())
  );

  const navItems = [
    { label: 'View Dashboard', path: '/dashboard', icon: Folder, shortcut: 'G D' },
    { label: 'Start New Project', path: '/onboarding', icon: Kanban, shortcut: 'G N' },
    { label: 'Return to Landing', path: '/', icon: FileText, shortcut: 'G L' },
  ];

  const filteredNavs = navItems.filter((nav) => nav.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl overflow-hidden bg-[rgba(18,18,18,0.88)] backdrop-blur-[40px] saturate-[200%] border border-[rgba(255,255,255,0.10)] rounded-[20px] shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_24px_64px_rgba(0,0,0,0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center border-b border-white/10 px-4 py-4">
            <Search className="text-neutral-400 mr-3" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search campaigns, boards, strategies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-neutral-500 font-sans text-base outline-none border-none focus:ring-0"
            />
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] font-mono bg-white/10 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">ESC</span>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredNavs.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Navigation</div>
                <div className="mt-1 flex flex-col gap-0.5">
                  {filteredNavs.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { navigateTo(item.path); setCommandPaletteOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-neutral-300 hover:bg-white/5 hover:text-white transition-all text-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">{item.shortcut}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="px-3 py-1 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Active Workspaces</div>
              <div className="mt-1 flex flex-col gap-0.5">
                {filteredProjects.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-neutral-500 italic">No workspaces match your search</div>
                ) : (
                  filteredProjects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => { navigateTo('/workspace', { id: proj.id }); setCommandPaletteOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-neutral-300 hover:bg-white/5 hover:text-white transition-all text-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder size={16} className="text-neutral-400 group-hover:text-white transition-colors" />
                        <div>
                          <div className="font-medium text-neutral-200 group-hover:text-white">{proj.name}</div>
                          <div className="text-[11px] text-neutral-500 group-hover:text-neutral-400 mt-0.5">{proj.businessName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open</span>
                        <ArrowRight size={12} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
