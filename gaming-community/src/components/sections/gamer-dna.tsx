"use client"

import { motion } from "framer-motion"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Progress } from "@/components/ui/progress"
import { Shield, Target, Zap, Swords } from "lucide-react"

const data = [
  { subject: 'Strategy', A: 120, fullMark: 150 },
  { subject: 'Aim', A: 98, fullMark: 150 },
  { subject: 'Speed', A: 86, fullMark: 150 },
  { subject: 'Teamwork', A: 99, fullMark: 150 },
  { subject: 'Leadership', A: 85, fullMark: 150 },
  { subject: 'Luck', A: 65, fullMark: 150 },
]

export function GamerDNA() {
  return (
    <section className="py-24 relative bg-nexus-void overflow-hidden">
      <div className="container px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
             <div className="absolute inset-0 bg-nexus-jade/5 blur-[100px] rounded-full" />
             <div className="relative glass-panel border-white/5 rounded-2xl p-8 hud-frame">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-nexus-jade p-1">
                      <img src="https://picsum.photos/seed/kai1/200/200" className="w-full h-full rounded-full object-cover" alt="Profile" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-headline font-black text-white">X_KAI_SPIRIT_X</h3>
                      <p className="text-nexus-jade text-xs font-ui tracking-widest">LEVEL 85 MYTHIC</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 uppercase mb-1">Rank</div>
                    <div className="text-xl font-headline text-nexus-gold">ELITE MASTER</div>
                  </div>
                </div>

                <div className="h-[400px] w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                      <PolarGrid stroke="#76ff0320" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                      <Radar
                        name="Mike"
                        dataKey="A"
                        stroke="#76ff03"
                        fill="#76ff03"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: "Win Rate", val: "78%" },
                    { icon: Target, label: "K/D Ratio", val: "2.45" },
                    { icon: Zap, label: "APM", val: "320" },
                    { icon: Swords, label: "Matches", val: "1.2k" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 p-4 border border-white/10 rounded-xl flex items-center gap-4">
                      <s.icon className="w-5 h-5 text-nexus-jade" />
                      <div>
                        <div className="text-[10px] text-white/40 uppercase">{s.label}</div>
                        <div className="text-lg font-headline text-white">{s.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-8">
            <h2 className="text-5xl md:text-7xl font-headline font-black text-white leading-none">
              REDEFINE YOUR <br />
              <span className="text-nexus-jade">GAMER DNA</span>
            </h2>
            <p className="text-white/50 font-ui text-xl max-w-lg leading-relaxed">
              Our proprietary AI analyzes every movement, click, and strategic choice to map your unique performance signature. Visualize your growth across 250+ specific skill nodes.
            </p>

            <div className="space-y-6 max-w-md">
              {[
                { label: "Tactical Execution", val: 88 },
                { label: "Reflex Speed", val: 94 },
                { label: "Strategic Depth", val: 72 },
              ].map((skill) => (
                <div key={skill.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-ui">{skill.label}</span>
                    <span className="text-nexus-jade font-headline">{skill.val}%</span>
                  </div>
                  <Progress value={skill.val} className="h-2 bg-white/5" />
                </div>
              ))}
            </div>

            <motion.div 
              whileHover={{ x: 10 }}
              className="inline-flex items-center gap-4 text-nexus-jade font-headline cursor-pointer group"
            >
              <span>VIEW FULL SKILL TREE</span>
              <div className="h-0.5 w-12 bg-nexus-jade transition-all group-hover:w-24" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
