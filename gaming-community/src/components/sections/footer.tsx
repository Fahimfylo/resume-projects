"use client"

import { motion } from "framer-motion"
import { Shield, Twitter, Youtube, Github, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative bg-nexus-void pt-32 pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-nexus-jade/10 to-transparent pointer-events-none" />
      
      <div className="container px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-24">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
               <Shield className="w-10 h-10 text-nexus-jade" />
               <span className="text-4xl font-headline font-black tracking-tighter text-white">NEXUS</span>
            </div>
            <p className="text-xl text-white/50 font-ui max-w-sm mb-8 leading-relaxed">
               The ultimate AAA gaming community platform. <br />
               Forge your legacy. Become mythic.
            </p>
            <div className="flex gap-4">
               {[Twitter, Youtube, Instagram, Github].map((Icon, i) => (
                 <a key={i} href="#" className="w-12 h-12 glass-panel flex items-center justify-center rounded-xl text-white/40 hover:text-nexus-jade hover:border-nexus-jade/50 transition-all">
                    <Icon className="w-5 h-5" />
                 </a>
               ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-headline font-bold mb-6 tracking-widest text-sm uppercase">PLATFORM</h4>
            <ul className="space-y-4 text-white/40 font-ui text-lg">
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">AI Coaching</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Tournaments</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Clan Matrix</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Highlight Forge</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Gamer DNA</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-headline font-bold mb-6 tracking-widest text-sm uppercase">RESOURCES</h4>
            <ul className="space-y-4 text-white/40 font-ui text-lg">
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Developer API</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Partner Program</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Legacy Badge</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Privacy Core</li>
              <li className="hover:text-nexus-jade cursor-pointer transition-colors">Terms of War</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-8">
           <div className="text-sm text-white/20 font-ui tracking-widest uppercase">
              © 202X NEXUS MULTIVERSE INC. ALL RIGHTS RESERVED.
           </div>
           
           <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-[10px] text-white/40 font-ui tracking-[0.4em] uppercase">Powered by AI CORE</span>
              <div className="w-4 h-4 rounded-full border border-nexus-jade/40 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform">
                <div className="w-full h-full bg-nexus-jade rounded-full shadow-[0_0_10px_var(--jade-glow)]" />
              </div>
           </div>
        </div>
      </div>

      {/* Jade lightning effect (simulated) */}
      <motion.div 
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 }}
        className="absolute bottom-0 left-0 right-0 h-1 bg-nexus-jade/20 blur-sm" 
      />
    </footer>
  )
}
