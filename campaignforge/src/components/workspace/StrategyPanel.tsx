import React, { useState, useEffect } from 'react';
import { StrategyPlan } from '../../types';
import { Edit2 } from 'lucide-react';
import { useApp } from '../../context/useApp';

interface StrategyPanelProps {
  strategy: StrategyPlan;
}

export function StrategyPanel({ strategy }: StrategyPanelProps) {
  const { addToast } = useApp();
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  useEffect(() => {
    setSummaryText(strategy.executiveSummary);
  }, [strategy]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 shadow-md">
          <div className="flex justify-between items-center border-b border-black/5 pb-3.5 mb-4">
            <h3 className="text-xs font-mono font-black tracking-wider text-neutral-400 uppercase">— EXECUTIVE BLUEPRINT SUMMARY</h3>
            <button
              onClick={() => {
                if (isEditingSummary) addToast('Summary Saved', 'Your revised strategic objective has been saved.', 'success');
                setIsEditingSummary(!isEditingSummary);
              }}
              className="text-xs text-neutral-500 hover:text-black font-semibold flex items-center gap-1"
            >
              <Edit2 size={11} /> {isEditingSummary ? 'Save' : 'Edit'}
            </button>
          </div>
          {isEditingSummary ? (
            <textarea rows={4} value={summaryText} onChange={(e) => setSummaryText(e.target.value)}
              className="w-full bg-[#1A1A1A]/5 border border-black/10 rounded-lg p-3 text-sm text-neutral-900 outline-none focus:border-black/30 resize-none font-sans leading-relaxed" />
          ) : (
            <p className="text-sm text-neutral-600 leading-relaxed font-sans font-medium">{summaryText}</p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-mono font-black tracking-wider text-neutral-400 uppercase">— CAMPAIGN CORE PILLARS</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {strategy.corePillars.map((pillar, idx) => (
              <div key={idx} className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-5 rounded-xl border border-black/5 hover:border-black/12 transition-all">
                <span className="text-[10px] font-mono text-neutral-400 font-bold">0{idx + 1}</span>
                <h5 className="text-sm font-bold text-neutral-900 mt-2 mb-1">{pillar.title}</h5>
                <p className="text-xs text-neutral-500 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 shadow-md space-y-4">
          <h3 className="text-xs font-mono font-black tracking-wider text-neutral-400 uppercase border-b border-black/5 pb-2.5">— TARGET AUDIENCE PERSONAS</h3>
          <div className="space-y-4">
            {strategy.targetPersonas.map((p, idx) => (
              <div key={idx} className="bg-[#1A1A1A]/4 border border-black/5 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm text-neutral-900">{p.name}</div>
                  <span className="text-[9px] font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded uppercase font-mono">{p.role.split(' ')[0]}</span>
                </div>
                <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">{p.role}</div>
                <div className="pt-2 border-t border-black/5">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold block mb-1">PAIN POINTS:</span>
                  <ul className="list-disc pl-4 text-xs text-neutral-500 space-y-1">
                    {p.painPoints?.map((pt, i) => <li key={i}>{pt}</li>) || <li>Inconsistent access to quality resources</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 rounded-2xl border border-black/5 shadow-md space-y-4">
          <h3 className="text-xs font-mono font-black tracking-wider text-neutral-400 uppercase border-b border-black/5 pb-2.5">— CAMPAIGN EXECUTION PHASES</h3>
          <div className="space-y-4">
            {strategy.timelinePhases.map((phase, idx) => (
              <div key={idx} className="border-l-2 border-neutral-900 pl-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400 font-bold">{phase.duration}</span>
                  <span className="text-xs font-bold text-neutral-900">— {phase.name}</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
