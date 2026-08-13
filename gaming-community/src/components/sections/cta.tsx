"use client"

import { motion } from "framer-motion"
import { Button } from "../ui/button"

export function FinalCTA() {
  return (
    <section className="relative py-48 bg-nexus-void overflow-hidden flex items-center justify-center">
      {/* Background Storm Clouds/Chi Energy */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/storm/1920/1080" 
          className="w-full h-full object-cover opacity-20 mix-blend-screen scale-110" 
          alt="Storm" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-nexus-void via-transparent to-nexus-void" />
      </div>

      <div className="container relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-xs font-ui text-nexus-jade tracking-[0.6em] mb-12 uppercase">YOUR DESTINY AWAITS</h2>
          <h3 className="text-6xl md:text-9xl font-headline font-black text-white mb-12 tracking-tighter leading-none uppercase">
            FORGE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-jade via-nexus-teal to-nexus-purple">
              GAMING LEGACY
            </span>
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="h-20 px-16 bg-nexus-jade text-nexus-void font-headline text-2xl hover:scale-105 transition-transform rounded-none hud-frame">
              JOIN NEXUS NOW
            </Button>
            <Button size="lg" variant="outline" className="h-20 px-16 border-white/20 text-white font-headline text-2xl hover:bg-white/10 rounded-none">
              RECRUIT CLAN
            </Button>
          </div>
          
          <div className="mt-24 flex justify-center items-center gap-12 text-white/20 grayscale opacity-40">
             <span className="font-headline text-4xl">STEAM</span>
             <span className="font-headline text-4xl">RIOT</span>
             <span className="font-headline text-4xl">XBOX</span>
             <span className="font-headline text-4xl">TWITCH</span>
          </div>
        </motion.div>
      </div>
      
      {/* Giant Faded Kai Eye Watermark */}
      <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-nexus-jade/5 blur-[150px] rounded-full pointer-events-none" />
    </section>
  )
}
