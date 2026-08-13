"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Square, Swords, Timer, Zap, Activity, ChevronRight, BarChart2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { aiGamePerformanceInsights } from "@/ai/flows/ai-game-performance-insights"

interface Session {
  _id: string
  gameName: string
  gameType: string
  summary: string
  timestamp: string
  aiInsights: any
}

export default function TrackingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isTracking, setIsTracking] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [gameName, setGameName] = useState("")
  const [gameType, setGameType] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const { data: sessionsData, loading, refetch } = useApi(
    () => api.get<{ success: boolean; sessions: Session[]; pagination: any }>('/sessions?limit=20'),
    []
  )

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])

  useEffect(() => {
    let interval: any
    if (isTracking) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking])

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleStop = async () => {
    setIsTracking(false)
    if (!gameName.trim()) return
    setSubmitting(true)
    try {
      await api.post('/sessions', {
        gameName: gameName.trim(),
        gameType: gameType.trim(),
        summary: `Session lasted ${formatTime(seconds)}`,
      })
      setSeconds(0)
      setGameName("")
      setGameType("")
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const totalMinutes = Math.round(
    (sessionsData?.sessions || []).reduce((acc, s) => {
      const match = s.summary.match(/(\d+):(\d+):(\d+)/)
      if (match) return acc + parseInt(match[1]) * 60 + parseInt(match[2]) + Math.round(parseInt(match[3]) / 60)
      return acc + 30
    }, 0) / 60
  )

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="text-xs font-ui text-nexus-jade tracking-[0.5em] mb-4 uppercase">MISSION TELEMETRY</h2>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-tight uppercase">
              SESSION <br /> <span className="text-nexus-jade">TRACKER</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Card className="glass-panel border-white/10 px-6 py-4 rounded-none hud-frame bg-nexus-carbon/40">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Sessions Played</div>
              <div className="text-2xl font-headline text-white">{sessionsData?.pagination?.total || 0}</div>
            </Card>
            <Card className="glass-panel border-white/10 px-6 py-4 rounded-none hud-frame bg-nexus-carbon/40">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Playtime</div>
              <div className="text-2xl font-headline text-nexus-teal">{totalMinutes} MIN</div>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Active Session Controller */}
          <div className="lg:col-span-2 space-y-8">
            <Card className={`relative overflow-hidden p-12 rounded-none hud-frame transition-all duration-500 ${isTracking ? 'bg-nexus-jade/5 border-nexus-jade/30' : 'bg-nexus-carbon/40 border-white/10'}`}>
              <div className="absolute top-0 right-0 p-8">
                <Activity className={`w-12 h-12 ${isTracking ? 'text-nexus-jade animate-pulse' : 'text-white/5'}`} />
              </div>

              <div className="text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-headline text-white/40 uppercase tracking-[0.4em]">Current Status</h3>
                  <div className="text-8xl md:text-9xl font-headline font-black text-white tracking-tighter">
                    {formatTime(seconds)}
                  </div>
                </div>

                {isTracking && (
                  <div className="flex justify-center gap-4 max-w-md mx-auto">
                    <Input
                      placeholder="GAME NAME"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-ui text-center"
                    />
                    <Input
                      placeholder="TYPE (optional)"
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value)}
                      className="bg-white/5 border-white/10 text-white font-ui text-center w-40"
                    />
                  </div>
                )}

                <div className="flex justify-center gap-6">
                  {!isTracking ? (
                    <Button
                      onClick={() => setIsTracking(true)}
                      className="h-20 px-12 bg-nexus-jade text-nexus-void font-headline text-2xl rounded-none hover:scale-105 transition-transform"
                    >
                      <Play className="w-8 h-8 mr-4 fill-nexus-void" />
                      START MISSION
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStop}
                      disabled={submitting || !gameName.trim()}
                      className="h-20 px-12 bg-destructive text-white font-headline text-2xl rounded-none"
                    >
                      <Square className="w-8 h-8 mr-4 fill-white" />
                      {submitting ? "SAVING..." : "END"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Fatigue Index", val: "Low", icon: Zap, color: "text-nexus-jade" },
                { label: "Total Sessions", val: sessionsData?.pagination?.total || 0, icon: Timer, color: "text-nexus-teal" },
                { label: "Playtime", val: `${totalMinutes}m`, icon: BarChart2, color: "text-nexus-purple" },
                { label: "Toxicity Level", val: "0.01", icon: Activity, color: "text-nexus-jade" },
              ].map((stat) => (
                <Card key={stat.label} className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/40 text-center">
                  <stat.icon className={`w-6 h-6 mx-auto mb-4 ${stat.color}`} />
                  <div className="text-[10px] text-white/40 uppercase mb-1 font-ui">{stat.label}</div>
                  <div className="text-xl font-headline text-white">{stat.val}</div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mission History */}
          <div className="space-y-6">
            <h3 className="text-xs font-ui text-nexus-purple tracking-[0.4em] uppercase">NEURAL LOGS</h3>
            <div className="space-y-4">
              {loading ? (
                <Card className="glass-panel border-white/5 p-8 rounded-none text-center bg-nexus-carbon/20">
                  <p className="text-xs font-ui text-nexus-jade animate-pulse">LOADING...</p>
                </Card>
              ) : (sessionsData?.sessions || []).length === 0 ? (
                <Card className="glass-panel border-white/5 p-8 rounded-none text-center bg-nexus-carbon/20 opacity-40">
                  <p className="text-xs font-ui uppercase">No missions logged</p>
                </Card>
              ) : (
                <AnimatePresence>
                  {(sessionsData?.sessions || []).map((session, idx) => (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="glass-panel border-white/10 p-4 rounded-none bg-nexus-carbon/40 hover:border-nexus-jade/50 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/5 flex items-center justify-center">
                              <Swords className="w-5 h-5 text-nexus-jade" />
                            </div>
                            <div>
                              <h4 className="font-headline text-sm text-white uppercase">{session.gameName}</h4>
                              <p className="text-[10px] text-white/40 font-ui">
                                {new Date(session.timestamp).toLocaleDateString()}
                                {session.aiInsights?.summary ? ' • Analyzed' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-headline text-nexus-jade">
                              {session.aiInsights?.strengths?.length ? 'A+' : 'PENDING'}
                            </div>
                            <div className="text-[10px] text-nexus-teal font-ui">{session.gameType || 'SOLO'}</div>
                          </div>
                        </div>
                        {!session.aiInsights?.summary && (
                          <button
                            onClick={async () => {
                              try {
                                const insights = await aiGamePerformanceInsights({
                                  gameName: session.gameName,
                                  gameType: session.gameType || 'Unknown',
                                  matchHistory: session.summary || 'No match history recorded',
                                  playerStats: 'Standard metrics apply',
                                })
                                await api.post(`/sessions/${session._id}/analyze`, insights)
                                refetch()
                              } catch (err) {
                                console.error(err)
                              }
                            }}
                            className="w-full mt-2 py-1.5 text-[10px] font-ui uppercase tracking-widest border border-nexus-jade/30 text-nexus-jade hover:bg-nexus-jade/10 transition-colors"
                          >
                            Analyze with AI
                          </button>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <Button variant="outline" className="w-full h-12 border-white/10 text-white/60 font-ui text-xs tracking-widest rounded-none hover:text-nexus-jade">
              VIEW FULL ARCHIVE
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
