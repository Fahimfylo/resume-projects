"use client"

import { motion } from "framer-motion"
import { Monitor, Smartphone, Layout, Cpu, Laptop, Tablet } from "lucide-react"

const nodes = [
  { icon: 'Steam', color: '#171a21', x: -200, y: -100 },
  { icon: 'Riot', color: '#d13639', x: 200, y: -80 },
  { icon: 'Discord', color: '#5865F2', x: 150, y: 150 },
  { icon: 'Twitch', color: '#9146FF', x: -150, y: 180 },
  { icon: 'Xbox', color: '#107c10', x: -250, y: 50 },
  { icon: 'PSN', color: '#003087', x: 250, y: 80 },
]

export function EcosystemNodes() {
  return (
    <section className="py-24 relative bg-nexus-void overflow-hidden min-h-[800px] flex items-center justify-center">
      <div className="absolute inset-0 bg-nexus-jade/5 opacity-30" />
      
      <div className="relative z-10 text-center mb-32">
        <h2 className="text-7xl md:text-9xl font-headline font-black text-white/10 uppercase tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
          UNIFIED IDENTITY
        </h2>
        <div className="relative">
          <h3 className="text-4xl md:text-6xl font-headline font-black text-white mb-6">ONE CORE, ALL PLATFORMS</h3>
          <p className="text-white/60 font-ui max-w-xl mx-auto">
            Your NEXUS identity syncs across every device and service. 
            Carry your legacy, achievements, and AI companions wherever you go.
          </p>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Central Hub */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-32 h-32 jade-orb rounded-full relative z-20 flex items-center justify-center kai-glow"
        >
          <div className="font-headline font-black text-nexus-void text-2xl">CORE</div>
          
          {/* Pulsing energy rings */}
          <div className="absolute inset-0 border-2 border-nexus-jade rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 border-4 border-nexus-jade/10 rounded-full animate-ping opacity-10 [animation-delay:1s]" />
        </motion.div>

        {/* Orbiting Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.icon}
            initial={{ opacity: 0, x: 0, y: 0 }}
            whileInView={{ opacity: 1, x: node.x, y: node.y }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 1, type: "spring" }}
            className="absolute z-20 pointer-events-auto cursor-pointer group"
          >
            <div className="relative">
              <div 
                className="w-16 h-16 rounded-2xl glass-panel border border-white/10 flex items-center justify-center group-hover:border-nexus-jade transition-colors"
                style={{ backgroundColor: `${node.color}20` }}
              >
                 <span className="text-[10px] font-headline font-black text-white group-hover:text-nexus-jade">{node.icon}</span>
              </div>
              
              {/* Connecting Line (simulated with CSS) */}
              <div 
                className="absolute top-1/2 left-1/2 h-0.5 bg-gradient-to-r from-nexus-jade/50 to-transparent origin-left opacity-20 group-hover:opacity-100 transition-opacity"
                style={{ 
                  width: Math.sqrt(node.x**2 + node.y**2),
                  transform: `rotate(${Math.atan2(-node.y, -node.x) * (180/Math.PI)}deg)`
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Device Previews */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 text-white/20">
        <Monitor className="w-8 h-8" />
        <Laptop className="w-8 h-8 text-nexus-jade/40" />
        <Smartphone className="w-8 h-8" />
        <Tablet className="w-8 h-8" />
      </div>
    </section>
  )
}
