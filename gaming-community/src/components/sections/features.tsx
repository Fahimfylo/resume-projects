"use client"

import { motion } from "framer-motion"
import { BrainCircuit, Video, Fingerprint, Zap, Target, Cpu, Swords, BarChart3 } from "lucide-react"
import { Card } from "../ui/card"

const features = [
  {
    icon: BrainCircuit,
    title: "KAI-SENSE AI COACH",
    desc: "Real-time tactical advice powered by deep learning neural networks.",
    color: "from-nexus-jade/20 to-transparent"
  },
  {
    icon: Video,
    title: "HIGHLIGHT FORGE",
    desc: "Automated cinematic capture of your most mythic gaming moments.",
    color: "from-nexus-teal/20 to-transparent"
  },
  {
    icon: Fingerprint,
    title: "GAMER DNA",
    desc: "Visualizing your skill evolution through holographic radar charts.",
    color: "from-nexus-purple/20 to-transparent"
  },
  {
    icon: Target,
    title: "TILT DETECTION",
    desc: "Sentiment analysis to keep your mental game at peak performance.",
    color: "from-nexus-orange/20 to-transparent"
  },
  {
    icon: Cpu,
    title: "GEN-AI AVATARS",
    desc: "Create distinctive identities that reflect your unique playstyle.",
    color: "from-nexus-jade/20 to-transparent"
  },
  {
    icon: Swords,
    title: "CLAN MATRIX",
    desc: "Seamlessly organize tournaments and manage massive gaming guilds.",
    color: "from-nexus-gold/20 to-transparent"
  },
  {
    icon: BarChart3,
    title: "ANALYTICS LAB",
    desc: "High-precision telemetry to optimize weapon accuracy and movement.",
    color: "from-nexus-teal/20 to-transparent"
  },
  {
    icon: Zap,
    title: "SYNC HUB",
    desc: "Universal connection to Steam, Riot, Discord and Twitch.",
    color: "from-nexus-purple/20 to-transparent"
  }
]

export function Features() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-xs font-ui text-nexus-jade tracking-[0.4em] mb-4 uppercase">AI Ecosystem Capabilities</h2>
            <h3 className="text-4xl md:text-6xl font-headline font-black text-white leading-tight">
              THE FUTURE OF <br /> <span className="text-nexus-jade">GAME INTELLIGENCE</span>
            </h3>
          </div>
          <p className="text-white/40 max-w-sm font-ui text-lg">
            NEXUS isn't just a platform; it's an intelligent layer that enhances every aspect of your gaming life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group"
            >
              <Card className={`relative h-full bg-nexus-carbon border-white/5 p-8 overflow-hidden rounded-none transition-all hover:border-nexus-jade/30`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${f.color}`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:bg-nexus-jade transition-colors">
                    <f.icon className="w-6 h-6 text-nexus-jade group-hover:text-nexus-void transition-colors" />
                  </div>
                  <h4 className="text-xl font-headline font-bold text-white mb-4 tracking-tighter">{f.title}</h4>
                  <p className="text-white/50 font-ui leading-relaxed">{f.desc}</p>
                </div>
                
                {/* Micro HUD decoration */}
                <div className="absolute bottom-4 right-4 flex gap-1 opacity-20">
                  <div className="w-4 h-1 bg-nexus-jade" />
                  <div className="w-1 h-1 bg-nexus-jade" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
