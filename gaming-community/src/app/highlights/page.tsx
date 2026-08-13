"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Video, Sparkles, Clapperboard, Wand2 } from "lucide-react"
import { automatedHighlightGeneration, type AutomatedHighlightGenerationOutput } from "@/ai/flows/automated-highlight-generation"
import { useToast } from "@/hooks/use-toast"

export default function HighlightsPage() {
  const { toast } = useToast()
  const [sessionDesc, setSessionDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AutomatedHighlightGenerationOutput | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionDesc.trim()) return
    setLoading(true)
    try {
      const output = await automatedHighlightGeneration(sessionDesc)
      setResult(output)
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "GENERATION FAILED",
        description: "Highlight forge encountered an error. Check your neural uplink.",
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
            <h2 className="text-xs font-ui text-nexus-gold tracking-[0.4em] mb-4 uppercase">AUTOMATED HIGHLIGHT FORGE</h2>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-tight uppercase">
              HIGHLIGHT <br /> <span className="text-nexus-gold">FORGE</span>
            </h1>
          </div>
          <p className="text-white/40 max-w-sm font-ui text-lg">
            AI scans your gaming sessions and isolates mythic-tier cinematic moments for sharing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Panel */}
          <Card className="glass-panel border-white/10 p-8 rounded-none hud-frame bg-nexus-carbon/40">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-nexus-gold font-headline uppercase tracking-[0.2em]">
                  Session Description
                </label>
                <Textarea
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  placeholder="Describe your epic gaming moment... clutch round, last-second victory, team wipe, incredible outplay..."
                  className="bg-white/5 border-white/10 text-white font-ui min-h-[200px]"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-nexus-gold text-nexus-void font-headline text-lg rounded-none hud-frame group"
              >
                {loading ? (
                  <>
                    <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                    FORGING HIGHLIGHT...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                    FORGE CINEMATIC HIGHLIGHT
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Output */}
          <div className="space-y-6">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Card className="glass-panel border-nexus-gold/30 p-8 rounded-none hud-frame bg-nexus-gold/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <Clapperboard className="w-12 h-12 text-nexus-gold/20" />
                  </div>
                  <h3 className="text-xl font-headline font-black text-nexus-gold mb-6 tracking-tighter uppercase flex items-center gap-3">
                    <Video className="w-6 h-6" />
                    Cinematic Description
                  </h3>
                  <div className="text-white font-ui leading-relaxed whitespace-pre-line">
                    {result.cinematicDescription}
                  </div>
                </Card>

                <Card className="glass-panel border-white/10 p-8 rounded-none hud-frame bg-nexus-carbon/40">
                  <h3 className="text-sm font-headline font-black text-white mb-4 tracking-tighter uppercase flex items-center gap-3">
                    <Wand2 className="w-5 h-5 text-nexus-teal" />
                    Video Generation Prompt
                  </h3>
                  <div className="p-4 bg-white/5 border border-white/5 font-ui text-white/60 italic leading-relaxed text-sm">
                    &ldquo;{result.videoGenerationPrompt}&rdquo;
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(result.videoGenerationPrompt)
                      toast({ title: "COPIED", description: "Prompt copied to clipboard." })
                    }}
                    variant="outline"
                    className="w-full mt-4 border-white/10 text-white font-ui rounded-none hover:bg-white/5"
                  >
                    COPY PROMPT
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <Card className="glass-panel border-white/5 p-12 rounded-none hud-frame bg-nexus-carbon/20 flex flex-col items-center justify-center text-center h-full">
                <Clapperboard className="w-16 h-16 text-white/5 mb-6" />
                <h3 className="font-headline text-white/20 text-sm tracking-[0.4em] uppercase">Awaiting epic data</h3>
                <p className="text-white/10 font-ui text-sm mt-2">Describe your moment to forge a cinematic highlight</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
