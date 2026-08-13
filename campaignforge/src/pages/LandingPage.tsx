import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Sparkles, Brain, ChevronDown, Plus, Target, Zap, Globe, Shield, RefreshCw, Layers, Activity, Clock, Users, LineChart } from 'lucide-react';

export function LandingPage() {
  const { navigateTo, user } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [counters, setCounters] = useState({ words: 0, campaigns: 0, saved: 0, seconds: 0 });

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStatsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsInView) return;
    const targets = { words: 4200000, campaigns: 18000, saved: 96, seconds: 31 };
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounters({
        words: Math.round(ease * targets.words),
        campaigns: Math.round(ease * targets.campaigns),
        saved: Math.round(ease * targets.saved),
        seconds: Math.round(ease * targets.seconds),
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [statsInView]);

  const faqs = [
    { q: 'How long does generation take?', a: 'Most workspaces are fully generated in under 60 seconds. The AI researches your goal, builds strategy pillars, creates tasks, drafts content, and schedules a 30-day timeline — all in parallel.' },
    { q: 'Which AI models power it?', a: 'We use Google Gemini 2.0 Flash for workspace generation, content drafting, and co-pilot chat. The model is optimized for structured marketing output and runs on dedicated infrastructure.' },
    { q: 'Can I edit everything?', a: 'Absolutely. Every piece of the workspace is fully editable — strategy pillars, task boards, content drafts, and calendar events. You can also regenerate individual sections via the AI co-pilot.' },
    { q: 'Export to PDF?', a: 'Yes. The Pro plan includes CSV and PDF export of your strategy, content library, and timeline. The free plan lets you copy content directly from the browser.' },
    { q: 'Team collaboration?', a: 'The Agency Pack supports up to 10 team seats with shared workspace access, client pitch views, and collaborative editing. Pro and Free are single-user.' },
    { q: 'API?', a: 'The Agency Pack includes API integration credentials, allowing you to connect Momentum with your existing tools and workflows via REST endpoints.' },
    { q: 'Is my data private?', a: 'Yes. Your campaign data is stored securely and never shared. We do not train AI models on your content. You can delete your account and all associated data at any time.' },
    { q: 'Can I regenerate?', a: 'Yes. You can regenerate the entire workspace or individual sections at any time. The AI co-pilot also lets you refine specific parts without starting over.' },
  ];

  return (
    <div className="bg-[#F0EEE8] text-[#111111] min-h-screen overflow-x-hidden">
      <section className="relative px-6 md:px-12 pt-16 md:pt-24 pb-16 flex flex-col md:flex-row items-start justify-between gap-12 max-w-7xl mx-auto">
        <div className="md:absolute md:top-6 md:right-12 text-left md:text-right shrink-0">
          <div className="text-[11px] font-mono tracking-[0.15em] text-neutral-400 uppercase font-semibold">AVAILABLE NOW</div>
          <div className="text-5xl md:text-8xl font-black font-display tracking-tighter text-[#111111]/15 leading-none mt-1 select-none">{new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase()}</div>
        </div>
        <div className="flex-1 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
            <h1 className="font-display text-6xl sm:text-8xl md:text-[6.5rem] font-black tracking-tight leading-[0.9] text-neutral-900">
              Your goal. <br />A complete <br /><span className="text-black/80">workspace.</span>
            </h1>
            <div className="text-neutral-400 mt-4 flex items-center gap-1">
              <ArrowDownRight size={28} className="stroke-[1.5]" />
              <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">campaign blueprint</span>
            </div>
            <div className="max-w-md space-y-8 mt-4">
              <p className="text-base text-neutral-600 leading-relaxed font-sans">
                Stop getting empty suggestions or chat prompts. Get a fully functioning, high-fidelity marketing workspace — including visual strategy plans, kanban task boards, channel drafts, and a 30-day scheduled timeline — built instantly when you describe your business goal.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button onClick={() => navigateTo('/onboarding')}
                  className="inline-flex items-center justify-center px-[24px] py-[12px] rounded-[9999px] bg-[#1A1A1A] text-white font-semibold text-[11px] tracking-[0.08em] border-none cursor-pointer transition-all duration-200 hover:bg-[#333333] hover:translate-y-[-1px] uppercase py-3.5 px-8 shadow-lg text-center">
                  CREATE WORKSPACE ↗
                </button>
                <button onClick={() => navigateTo('/dashboard')}
                  className="inline-flex items-center justify-center px-[20px] py-[10px] rounded-[9999px] bg-transparent text-[#111111] font-medium text-xs border border-neutral-300 cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] hover:border-neutral-500 py-3.5 px-6 text-center">
                  Explore Demo Workspace
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="w-full md:w-[450px] shrink-0 mt-8 md:mt-16">
          <motion.div initial={{ opacity: 0, scale: 0.98, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="relative bg-white border border-black/10 p-2 rounded shadow-xl group overflow-hidden">
            <div className="absolute inset-0 bg-neutral-900/5 mix-blend-color-burn z-10 pointer-events-none" />
            <div className="aspect-[4/3] w-full bg-[#1A1A1A]/5 rounded overflow-hidden flex flex-col justify-between p-4 grayscale filter select-none">
              <div className="flex justify-between items-center pb-2 border-b border-black/10">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                  <span className="w-2 h-2 rounded-full bg-black/20" />
                </div>
                <div className="text-[9px] font-mono tracking-wider text-neutral-400">MOMENTUM WORKSPACE</div>
              </div>
              <div className="space-y-3 my-4 flex-1 flex flex-col justify-center">
                <div className="w-2/3 h-5 bg-[#1A1A1A]/10 rounded" />
                <div className="w-full h-3 bg-[#1A1A1A]/5 rounded" />
                <div className="w-4/5 h-3 bg-[#1A1A1A]/5 rounded" />
                <div className="flex gap-2 pt-2">
                  <div className="w-16 h-4 bg-[#1A1A1A]/10 rounded-full" />
                  <div className="w-20 h-4 bg-[#1A1A1A]/10 rounded-full" />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono border-t border-black/5 pt-2 text-neutral-400">
                <span>01 — WORKSPACE GENERATED</span>
                <span>STATUS: ACTIVE</span>
              </div>
            </div>
            <div className="p-3 bg-white flex justify-between items-center text-xs">
              <div><span className="font-bold text-neutral-800">Tokyo Branding Campaign</span><span className="text-neutral-400 ml-2">v2.4</span></div>
              <span className="text-neutral-400">↘</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mt-24 px-6 md:px-12 max-w-7xl mx-auto" id="how-it-works">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">HOW IT WORKS</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Three steps to <span className="text-neutral-400 font-light">launch.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">FROM IDEA TO EXECUTION IN MINUTES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
              <span className="text-lg font-black font-mono text-neutral-700">01</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">Describe your goal</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Tell us about your business, campaign objective, target audience, and budget in plain language. No complex prompting required.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
              <span className="text-lg font-black font-mono text-neutral-700">02</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">AI builds your workspace</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Our engine generates a complete campaign workspace — strategy pillars, Kanban task board, multi-channel content drafts, and a 30-day timeline.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-5">
              <span className="text-lg font-black font-mono text-neutral-700">03</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">Execute with your co-pilot</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Use the interactive AI co-pilot to refine strategy, generate fresh content, adjust timelines, and keep your campaign on track.</p>
          </div>
        </div>
      </section>

      <section className="mt-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden" id="workflow">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">WORKFLOW</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">From goal to <span className="text-neutral-400 font-light">launch.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">EIGHT STAGE AI PIPELINE</p>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-0 md:gap-0">
          <div className="hidden md:block absolute top-[44px] left-[4%] right-[4%] h-px bg-gradient-to-r from-neutral-300/60 via-neutral-300/20 to-neutral-300/60" />
          <div className="hidden md:block absolute top-[44px] left-[4%] right-[4%] h-[2px] bg-gradient-to-r from-transparent via-neutral-400/30 to-transparent blur-sm" />

          {[
            { label: 'Goal', icon: Target },
            { label: 'AI Research', icon: Sparkles },
            { label: 'Strategy', icon: Layers },
            { label: 'Content', icon: Activity },
            { label: 'Calendar', icon: Clock },
            { label: 'Tasks', icon: CheckCircle2 },
            { label: 'Analytics', icon: LineChart },
            { label: 'Launch', icon: ArrowUpRight },
          ].map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center w-[12.5%] min-w-[90px] group"
            >
              <div className="relative z-10 w-[88px] h-[88px] rounded-[28px] bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 shadow-[0_4px_24px_rgba(17,17,17,0.06)] flex items-center justify-center transition-all duration-300 group-hover:translate-y-[-6px] group-hover:shadow-xl">
                <step.icon size={28} className="text-neutral-700 stroke-[1.5]" />
              </div>
              <div className="absolute top-[88px] left-1/2 -translate-x-1/2 mt-1 h-6 w-px bg-gradient-to-b from-neutral-300/60 to-transparent md:hidden" />
              <span className="mt-4 text-[11px] font-mono tracking-wider text-neutral-500 font-semibold whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity">{step.label}</span>
              <span className="mt-1 text-[9px] font-mono tracking-widest text-neutral-400/60 uppercase md:hidden">0{i + 1}</span>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 md:hidden grid grid-cols-4 gap-4">
          {[
            { label: 'Goal', icon: Target },
            { label: 'AI Research', icon: Sparkles },
            { label: 'Strategy', icon: Layers },
            { label: 'Content', icon: Activity },
            { label: 'Calendar', icon: Clock },
            { label: 'Tasks', icon: CheckCircle2 },
            { label: 'Analytics', icon: LineChart },
            { label: 'Launch', icon: ArrowUpRight },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[16px] p-3 py-4">
              <step.icon size={20} className="text-neutral-600 stroke-[1.5]" />
              <span className="text-[9px] font-mono tracking-wider text-neutral-500 font-semibold">{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t border-b border-black/8 py-14 bg-white/30 backdrop-blur-sm" id="features">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
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
      </section>

      <section className="mt-24 px-6 md:px-12 max-w-7xl mx-auto" ref={statsRef} id="stats">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">LIVE STATISTICS</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Momentum by the <span className="text-neutral-400 font-light">numbers.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">REAL-TIME PLATFORM METRICS</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: counters.words, suffix: '+', label: 'Words Generated', target: 4200000, format: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v) },
            { value: counters.campaigns, suffix: '+', label: 'Campaigns Created', target: 18000, format: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v) },
            { value: counters.saved, suffix: '%', label: 'Average Time Saved', target: 96, format: (v: number) => String(v) },
            { value: counters.seconds, suffix: ' sec', label: 'Average Workspace Build', target: 31, format: (v: number) => String(v) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-6 md:p-8 text-center"
            >
              <div className="text-4xl md:text-6xl font-black font-display tracking-tight text-neutral-900">
                {stat.format(stat.value)}<span className="text-neutral-400 text-2xl md:text-4xl">{stat.suffix}</span>
              </div>
              <div className="mt-2 h-px bg-black/5 mx-auto max-w-[60px]" />
              <div className="mt-3 text-[11px] font-mono tracking-wider text-neutral-500 font-semibold uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mt-24 px-6 md:px-12 max-w-7xl mx-auto" id="workspace">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">THE WORKSPACE</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Everything you need <span className="text-neutral-400 font-light">to launch.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">SIX MODULES, ONE UNIFIED DASHBOARD</p>
        </div>

        <div className="relative">
          <svg className="hidden md:block absolute inset-0 w-full h-full min-h-[500px] pointer-events-none z-20" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(29,29,31,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="500" fill="url(#grid)" />
          </svg>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Strategy Board', desc: 'High-level campaign pillars, audience personas, positioning statements, and KPI targets mapped out in a visual board.' },
              { num: '02', title: 'Kanban Tasks', desc: 'Drag-and-drop task manager with To Do / In Progress / Review / Done columns — track every deliverable.' },
              { num: '03', title: 'Content Library', desc: 'Channel-ready drafts for social, email, and landing pages. Edit, regenerate, or export in one click.' },
              { num: '04', title: 'Calendar Timeline', desc: '30-day interactive schedule with milestone events, content drops, and campaign phases — drag to adjust.' },
              { num: '05', title: 'AI Co-pilot', desc: 'Chat with your workspace. Refine strategy, generate fresh copy, add tasks, or reschedule events by typing.' },
              { num: '06', title: 'Analytics Snapshot', desc: 'Quick-glance KPIs: reach, engagement, conversion estimates, and budget burn tracked per campaign.' },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-7 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-[11px] font-mono font-black text-neutral-400">{item.num}</span>
                  </div>
                  <div className="h-px flex-1 bg-black/5" />
                </div>
                <h3 className="text-base font-bold tracking-tight text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 md:hidden flex flex-col items-center gap-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-px h-8 origin-top"
                style={{background: 'linear-gradient(to bottom, rgba(29,29,31,0.15), rgba(29,29,31,0.05))'}}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-24 mb-16 md:mb-24 px-6 md:px-12 max-w-7xl mx-auto" id="ai-brain">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">AI INTELLIGENCE</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">How AI sees <span className="text-neutral-400 font-light">your campaign.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">MULTI-DIMENSIONAL ANALYSIS ENGINE</p>
        </div>

        <div className="relative flex items-center justify-center py-8 md:py-16">
          <div className="hidden md:block absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[240px] h-[240px] md:w-[400px] md:h-[400px]"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-[60px] saturate-[200%] border border-white/40 shadow-[0_0_80px_rgba(255,255,255,0.3),inset_0_0_80px_rgba(255,255,255,0.1)] flex items-center justify-center">
              <div className="text-center">
                <Brain size={48} className="text-neutral-700/60 mx-auto stroke-[1]" />
                <div className="mt-2 text-xs font-mono tracking-widest text-neutral-400 font-bold">AI CORE</div>
              </div>
            </div>

            {[
              { label: 'Market Research', angle: 0, icon: Globe },
              { label: 'Competitors', angle: 45, icon: Target },
              { label: 'Audience', angle: 90, icon: Users },
              { label: 'Budget', angle: 135, icon: Zap },
              { label: 'Channels', angle: 180, icon: Activity },
              { label: 'Timing', angle: 225, icon: Clock },
              { label: 'Content', angle: 270, icon: Layers },
              { label: 'Analytics', angle: 315, icon: LineChart },
            ].map((node, i) => {
              const angleRad = (node.angle * Math.PI) / 180;
              const radius = 140;
              const x = 120 + radius * Math.cos(angleRad);
              const y = 120 + radius * Math.sin(angleRad);
              const mx = 200 + 240 * Math.cos(angleRad);
              const my = 200 + 240 * Math.sin(angleRad);
              return (
                <React.Fragment key={node.label}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden md:flex absolute flex-col items-center"
                    style={{ left: mx - 28, top: my - 28 }}
                  >
                    <div className="w-[56px] h-[56px] bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] flex items-center justify-center transition-all duration-300 hover:translate-y-[-3px] hover:shadow-xl">
                      <node.icon size={22} className="text-neutral-600 stroke-[1.5]" />
                    </div>
                    <span className="mt-2 text-[9px] font-mono tracking-wider text-neutral-500 font-semibold whitespace-nowrap">{node.label}</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    className="md:hidden absolute flex flex-col items-center"
                    style={{ left: x - 22, top: y - 22 }}
                  >
                    <div className="w-[44px] h-[44px] bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 rounded-[16px] shadow-sm flex items-center justify-center">
                      <node.icon size={16} className="text-neutral-600 stroke-[1.5]" />
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}

            <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                const r = 240;
                const angleRad = (angle * Math.PI) / 180;
                return (
                  <line key={i} x1={200} y1={200} x2={200 + r * Math.cos(angleRad)} y2={200 + r * Math.sin(angleRad)} stroke="rgba(17,17,17,0.08)" strokeWidth="1" />
                );
              })}
            </svg>
          </motion.div>
        </div>
      </section>

      <section className="mt-32 md:mt-40 px-6 md:px-12 max-w-7xl mx-auto" id="pricing">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">INVESTMENT TIERS</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Simple pricing. <span className="text-neutral-400 font-light">No surprises.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">UPGRADE OR DOWNGRADE AT ANY POINT</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">INDIVIDUAL</span>
              <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight">$0</span><span className="text-xs text-neutral-400 font-medium ml-1">/ forever</span></div>
              <div className="h-px bg-black/5 my-6" />
              <ul className="space-y-3.5 text-xs text-neutral-600 font-medium">
                <li>— 1 Active Marketing Workspace</li>
                <li>— Standard Kanban Task Manager</li>
                <li>— 10 Built-In Social Post Drafts</li>
                <li>— Custom 30-Day Static Calendar</li>
              </ul>
            </div>
            {user ? (
              <div className="mt-8 w-full inline-flex items-center justify-center px-[20px] py-[10px] bg-[#1A1A1A] text-white font-semibold text-xs py-3 rounded-[16px] cursor-default">Current Plan</div>
            ) : (
              <button onClick={() => navigateTo('/onboarding')}
                 className="mt-8 w-full inline-flex items-center justify-center px-[20px] py-[10px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] rounded-[16px] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] py-3 font-semibold">Get Started</button>
            )}
          </div>

          <div className="bg-[#1A1A1A] text-[#E8E6E0] p-8 rounded-[16px] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 relative overflow-hidden border border-white/5">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-[#888888] uppercase">CAMPAIGNER CHOICE</span>
              <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight text-white">$39</span><span className="text-xs text-[#888888] font-medium ml-1">/ month</span></div>
              <div className="h-px bg-white/10 my-6" />
              <ul className="space-y-3.5 text-xs text-neutral-300 font-medium">
                <li>— Unlimited Strategy Workspaces</li>
                <li>— Automated Interactive Co-pilot chat</li>
                <li>— Unlimited AI Channel Copy Generation</li>
                <li>— Live Dynamic Calendar Integration</li>
                <li>— Export to CSV & Strategy PDF files</li>
              </ul>
            </div>
            <button onClick={() => navigateTo('/onboarding')}
              className="mt-8 relative w-full inline-flex items-center justify-center px-[28px] py-[14px] text-[rgba(255,255,255,0.95)] font-semibold text-xs text-center backdrop-blur-[30px] saturate-[200%] bg-gradient-to-b from-[rgba(255,255,255,0.16)] to-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] rounded-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.30),inset_0_-1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.40)] overflow-hidden cursor-pointer transition-all duration-[0.35s] hover:translate-y-[-3px] hover:scale-[1.03] hover:bg-gradient-to-b hover:from-[rgba(255,255,255,0.22)] hover:to-[rgba(255,255,255,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_40px_rgba(0,0,0,0.50)] py-3">
              Start Pro Campaigning
            </button>
          </div>

          <div className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-8 flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
            <div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">AGENCY PACK</span>
              <div className="mt-4 flex items-baseline"><span className="text-5xl font-black font-display tracking-tight">$149</span><span className="text-xs text-neutral-400 font-medium ml-1">/ month</span></div>
              <div className="h-px bg-black/5 my-6" />
              <ul className="space-y-3.5 text-xs text-neutral-600 font-medium">
                <li>— Everything in Pro Tier</li>
                <li>— Dedicated Brand Voice Tuning Profiles</li>
                <li>— Team seat collaboration (Up to 10 users)</li>
                <li>— Client Pitch View (Public view link sharing)</li>
                <li>— API Integration access credentials</li>
              </ul>
            </div>
            <button onClick={() => navigateTo('/onboarding')}
              className="mt-8 w-full inline-flex items-center justify-center px-[20px] py-[10px] bg-transparent text-[#111111] font-medium text-xs border border-[rgba(17,17,17,0.2)] rounded-[16px] cursor-pointer transition-all duration-200 hover:bg-[rgba(17,17,17,0.05)] py-3 font-semibold">Start Agency Drive</button>
          </div>
        </div>
      </section>

      <section className="mt-24 px-6 md:px-12 max-w-7xl mx-auto" id="testimonials">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">TESTIMONIALS</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Trusted by <span className="text-neutral-400 font-light">campaign builders.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">REAL FEEDBACK FROM EARLY ADOPTERS</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'I used to spend 3 days planning a campaign. Momentum generates a complete workspace in under a minute — and the quality is shockingly good.', name: 'Maya S.', role: 'Freelance Brand Strategist' },
            { quote: 'The AI co-pilot is the killer feature. I can ask it to tweak the strategy or write a LinkedIn post and it just does it, right inside the workspace.', name: 'Daniel K.', role: 'Growth Lead, Craftly' },
            { quote: 'We switched from Notion + spreadsheets to Momentum. Having strategy, tasks, content, and calendar in one place cut our meeting time in half.', name: 'Priya R.', role: 'Operations Director, Onda Studio' },
          ].map((t, i) => (
            <div key={i} className="bg-[rgba(255,255,255,0.55)] backdrop-blur-[20px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] p-7 flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
              <p className="text-sm text-neutral-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 pt-4 border-t border-black/5">
                <div className="font-bold text-sm text-neutral-900">{t.name}</div>
                <div className="text-[10px] font-mono tracking-wider text-neutral-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 mb-16 md:mb-24 px-6 md:px-12 max-w-7xl mx-auto" id="faq">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block mb-1">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight font-display text-neutral-900">Common <span className="text-neutral-400 font-light">questions.</span></h2>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider">EVERYTHING YOU NEED TO KNOW</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/15 backdrop-blur-2xl saturate-[180%] border border-white/30 rounded-[16px] shadow-[0_4px_24px_rgba(17,17,17,0.06)] overflow-hidden transition-all duration-300">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left cursor-pointer bg-transparent border-none"
              >
                <span className="text-sm md:text-base font-bold tracking-tight text-neutral-900">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openFaq === i ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="shrink-0 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center"
                >
                  <Plus size={16} className="text-neutral-500" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                      <div className="h-px bg-black/5 mb-4" />
                      <p className="text-sm text-neutral-500 leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-black/8 py-10 md:py-12 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              {['MS', 'KA', 'ZT', 'LV', 'ST'].map((initial, i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-full bg-[#1A1A1A] text-white text-[10px] font-black border-2 border-[#F0EEE8] flex items-center justify-center select-none">{initial}</div>
              ))}
            </div>
            <span className="text-xs font-medium text-neutral-600">Join <span className="font-bold text-neutral-900">200+ agency founders</span> executing with Momentum.</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-neutral-500">
            <span className="text-[#B45309] font-bold">★★★★★</span>
            <span>4.9 / 5 rating based on 84 reviews</span>
          </div>
        </div>
      </section>

      <footer className="bg-[#1A1A1A] backdrop-blur-2xl border-t border-white/5 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-white font-display font-black text-lg tracking-tight">Momentum</span>
              <p className="mt-3 text-[11px] text-neutral-500 font-mono leading-relaxed">AI-powered campaign workspaces for modern marketing teams.</p>
              <a
                href="https://github.com/Fahimfylo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors font-mono"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.62.87.84 1.425 2.205 1.025 2.745.78.085-.615.33-1.025.6-1.26-2.1-.24-4.305-1.05-4.305-4.68 0-1.035.37-1.875.975-2.535-.105-.24-.42-1.2.09-2.505 0 0 .795-.255 2.61.975.75-.21 1.56-.315 2.37-.315s1.62.105 2.37.315c1.815-1.23 2.61-.975 2.61-.975.51 1.305.195 2.265.09 2.505.6.66.975 1.5.975 2.535 0 3.63-2.205 4.425-4.305 4.68.345.3.66.885.66 1.785 0 1.29-.015 2.325-.015 2.64 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
                <span>GitHub</span>
              </a>
            </div>
            {[
              { title: 'Product', links: ['How It Works', 'Pricing', 'FAQ', 'Testimonials'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map((col) => (
              <div key={col.title}>
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">{col.title}</span>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => {
                    const sectionMap: Record<string, string> = {
                      'How It Works': 'how-it-works',
                      'Pricing': 'pricing',
                      'FAQ': 'faq',
                      'Testimonials': 'testimonials',
                    };
                    const sectionId = sectionMap[link];
                    return (
                      <li key={link}>
                        {sectionId ? (
                          <button
                            onClick={() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors font-medium cursor-pointer"
                          >
                            {link}
                          </button>
                        ) : (
                          <span className="text-[12px] text-neutral-500 font-medium">{link}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-mono tracking-wider text-neutral-600">© 2026 Momentum. All rights reserved.</span>
            <span className="text-[10px] font-mono tracking-wider text-neutral-600">Built with <span className="text-neutral-500">Momentum</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
}