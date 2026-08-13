"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function LoadingScreen() {
  const [stage, setStage] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1000), // Kai eyes
      setTimeout(() => setStage(2), 2000), // Particles
      setTimeout(() => setStage(3), 3000), // Logo
      setTimeout(() => setStage(4), 4500), // Terminal
      setTimeout(() => setStage(5), 6000), // Progress bar
      setTimeout(() => setIsVisible(false), 7500), // Transition out
    ]
    return () => timers.forEach(t => clearTimeout(t))
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-nexus-void flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Stage 1: Kai Jade Eyes */}
          <AnimatePresence>
            {stage >= 1 && stage < 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-16"
              >
                <div className="w-24 h-8 bg-nexus-jade blur-xl rounded-full opacity-50 kai-glow" />
                <div className="w-24 h-8 bg-nexus-jade blur-xl rounded-full opacity-50 kai-glow" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stage 2: Particles */}
          {stage >= 2 && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * 2000 - 1000, 
                    y: Math.random() * 2000 - 1000,
                    opacity: 0
                  }}
                  animate={{ 
                    x: 0, 
                    y: 0, 
                    opacity: [0, 1, 0] 
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    delay: Math.random() * 2 
                  }}
                  className="absolute left-1/2 top-1/2 w-1 h-1 bg-nexus-jade rounded-full blur-[2px]"
                />
              ))}
            </div>
          )}

          {/* Stage 3: NEXUS Logo */}
          {stage >= 3 && (
            <motion.div
              initial={{ letterSpacing: "2rem", opacity: 0 }}
              animate={{ letterSpacing: "0.5rem", opacity: 1 }}
              className="text-6xl md:text-8xl font-headline font-black text-nexus-jade mb-8"
            >
              NEXUS
            </motion.div>
          )}

          {/* Stage 4: Terminal Hud */}
          {stage >= 4 && (
            <div className="font-mono text-[10px] text-nexus-jade/60 text-center uppercase tracking-widest max-w-xs h-12">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                {">"} AI CORE ONLINE...
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.1 }}
              >
                {">"} CHI ENERGY STABILIZED...
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.1 }}
              >
                {">"} WELCOME GAMER.
              </motion.p>
            </div>
          )}

          {/* Stage 5: Energy Bar */}
          {stage >= 5 && (
            <div className="w-64 h-1 bg-white/10 mt-8 relative overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "linear" }}
                className="absolute inset-0 bg-nexus-jade shadow-[0_0_10px_var(--jade-glow)]"
              />
            </div>
          )}

          {/* Scanline Sweep Overlay */}
          <motion.div
            animate={{ top: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] bg-nexus-jade/20 blur-sm pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
