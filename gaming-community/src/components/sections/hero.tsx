"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Play, Sparkles, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

export function Hero() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 300])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Layers */}
      <motion.div style={{ y: y1 }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nexus-void/50 to-nexus-void z-10" />
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover opacity-60 scale-105"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-futuristic-digital-particles-background-31713-large.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Floating UI Elements */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] border border-nexus-jade/10 rounded-full opacity-20"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] border-2 border-nexus-teal/10 rounded-full opacity-20"
        />
      </div>

      <motion.div style={{ opacity }} className="relative z-30 container px-6 text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-panel border border-nexus-jade/20 text-nexus-jade mb-8 font-ui text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI-POWERED GAMING ECOSYSTEM</span>
        </motion.div>

        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-6xl md:text-8xl lg:text-9xl font-headline font-black text-white tracking-tighter mb-6 uppercase"
        >
          FORGE YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexus-jade via-nexus-teal to-nexus-purple animate-gradient-x">
            GAMING LEGACY
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xl md:text-2xl text-white/60 font-ui max-w-3xl mx-auto mb-12"
        >
          Enter a mythic AI-powered esports universe where every match builds your DNA. 
          Unstoppable performance meets cinematic spiritual mastery.
        </motion.p>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="h-16 px-12 bg-nexus-jade text-nexus-void font-headline text-lg hover:scale-105 transition-transform rounded-none hud-frame group">
            ENTER THE NEXUS
            <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-12 border-white/20 text-white font-headline text-lg hover:bg-white/10 rounded-none group">
            <Play className="w-5 h-5 mr-2 fill-white" />
            WATCH CINEMATIC
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
        >
          {[
            { label: "PLAYERS ONLINE", value: "2.4M+" },
            { label: "AI HIGHLIGHTS", value: "850K" },
            { label: "TOURNAMENTS", value: "1,200" },
            { label: "CHI ENERGY", value: "MAX" },
          ].map((stat) => (
            <div key={stat.label} className="text-left border-l border-nexus-jade/20 pl-6">
              <div className="text-xs text-white/40 font-ui mb-1 uppercase tracking-widest">{stat.label}</div>
              <div className="text-2xl font-headline text-white">{stat.value}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Hero Fade Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-nexus-void to-transparent z-30" />
    </section>
  )
}
