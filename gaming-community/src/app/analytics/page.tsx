"use client"

import { Navigation } from "@/components/ui/navigation"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Target, Zap, Shield, Swords, TrendingUp, AlertCircle, Brain, Activity } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])

  const { data: analyticsData, loading } = useApi(
    () => api.get<{ success: boolean; analytics: any }>('/analytics'),
    []
  )

  const a = analyticsData?.analytics

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        <div className="mb-16">
          <h2 className="text-xs font-ui text-nexus-teal tracking-[0.5em] mb-4 uppercase">ANALYTICS LAB v2.4</h2>
          <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-tight uppercase tracking-tighter">
            DEEP <span className="text-nexus-teal">PERFORMANCE</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: "Total Sessions", val: loading ? "..." : a?.totalSessions || 0, icon: Activity, color: "text-nexus-jade", desc: "All Time" },
            { label: "Games Played", val: loading ? "..." : a?.totalGames || 0, icon: Swords, color: "text-nexus-teal", desc: "Unique Titles" },
            { label: "Analyzed", val: loading ? "..." : `${a?.analyzedPercent || 0}%`, icon: Brain, color: "text-nexus-purple", desc: `${a?.analyzedCount || 0} Sessions` },
            { label: "Win Consistency", val: "68%", icon: Shield, color: "text-nexus-gold", desc: "Improving" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/40 hud-frame relative overflow-hidden group">
                <div className="relative z-10">
                  <stat.icon className={`w-8 h-8 mb-6 ${stat.color}`} />
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-ui">{stat.label}</div>
                  <div className="text-3xl font-headline font-black text-white mb-1">{stat.val}</div>
                  <div className="text-[10px] text-nexus-teal font-ui">{stat.desc}</div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 blur-2xl group-hover:bg-nexus-jade/10 transition-colors" />
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Daily Sessions Chart */}
          <Card className="lg:col-span-2 glass-panel border-white/10 p-8 rounded-none bg-nexus-carbon/40">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-white uppercase tracking-tighter flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-nexus-jade" />
                Session Frequency
              </h3>
              <div className="text-[10px] text-nexus-jade font-ui animate-pulse">UPLINK_STABLE</div>
            </div>
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center text-nexus-jade font-headline text-sm animate-pulse">LOADING TELEMETRY...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={a?.dailySessions?.map((d: any) => ({ day: d._id.slice(5), sessions: d.sessions })) || []}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#76ff03" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#76ff03" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="day" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #ffffff10', borderRadius: '0', fontSize: '10px' }}
                      itemStyle={{ color: '#76ff03' }}
                    />
                    <Area type="monotone" dataKey="sessions" stroke="#76ff03" fillOpacity={1} fill="url(#colorAcc)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Insights */}
          <div className="space-y-6">
            <Card className="glass-panel border-nexus-orange/30 p-8 rounded-none bg-nexus-orange/5 hud-frame">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-nexus-orange shrink-0" />
                <div>
                  <h4 className="font-headline text-sm text-nexus-orange uppercase mb-2">AI Intelligence</h4>
                  <p className="text-white/60 font-ui text-sm leading-relaxed">
                    {a?.analyzedCount > 0
                      ? `${a.analyzedCount} sessions analyzed. Keep tracking to improve your insights.`
                      : 'No analyzed sessions yet. Track a session and run AI analysis to unlock insights.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-panel border-white/10 p-8 rounded-none bg-nexus-carbon/60">
              <h4 className="font-headline text-xs text-white/40 uppercase tracking-widest mb-6">Game Breakdown</h4>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-xs text-nexus-jade animate-pulse">LOADING...</p>
                ) : a?.gameBreakdown?.length === 0 ? (
                  <p className="text-xs text-white/40 font-ui">No sessions tracked yet</p>
                ) : (
                  a?.gameBreakdown?.map((g: any) => (
                    <div key={g._id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
                      <div>
                        <div className="text-xs font-headline text-white uppercase">{g._id}</div>
                        <div className="text-[10px] text-white/40 font-ui">{g.count} sessions</div>
                      </div>
                      <div className="text-[10px] font-headline text-nexus-jade">
                        {Math.round((g.count / a.totalSessions) * 100)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="font-headline text-white/40 text-xs tracking-[0.4em] uppercase mb-8">DISTRIBUTION</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glass-panel border-white/10 p-8 rounded-none bg-nexus-carbon/40">
              <h4 className="font-headline text-sm text-white mb-6 uppercase">Games Per Title</h4>
              {loading ? (
                <p className="text-xs text-nexus-jade animate-pulse">LOADING...</p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={a?.gameBreakdown?.map((g: any) => ({ name: g._id, sessions: g.count })) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f1115', border: '1px solid #ffffff10', fontSize: '10px' }} />
                      <Bar dataKey="sessions" fill="#76ff03" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card className="glass-panel border-white/10 p-8 rounded-none bg-nexus-carbon/40">
              <h4 className="font-headline text-sm text-white mb-6 uppercase">Session Overview</h4>
              <div className="space-y-6">
                {[
                  { label: "Total Play Sessions", val: a?.totalSessions || 0, pct: 100 },
                  { label: "AI Analyzed", val: a?.analyzedCount || 0, pct: a?.analyzedPercent || 0 },
                  { label: "Need Analysis", val: (a?.totalSessions || 0) - (a?.analyzedCount || 0), pct: 100 - (a?.analyzedPercent || 0) },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-ui">
                      <span className="text-white/60 uppercase">{item.label}</span>
                      <span className="text-nexus-jade font-headline">{item.val}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 w-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        className="h-full bg-nexus-teal"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
