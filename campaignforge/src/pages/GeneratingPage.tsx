import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { GENERATION_STATUSES, ACTIVITY_LINES } from '../constants';

export function GeneratingPage() {
  const { navigateTo, addToast, fetchProjectData, pathParams, projects, tasks, contentItems, calendarEvents, strategies } = useApp();
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const projectId = pathParams.id;

  useEffect(() => {
    if (!projectId) return;
    const startTime = Date.now();
    pollRef.current = setInterval(() => {
      fetchProjectData(projectId);
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(95, Math.round((elapsed / 60000) * 100)));
      if (elapsed >= 60000) {
        clearInterval(pollRef.current!);
        setTimedOut(true);
        setProgress(100);
      }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [projectId, fetchProjectData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => prev < GENERATION_STATUSES.length - 1 ? prev + 1 : prev);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const hasTasks = tasks.some((t) => t.projectId === projectId);
    const hasContent = contentItems.some((c) => c.projectId === projectId);
    const hasEvents = calendarEvents.some((e) => e.projectId === projectId);
    const hasStrategy = !!strategies[projectId];
    if (hasTasks && hasContent && hasEvents && hasStrategy) {
      setDataReady(true);
      setProgress(100);
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [projectId, tasks, contentItems, calendarEvents, strategies]);

  useEffect(() => {
    if (!dataReady && !timedOut) return;
    const timer = setTimeout(() => {
      if (dataReady) {
        addToast('Workspace Provisioned', 'Your bespoke workspace has been generated. Strategy, tasks, content, and timeline loaded!', 'success');
      } else if (strategies[projectId || '']) {
        addToast('Workspace Ready', 'Your workspace has been created. Some data may still be populating.', 'info');
      } else {
        addToast('Still Generating', 'Workspace generation is taking longer than expected. You can check back shortly or manually add content.', 'warning');
      }
      navigateTo('/dashboard');
    }, dataReady ? 300 : 500);
    return () => clearTimeout(timer);
  }, [dataReady, timedOut, strategies, projectId]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center p-4 z-50 text-[#E8E6E0]">
      <div className="w-full max-w-[480px] bg-[#141414]/90 border border-white/8 p-8 md:p-12 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
        <div className="relative inline-flex items-center justify-center p-4 bg-white/5 rounded-full border border-white/10 mb-6">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="text-[#E8E6E0]">
            <RefreshCw size={24} className="stroke-[1.5]" />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center"><Wand2 size={12} className="text-white" /></div>
        </div>
        <div className="h-20 flex flex-col justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div key={statusIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-1.5">
              <h3 className="text-xl font-bold font-display text-white tracking-tight">{GENERATION_STATUSES[statusIndex].title}</h3>
              <p className="text-xs text-[#888888]">{GENERATION_STATUSES[statusIndex].subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="space-y-2 mb-8">
          <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-[#888888]">
            <span>PROVISIONING ENGINE</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
        <div className="text-left bg-white/3 border border-white/5 rounded-xl p-4 h-40 overflow-y-auto space-y-2.5">
          {ACTIVITY_LINES.map((line, index) => {
            const threshold = (index + 1) * (100 / ACTIVITY_LINES.length);
            const isVisible = progress >= threshold - 5;
            return (
              <div key={index} className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0 text-neutral-300' : 'opacity-0 translate-x-1 text-neutral-600'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isVisible ? 'bg-[#2D6A4F]/20 text-[#2D6A4F]' : 'bg-white/5 text-neutral-500'}`}>
                  <Check size={10} className="stroke-[3]" />
                </div>
                <span className="truncate">{line}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
