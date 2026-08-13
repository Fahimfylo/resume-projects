"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

const games = [
  { name: "Black Myth Wukong", img: "https://picsum.photos/seed/wukong1/800/450", type: "MYTHIC" },
  { name: "Valorant", img: "https://picsum.photos/seed/val1/800/450", type: "COMPETITIVE" },
  { name: "Cyberpunk 2077", img: "https://picsum.photos/seed/cyber1/800/450", type: "OPEN WORLD" },
  { name: "Apex Legends", img: "https://picsum.photos/seed/apex1/800/450", type: "BATTLE ROYALE" },
  { name: "League of Legends", img: "https://picsum.photos/seed/lol1/800/450", type: "MOBA" },
  { name: "Counter-Strike 2", img: "https://picsum.photos/seed/cs2/800/450", type: "TACTICAL" },
]

export function GameSlider() {
  return (
    <section className="py-24 overflow-hidden bg-nexus-void relative">
      <div className="container px-6 mb-12 flex justify-between items-end">
        <div>
           <h2 className="text-xs font-ui text-nexus-teal tracking-[0.4em] mb-4 uppercase">Ecosystem Support</h2>
           <h3 className="text-4xl font-headline font-black text-white">THE UNIVERSE EXPANDS</h3>
        </div>
        <div className="text-white/40 font-ui hidden md:block">
           60+ AAA titles supported with AI telemetry
        </div>
      </div>

      <div className="flex">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 whitespace-nowrap"
        >
          {[...games, ...games].map((game, i) => (
            <div 
              key={`${game.name}-${i}`} 
              className="relative w-[400px] h-[250px] group cursor-pointer overflow-hidden rounded-xl border border-white/10"
            >
              <img 
                src={game.img} 
                alt={game.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6">
                <Badge variant="outline" className="border-nexus-jade text-nexus-jade font-ui text-[10px] mb-2">{game.type}</Badge>
                <h4 className="text-2xl font-headline font-bold text-white tracking-tighter">{game.name}</h4>
              </div>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center">
                  <div className="w-2 h-2 bg-nexus-jade rounded-full animate-ping" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
