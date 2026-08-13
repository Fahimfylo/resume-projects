"use client"

import { LoadingScreen } from "@/components/ui/loading-screen"
import { Navigation } from "@/components/ui/navigation"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { GameSlider } from "@/components/sections/game-slider"
import { GamerDNA } from "@/components/sections/gamer-dna"
import { EcosystemNodes } from "@/components/sections/ecosystem-nodes"
import { FinalCTA } from "@/components/sections/cta"
import { Footer } from "@/components/sections/footer"
import { motion, useScroll, useSpring } from "framer-motion"

export default function Home() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  return (
    <main className="relative bg-nexus-void text-white selection:bg-nexus-jade selection:text-nexus-void">
      <LoadingScreen />
      
      {/* Scroll Progress HUD */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-nexus-jade z-[101] origin-left"
        style={{ scaleX }}
      />
      
      <Navigation />
      
      <div className="space-y-0">
        <Hero />
        
        {/* Live Stats Strip */}
        <div className="bg-nexus-carbon border-y border-white/5 py-6 overflow-hidden">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex gap-24 whitespace-nowrap text-[10px] font-headline font-black text-white/40 tracking-[0.3em]"
          >
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex gap-24">
                <span>SYSTEM STATUS: <span className="text-nexus-jade">OPTIMAL</span></span>
                <span>MATCHES RUNNING: <span className="text-nexus-teal">14,821</span></span>
                <span>CHI RESONANCE: <span className="text-nexus-purple">STABLE</span></span>
                <span>TOURNAMENTS LIVE: <span className="text-nexus-gold">24</span></span>
              </div>
            ))}
          </motion.div>
        </div>

        <Features />
        
        <GameSlider />
        
        <GamerDNA />

        {/* Dashboard Preview Section (Simplified Visual) */}
        <section className="py-24 relative overflow-hidden bg-nexus-carbon/30">
          <div className="container px-6">
             <div className="flex flex-col items-center text-center mb-16">
                <h2 className="text-xs font-ui text-nexus-purple tracking-[0.5em] mb-4 uppercase">Command Center</h2>
                <h3 className="text-5xl font-headline font-black text-white">THE ULTIMATE HUD</h3>
             </div>
             
             <div className="relative glass-panel rounded-3xl overflow-hidden border border-white/10 p-4 shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/dashboard/1600/900" 
                  className="w-full h-auto rounded-2xl opacity-60" 
                  alt="Dashboard Preview" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-nexus-void via-transparent to-transparent" />
                
                {/* HUD Overlays */}
                <div className="absolute top-12 left-12 p-6 glass-panel border-nexus-jade/20 hud-frame rounded-none">
                  <div className="text-xs text-nexus-jade mb-2">TELEMETRY_ACTIVE</div>
                  <div className="text-2xl font-headline">99.2% ACCURACY</div>
                </div>
                
                <div className="absolute bottom-12 right-12 p-6 glass-panel border-nexus-teal/20 hud-frame rounded-none">
                  <div className="text-xs text-nexus-teal mb-2">NEURAL_SYNC_ESTABLISHED</div>
                  <div className="text-2xl font-headline">LATENCY: 4ms</div>
                </div>
             </div>
          </div>
        </section>

        <EcosystemNodes />
        
        <FinalCTA />
        
        <Footer />
      </div>
    </main>
  )
}
