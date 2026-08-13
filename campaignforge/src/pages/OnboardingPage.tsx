import React, { useState, useEffect } from 'react';
import { useApp } from '../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { BUSINESS_TYPES, COMMON_GOALS, AVAILABLE_INTERESTS, AGE_BRACKETS, GENDER_OPTIONS } from '../constants';
import { Input, TextArea } from '../components/ui/Input';
import { SegmentedControl } from '../components/ui/SegmentedControl';

function MarketingSections() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] px-4 py-12 md:py-16">
      <div className="max-w-7xl mx-auto space-y-16">
        <section id="how-it-works">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">HOW IT WORKS</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Three steps to <span className="text-neutral-400 font-light">launch.</span></h2>
            </div>
            <p className="text-xs text-neutral-500 font-mono tracking-wider">FROM IDEA TO EXECUTION IN MINUTES</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
                <span className="text-lg font-black font-mono text-neutral-700">01</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">Describe your goal</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">Tell us about your business, campaign objective, target audience, and budget in plain language. No complex prompting required.</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
                <span className="text-lg font-black font-mono text-neutral-700">02</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">AI builds your workspace</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">Our engine generates a complete campaign workspace — strategy pillars, Kanban task board, multi-channel content drafts, and a 30-day timeline.</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
                <span className="text-lg font-black font-mono text-neutral-700">03</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">Execute with your co-pilot</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">Use the interactive AI co-pilot to refine strategy, generate fresh content, adjust timelines, and keep your campaign on track.</p>
            </div>
          </div>
        </section>

        <section id="features">
          <div className="border-t border-b border-black/8 py-14 bg-white/30 backdrop-blur-sm -mx-4 md:-mx-0 md:rounded-2xl md:px-12">
            <div className="max-w-7xl mx-auto px-6 md:px-0 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 block">01 / DEFINE GOAL</span>
                <h3 className="text-lg font-bold tracking-tight text-neutral-900">Describe your custom target</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Input your specialty niche, your exact budget, and your target demographics. Avoid complex prompting formats; plain language is all we need.</p>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 block">02 / BUILD SPACE</span>
                <h3 className="text-lg font-bold tracking-tight text-neutral-900">Get a fully wired workspace</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Our generator assembles high-fidelity marketing pillars, targeted user personas, step-by-step Kanban boards, and copy-paste ready social templates.</p>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold tracking-widest text-neutral-400 block">03 / CO-PILOT TUNING</span>
                <h3 className="text-lg font-bold tracking-tight text-neutral-900">Execute with interactive AI</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Use your built-in Strategy Co-pilot to draft specialized channel content, auto-append custom tasks, or schedule key events directly in your calendar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">INVESTMENT TIERS</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Simple pricing. <span className="text-neutral-400 font-light">No surprises.</span></h2>
            </div>
            <p className="text-xs text-neutral-500 font-mono tracking-wider">UPGRADE OR DOWNGRADE AT ANY POINT</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">INDIVIDUAL</span>
                <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight">$0</span><span className="text-xs text-neutral-400 font-medium ml-1">/ forever</span></div>
                <div className="h-px bg-black/5 my-6" />
                <ul className="space-y-3.5 text-xs text-neutral-600 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> 1 Active Marketing Workspace</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Standard Kanban Task Manager</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> 10 Built-In Social Post Drafts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Custom 30-Day Static Calendar</li>
                </ul>
              </div>
            </div>
            <div className="bg-[#1A1A1A] text-[#E8E6E0] p-8 rounded-2xl flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 relative overflow-hidden border border-white/5">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#888888] uppercase">CAMPAIGNER CHOICE</span>
                <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight text-white">$39</span><span className="text-xs text-[#888888] font-medium ml-1">/ month</span></div>
                <div className="h-px bg-white/10 my-6" />
                <ul className="space-y-3.5 text-xs text-neutral-300 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#888888] shrink-0" /> Unlimited Strategy Workspaces</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#888888] shrink-0" /> Automated Interactive Co-pilot chat</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#888888] shrink-0" /> Unlimited AI Channel Copy Generation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#888888] shrink-0" /> Live Dynamic Calendar Integration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#888888] shrink-0" /> Export to CSV & Strategy PDF files</li>
                </ul>
              </div>
            </div>
            <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 rounded-2xl flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">AGENCY PACK</span>
                <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight">$149</span><span className="text-xs text-neutral-400 font-medium ml-1">/ month</span></div>
                <div className="h-px bg-black/5 my-6" />
                <ul className="space-y-3.5 text-xs text-neutral-600 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Everything in Pro Tier</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Dedicated Brand Voice Tuning Profiles</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Team seat collaboration (Up to 10 users)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> Client Pitch View (Public view link sharing)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-neutral-400 shrink-0" /> API Integration access credentials</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const { navigateTo, createProject, onboardingData, setOnboardingData, addToast, loading } = useApp();
  const [step, setStep] = useState(1);
  const [showMarketing, setShowMarketing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (['#how-it-works', '#features', '#pricing'].includes(hash)) {
      setShowMarketing(true);
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleNext = () => {
    if (step === 1 && !onboardingData.businessName.trim()) {
      addToast('Input Required', 'Please enter your business or agency name to proceed.', 'warning');
      return;
    }
    if (step === 2 && !onboardingData.goal.trim()) {
      addToast('Input Required', 'Please outline your campaign goal to proceed.', 'warning');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleGenerate = async () => {
    const firstWord = onboardingData.businessName.split(' ')[0];
    try {
      const projId = await createProject({
        name: `${firstWord} Growth & Launch Campaign`,
        businessName: onboardingData.businessName,
        businessType: onboardingData.businessType,
        goal: onboardingData.goal,
        targetAudience: onboardingData.targetAudience,
        budget: onboardingData.budget,
      });
      navigateTo('/generating', { id: projId });
    } catch (err: any) {
      addToast('Error', err?.message || 'Failed to create workspace. Please try again.', 'error');
    }
  };

  if (showMarketing) {
    return <MarketingSections />;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F0EEE8] flex items-center justify-center px-4 py-8 md:py-16">
      <div className="w-full max-w-[580px] bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 md:p-12 rounded-2xl border border-black/10 shadow-xl">
        <div className="space-y-4 mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s < step ? 'bg-[#1A1A1A]' : s === step ? 'bg-neutral-600/40' : 'bg-neutral-300/25'}`} />
            ))}
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
            <span>PROJECT CREATOR</span>
            <span>Step {step} of 4</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black font-display text-neutral-900 tracking-tight">Business basics.</h2>
                  <p className="text-sm text-neutral-500">Tell us the name and primary category of your endeavor.</p>
                </div>
                <div className="space-y-4">
                  <Input label="BUSINESS OR AGENCY NAME" type="text" placeholder="Aalim Specialty Coffee" value={onboardingData.businessName} onChange={(e) => setOnboardingData((prev: any) => ({ ...prev, businessName: e.target.value }))} id="input-business-name" />
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">BUSINESS TYPE / CATEGORY</label>
                    <div className="relative">
                      <select value={onboardingData.businessType} onChange={(e) => setOnboardingData((prev: any) => ({ ...prev, businessType: e.target.value }))}
                        className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 px-3.5 text-sm text-neutral-900 outline-none transition-all cursor-pointer appearance-none">
                        {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button onClick={handleNext} className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-[14px] tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px]">
                    Continue ↗
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black font-display text-neutral-900 tracking-tight">Goal definition.</h2>
                  <p className="text-sm text-neutral-500">What primary objective are we building this workspace around?</p>
                </div>
                <div className="space-y-4">
                  <TextArea label="CAMPAIGN OBJECTIVE / MISSION" rows={3} placeholder="E.g., Launch our new Ethiopian single-origin cold brew cans and secure 10k recurring memberships..." value={onboardingData.goal} onChange={(e) => setOnboardingData((prev: any) => ({ ...prev, goal: e.target.value }))} id="input-goal" />
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">COMMON TEMPLATES</span>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_GOALS.map((gText) => (
                        <button key={gText} type="button" onClick={() => setOnboardingData((prev: any) => ({ ...prev, goal: gText }))}
                          className="text-xs text-neutral-600 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 border border-black/10 px-3 py-1.5 rounded-full text-left transition-all max-w-full truncate">{gText}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">CAMPAIGN BUDGET LIMIT</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm font-mono text-neutral-400">$</span>
                      <input type="text" placeholder="5,000" value={onboardingData.budget.replace('$', '')} onChange={(e) => setOnboardingData((prev: any) => ({ ...prev, budget: `$${e.target.value}` }))}
                        className="w-full bg-[#1A1A1A]/4 border border-black/10 focus:border-black/40 focus:ring-4 focus:ring-black/5 rounded-lg h-11 pl-7 pr-3.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-all font-mono" id="input-budget" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep((prev) => prev - 1)} className="inline-flex items-center justify-center px-[20px] py-[10px] rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] gap-1.5"><ArrowLeft size={13} /> Back</button>
                  <button onClick={handleNext} className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-[14px] tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px]">Continue ↗</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black font-display text-neutral-900 tracking-tight">Target audience.</h2>
                  <p className="text-sm text-neutral-500">Identify who this campaign is specifically tailored to reach.</p>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2 font-bold">PRIMARY AGE BRACKET</label>
                    <SegmentedControl options={AGE_BRACKETS} value={onboardingData.targetAudience.age} onChange={(age) => setOnboardingData((prev: any) => ({ ...prev, targetAudience: { ...prev.targetAudience, age } }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2 font-bold">GENDER FOCUS</label>
                    <SegmentedControl options={GENDER_OPTIONS} value={onboardingData.targetAudience.gender} onChange={(gender) => setOnboardingData((prev: any) => ({ ...prev, targetAudience: { ...prev.targetAudience, gender } }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-2 font-bold">KEY COHORT INTERESTS</label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_INTERESTS.map((interest) => {
                        const selected = onboardingData.targetAudience.interests.includes(interest);
                        return (
                          <button key={interest} type="button" onClick={() => {
                            setOnboardingData((prev: any) => {
                              const interests = prev.targetAudience.interests.includes(interest)
                                ? prev.targetAudience.interests.filter((i: string) => i !== interest)
                                : [...prev.targetAudience.interests, interest];
                              return { ...prev, targetAudience: { ...prev.targetAudience, interests } };
                            });
                          }}
                            className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${selected ? 'bg-[#1A1A1A] text-white border-transparent' : 'bg-[#1A1A1A]/5 border-black/10 text-neutral-500 hover:bg-[#1A1A1A]/10'}`}>
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep((prev) => prev - 1)} className="inline-flex items-center justify-center px-[20px] py-[10px] rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] gap-1.5"><ArrowLeft size={13} /> Back</button>
                  <button onClick={handleNext} className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-[14px] tracking-[0.01em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px]">Continue ↗</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black font-display text-neutral-900 tracking-tight">Ready.</h2>
                  <p className="text-sm text-neutral-500">Your customized strategy and execution workspaces are about to build.</p>
                </div>
                <div className="p-4 bg-black/4 border border-black/5 rounded-xl space-y-3.5">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">LAUNCH CONFIGURATION SUMMARY</span>
                  <div className="space-y-2.5 text-xs text-neutral-600 font-medium">
                    <div className="flex justify-between"><span className="text-neutral-400">Entity:</span><span className="text-neutral-800 font-bold">{onboardingData.businessName}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Market Segment:</span><span className="text-neutral-800 font-bold">{onboardingData.businessType}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Target Goal:</span><span className="text-neutral-800 font-bold text-right truncate max-w-[280px]">"{onboardingData.goal}"</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Primary Cohort:</span><span className="text-neutral-800 font-bold">{onboardingData.targetAudience.age} years · {onboardingData.targetAudience.gender}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-400">Funding Allotment:</span><span className="text-neutral-800 font-mono font-bold">{onboardingData.budget}</span></div>
                  </div>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <div className="p-1 bg-black/5 rounded-full flex items-center justify-center">
                    <button onClick={handleGenerate} disabled={loading}
                      className="relative w-full inline-flex items-center justify-center px-[28px] py-[14px] rounded-[9999px] text-[rgba(255,255,255,0.95)] font-semibold text-sm bg-neutral-900 text-white rounded-full backdrop-blur-[30px] saturate-[200%] bg-gradient-to-b from-[rgba(255,255,255,0.28)] to-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] shadow-[inset_0_1px_0_rgba(255,255,255,0.40),inset_0_-1px_0_rgba(255,255,255,0.08),0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden cursor-pointer transition-all duration-[0.35s] hover:translate-y-[-3px] hover:scale-[1.03] gap-2 py-3 text-white disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
                      id="generate-workspace-btn">
                      <Sparkles size={16} /> {loading ? 'Creating...' : 'Generate Workspace'} ↗
                    </button>
                  </div>
                  <button onClick={() => setStep((prev) => prev - 1)} className="w-full text-center text-xs text-neutral-400 hover:text-neutral-700 transition-all py-1">← Back to parameters editing</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
