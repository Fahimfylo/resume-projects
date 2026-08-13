
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { BrainCircuit, MessageSquare, Target, Zap, AlertTriangle, ShieldCheck } from "lucide-react"
import { aiStrategicCoach, type AiStrategicCoachOutput } from "@/ai/flows/ai-strategic-coach"
import { useToast } from "@/hooks/use-toast"

export default function CoachPage() {
  const { toast } = useToast()
  const [context, setContext] = useState("")
  const [performance, setPerformance] = useState("")
  const [comm, setComm] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiStrategicCoachOutput | null>(null)

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const output = await aiStrategicCoach({
        gameContext: context,
        playerPerformance: performance,
        playerCommunication: comm
      })
      setResult(output)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "COACH DISCONNECTED",
        description: "AI tactical relay failed. Retrying sync...",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />
      
      <div className="container px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-xs font-ui text-nexus-jade tracking-[0.4em] mb-4 uppercase">KAI-SENSE AI ADVISOR</h2>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-tight uppercase">
              STRATEGIC <br /> <span className="text-nexus-jade">COACH</span>
            </h1>
          </div>
          <p className="text-white/40 max-w-sm font-ui text-lg">
            Real-time tactical intelligence powered by NEXUS AI core. Get the edge in high-stakes competition.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Panel */}
          <div className="space-y-6">
            <Card className="glass-panel border-white/10 p-8 rounded-none hud-frame bg-nexus-carbon/40">
              <form onSubmit={handleConsult} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-nexus-jade font-headline uppercase tracking-[0.2em]">Game Context</label>
                  <Textarea 
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="E.g., Valorant Match, Score 10-10, playing Jett on Haven, spike down B site..."
                    className="bg-white/5 border-white/10 text-white font-ui min-h-[80px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-nexus-teal font-headline uppercase tracking-[0.2em]">Recent Performance</label>
                  <Textarea 
                    value={performance}
                    onChange={e => setPerformance(e.target.value)}
                    placeholder="E.g., 20/12/5 KDA, missed two op shots last round, pushing too fast..."
                    className="bg-white/5 border-white/10 text-white font-ui min-h-[80px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-nexus-purple font-headline uppercase tracking-[0.2em]">Communication / Sentiment</label>
                  <Input 
                    value={comm}
                    onChange={e => setComm(e.target.value)}
                    placeholder="Team is arguing, feeling a bit frustrated..."
                    className="bg-white/5 border-white/10 text-white font-ui h-12"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-nexus-jade text-nexus-void font-headline text-lg rounded-none hud-frame group"
                >
                  {loading ? "PROCESSING TACTICS..." : "GET STRATEGIC ADVICE"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Advice Output */}
          <div className="space-y-6">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Advice Card */}
                <Card className="glass-panel border-nexus-jade/30 p-8 rounded-none hud-frame bg-nexus-jade/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4">
                      <ShieldCheck className="w-12 h-12 text-nexus-jade/20" />
                   </div>
                   <h3 className="text-xl font-headline font-black text-nexus-jade mb-6 tracking-tighter uppercase flex items-center gap-3">
                      <Target className="w-6 h-6" />
                      Tactical Directive
                   </h3>
                   <div className="text-xl text-white font-ui leading-relaxed">
                      {result.strategicAdvice}
                   </div>
                </Card>

                {/* Tilt Monitor */}
                <Card className={`glass-panel p-8 rounded-none hud-frame ${result.tiltDetected ? 'border-nexus-orange/50 bg-nexus-orange/10' : 'border-white/10 bg-nexus-carbon/40'}`}>
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-headline font-black text-white tracking-tighter uppercase flex items-center gap-3">
                         <Zap className="w-6 h-6 text-nexus-teal" />
                         Psychological Sync
                      </h3>
                      <div className={`px-4 py-1 font-headline text-xs rounded-full ${result.tiltDetected ? 'bg-nexus-orange text-nexus-void' : 'bg-nexus-jade text-nexus-void'}`}>
                         SENTIMENT: {result.overallSentiment}
                      </div>
                   </div>

                   {result.tiltDetected ? (
                     <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-nexus-orange/20 border border-nexus-orange/30">
                           <AlertTriangle className="w-6 h-6 text-nexus-orange shrink-0" />
                           <div>
                              <div className="text-xs font-headline text-nexus-orange uppercase mb-1">Tilt Detected</div>
                              <div className="text-white/80 font-ui">{result.tiltReason}</div>
                           </div>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5">
                           <div className="text-xs font-headline text-nexus-teal uppercase mb-2">Recovery Strategy</div>
                           <div className="text-white/60 font-ui italic">{result.tiltRecoverySuggestion}</div>
                        </div>
                     </div>
                   ) : (
                     <p className="text-white/40 font-ui">Neural resonance is stable. Continue focused execution.</p>
                   )}
                </Card>
              </motion.div>
            ) : (
              <Card className="glass-panel border-white/5 p-12 rounded-none hud-frame bg-nexus-carbon/20 flex flex-col items-center justify-center text-center h-full">
                 <BrainCircuit className="w-16 h-16 text-white/5 mb-6" />
                 <h3 className="font-headline text-white/20 text-sm tracking-[0.4em] uppercase">Awaiting tactical uplink</h3>
                 <p className="text-white/10 font-ui text-sm mt-2">Input your game state to receive AI guidance</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
