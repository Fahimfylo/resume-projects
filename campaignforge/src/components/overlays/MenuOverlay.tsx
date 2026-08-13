import React from 'react';
import { useApp } from '../../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { MENU_LINKS } from '../../constants';

export function MenuOverlay() {
  const { menuOverlayOpen, setMenuOverlayOpen, navigateTo } = useApp();

  if (!menuOverlayOpen) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 40 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#0A0A0A]/95 backdrop-blur-2xl text-[#E8E6E0] p-6 md:p-16 overflow-hidden"
      >
        <button
          onClick={() => setMenuOverlayOpen(false)}
          className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-[rgba(80,80,80,0.35)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_16px_rgba(0,0,0,0.30)] flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(100,100,100,0.45)] hover:scale-105"
        >
          <X size={20} className="text-white" />
        </button>

        <div className="hidden md:flex flex-col justify-between w-1/3 pr-12 border-r border-white/5">
          <div className="space-y-6">
            <div className="bg-[rgba(240,238,232,0.06)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-6 h-36 flex flex-col justify-between opacity-80">
              <div className="w-12 h-1 bg-white/20 rounded" />
              <div>
                <div className="text-[10px] font-mono tracking-wider text-[#888888] uppercase">Aesthetic Core</div>
                <div className="text-sm font-medium mt-1 text-[#E8E6E0]">Momentum v2</div>
              </div>
            </div>
            <div className="bg-[rgba(240,238,232,0.06)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-6 h-48 flex flex-col justify-between opacity-50">
              <div className="w-24 h-4 bg-white/10 rounded" />
              <div className="space-y-2">
                <div className="w-full h-2 bg-white/5 rounded" />
                <div className="w-4/5 h-2 bg-white/5 rounded" />
                <div className="w-2/3 h-2 bg-white/5 rounded" />
              </div>
            </div>
          </div>
          <div className="mt-auto space-y-6">
            <div>
              <div className="text-[10px] font-mono tracking-wider text-[#888888] uppercase mb-1">EMAIL ADDRESS</div>
              <a href="mailto:hello@momentum.io" className="text-base font-medium tracking-tight hover:text-white transition-colors">hello@momentum.io</a>
            </div>
            <div className="flex gap-6 text-sm text-[#888888]">
              <a href="#" className="hover:text-[#E8E6E0] transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-[#E8E6E0] transition-colors">Twitter</a>
              <a href="#" className="hover:text-[#E8E6E0] transition-colors">GitHub</a>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center pl-0 md:pl-16 mt-16 md:mt-0">
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4 md:gap-8 items-start text-left">
            {MENU_LINKS.map((link, index) => {
              const isHashLink = link.path.includes('#');
              return isHashLink ? (
                <motion.a
                  key={index}
                  variants={itemVariants}
                  href={link.path}
                  onClick={() => setMenuOverlayOpen(false)}
                  className="text-left font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter hover:opacity-60 transition-all text-[#E8E6E0] duration-200 no-underline"
                >
                  {link.label}
                </motion.a>
              ) : (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  onClick={() => { navigateTo(link.path); setMenuOverlayOpen(false); }}
                  className="text-left font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter hover:opacity-60 transition-all text-[#E8E6E0] duration-200"
                >
                  {link.label}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <div className="md:hidden mt-auto pt-12 border-t border-white/5 flex flex-col gap-6">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#888888] uppercase mb-1">EMAIL ADDRESS</div>
            <a href="mailto:hello@momentum.io" className="text-sm text-[#E8E6E0]">hello@momentum.io</a>
          </div>
          <div className="flex gap-4 text-xs text-[#888888]">
            <a href="#">LinkedIn</a>
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
