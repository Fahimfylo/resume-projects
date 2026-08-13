"use client"

import { useAuth } from "@/lib/auth-context"
import { Navigation } from "@/components/ui/navigation"
import { motion } from "framer-motion"
import { Shield, Target, Zap, Swords, BrainCircuit, Fingerprint, Video, Trophy, ShieldAlert, Flag, Users, Swords as SwordsIcon, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { api } from "@/lib/api"
import { useApi } from "@/lib/useApi"
import { useRBAC } from "@/lib/useRBAC"

const radarData = [
  { subject: 'Strategy', A: 120, fullMark: 150 },
  { subject: 'Aim', A: 98, fullMark: 150 },
  { subject: 'Speed', A: 86, fullMark: 150 },
  { subject: 'Teamwork', A: 99, fullMark: 150 },
  { subject: 'Leadership', A: 85, fullMark: 150 },
  { subject: 'Luck', A: 65, fullMark: 150 },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data: sessionsData } = useApi(
    () => api.get<{ success: boolean; sessions: any[] }>('/sessions?limit=5'),
    []
  )
  const { is, can } = useRBAC()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading || !user) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
          <div>
            <h2 className="text-xs font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">Command Center</h2>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white tracking-tighter uppercase">
              PILOT: <span className="text-nexus-jade">{user.gamerTag || "UNNAMED"}</span>
            </h1>
          </div>
          <div className="flex gap-4">
             <div className="glass-panel border-white/10 px-6 py-4 rounded-none hud-frame">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Status</div>
                <div className="text-xl font-headline text-nexus-jade">OPTIMAL</div>
             </div>
             <div className="glass-panel border-white/10 px-6 py-4 rounded-none hud-frame">
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Chi Resonance</div>
                <div className="text-xl font-headline text-nexus-purple">STABLE</div>
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Profile */}
          <div className="space-y-8">
            <Card className="glass-panel border-white/10 p-8 rounded-none hud-frame bg-nexus-carbon/40">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full border-2 border-nexus-jade p-1 kai-glow">
                  <img src={user.avatarUrl || `https://picsum.photos/seed/${user._id}/200/200`} className="w-full h-full rounded-full object-cover" alt="Profile" />
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-bold text-white">{user.rank || "NOVICE"}</h3>
                  <p className="text-nexus-jade text-xs font-ui tracking-[0.2em]">LEVEL {user.level || 1}</p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: "Tactical Execution", val: 88 },
                  { label: "Reflex Speed", val: 94 },
                  { label: "Strategic Depth", val: 72 },
                ].map((skill) => (
                  <div key={skill.label} className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-white/60 font-ui uppercase tracking-widest">{skill.label}</span>
                      <span className="text-nexus-jade font-headline">{skill.val}%</span>
                    </div>
                    <Progress value={skill.val} className="h-1 bg-white/5" />
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
               <Link href="/coach" className="group">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-nexus-jade/50 transition-colors">
                    <BrainCircuit className="w-8 h-8 text-nexus-jade mb-4" />
                    <h4 className="text-sm font-headline font-bold text-white">STRATEGIC COACH</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Real-time tactical uplink</p>
                  </Card>
               </Link>
               <Link href="/identity" className="group">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-nexus-teal/50 transition-colors">
                    <Fingerprint className="w-8 h-8 text-nexus-teal mb-4" />
                    <h4 className="text-sm font-headline font-bold text-white">IDENTITY FORGE</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Update your Gamer DNA</p>
                  </Card>
               </Link>
            </div>
          </div>

          {/* Center Column: Radar Chart */}
          <Card className="lg:col-span-2 glass-panel border-white/10 p-8 rounded-none hud-frame relative overflow-hidden bg-nexus-carbon/40">
             <div className="absolute top-4 right-4 text-[10px] font-ui text-nexus-jade animate-pulse">TELEMETRY_LIVE_DATA</div>
             <h3 className="text-xl font-headline font-black text-white mb-8 tracking-tighter">PERFORMANCE_SIGNATURE</h3>

             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#76ff0320" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                    <Radar
                      name="User"
                      dataKey="A"
                      stroke="#76ff03"
                      fill="#76ff03"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>

             <div className="grid grid-cols-4 gap-4 mt-8">
                {[
                  { icon: Shield, label: "Win Rate", val: "78%" },
                  { icon: Target, label: "K/D", val: "2.45" },
                  { icon: Zap, label: "APM", val: "320" },
                  { icon: Trophy, label: "Titles", val: "12" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="w-5 h-5 text-nexus-jade mx-auto mb-2" />
                    <div className="text-[8px] text-white/40 uppercase tracking-widest">{s.label}</div>
                    <div className="text-sm font-headline text-white">{s.val}</div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div className="mt-12">
           <h3 className="text-xs font-ui text-nexus-purple tracking-[0.5em] mb-6 uppercase">Mission Logs</h3>
           <div className="space-y-4">
              {(sessionsData?.sessions || []).length === 0 ? (
                <div className="glass-panel border-white/5 p-8 rounded-none text-center opacity-40">
                  <Swords className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs font-ui uppercase">No missions logged yet</p>
                </div>
              ) : (
                (sessionsData?.sessions || []).slice(0, 5).map((session) => (
                  <div key={session._id} className="glass-panel border-white/5 p-6 rounded-none flex items-center justify-between hover:bg-white/5 transition-colors">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white/5 flex items-center justify-center">
                           <Swords className="w-6 h-6 text-nexus-jade" />
                        </div>
                        <div>
                           <div className="text-lg font-headline text-white">{session.gameName}</div>
                           <div className="text-xs text-white/40 font-ui uppercase">
                             {new Date(session.timestamp).toLocaleDateString()} • {session.gameType || 'SOLO'}
                           </div>
                        </div>
                     </div>
                     <Link href="/highlights">
                        <Button variant="ghost" size="sm" className="text-nexus-jade hover:bg-nexus-jade hover:text-nexus-void font-ui">
                           <Video className="w-4 h-4 mr-2" />
                           GENERATE HIGHLIGHT
                        </Button>
                     </Link>
                  </div>
                ))
              )}
           </div>
        </div>

        {is.staff && (
          <div className="mt-12">
            <h3 className="text-xs font-ui text-nexus-gold tracking-[0.5em] mb-6 uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> STAFF COMMAND CENTER
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {can('moderation.review') && (
                <Link href="/guardians/moderation">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-[#ffd700]/50 transition-colors bg-nexus-carbon/40">
                    <Eye className="w-8 h-8 mb-4" style={{ color: '#ffd700' }} />
                    <h4 className="text-sm font-headline font-bold text-white">MODERATION QUEUE</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Review pending content</p>
                  </Card>
                </Link>
              )}
              {can('moderation.review') && (
                <Link href="/guardians/reports">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-destructive/50 transition-colors bg-nexus-carbon/40">
                    <Flag className="w-8 h-8 text-destructive mb-4" />
                    <h4 className="text-sm font-headline font-bold text-white">REPORTS</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Handle user reports</p>
                  </Card>
                </Link>
              )}
              {can('users.view') && (
                <Link href="/guardians/users">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-nexus-purple/50 transition-colors bg-nexus-carbon/40">
                    <Users className="w-8 h-8 text-nexus-purple mb-4" />
                    <h4 className="text-sm font-headline font-bold text-white">USER DIRECTORY</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Manage community members</p>
                  </Card>
                </Link>
              )}
              {can('clans.manage') && (
                <Link href="/guardians/clans">
                  <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame hover:border-nexus-teal/50 transition-colors bg-nexus-carbon/40">
                    <SwordsIcon className="w-8 h-8 text-nexus-teal mb-4" />
                    <h4 className="text-sm font-headline font-bold text-white">CLAN MANAGEMENT</h4>
                    <p className="text-[10px] text-white/40 mt-1 font-ui">Oversee clans</p>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
