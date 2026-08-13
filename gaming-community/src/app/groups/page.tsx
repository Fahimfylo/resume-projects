"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Shield, Swords, MessageSquare, Plus, ChevronRight, Crown, Settings, X } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClanChat } from "@/components/chat/ClanChat"

interface Group {
  _id: string
  name: string
  description: string
  owner: { _id: string; gamerTag: string; avatarUrl: string; rank: string }
  members: Array<{ _id: string; gamerTag: string; avatarUrl: string; rank: string }>
  stats: { wins: number; losses: number; totalMatches: number }
  createdAt: string
}

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])

  const [activeTab, setActiveTab] = useState("discover")
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDesc, setNewGroupDesc] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [chatClan, setChatClan] = useState<{ _id: string; name: string } | null>(null)

  const { data: groupsData, loading, refetch } = useApi(
    () => api.get<{ success: boolean; groups: Group[] }>('/groups'),
    []
  )

  const groups = (groupsData?.groups || []).filter((g) => g.owner != null)

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/groups', { name: newGroupName, description: newGroupDesc })
      setNewGroupName("")
      setNewGroupDesc("")
      setDialogOpen(false)
      refetch()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/join`)
      refetch()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await api.post(`/groups/${groupId}/leave`)
      refetch()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await api.delete(`/groups/${groupId}`)
      refetch()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const myGroups = groups.filter((g) =>
    g.members.some((m) => m?._id === user?._id)
  )

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div>
            <h2 className="text-xs font-ui text-nexus-purple tracking-[0.5em] mb-4 uppercase">CLAN MATRIX</h2>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white leading-tight uppercase tracking-tighter">
              BATTLE <br /> <span className="text-nexus-purple">GUILDS</span>
            </h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 bg-nexus-jade text-nexus-void font-headline rounded-none px-8 hud-frame hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 mr-2" />
                FORGE CLAN
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-white/10 text-white bg-nexus-carbon">
              <DialogHeader>
                <DialogTitle className="font-headline text-nexus-jade uppercase tracking-widest">Forge New Clan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <Input
                  placeholder="CLAN NAME"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-ui"
                  required
                />
                <Input
                  placeholder="DESCRIPTION (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-ui"
                />
                <Button type="submit" className="w-full bg-nexus-jade text-nexus-void font-headline rounded-none">
                  CREATE
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-8 mb-12 border-b border-white/5">
          {["discover", "my-clans", "leaderboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-headline uppercase tracking-widest transition-colors relative ${activeTab === tab ? 'text-nexus-purple' : 'text-white/40 hover:text-white'}`}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-purple" />
              )}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === "discover" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {loading ? (
                    <div className="col-span-2 text-center py-20">
                      <p className="text-nexus-jade font-headline animate-pulse">LOADING CLANS...</p>
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="col-span-2 text-center py-20 opacity-40">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-white/20" />
                      <p className="text-xs font-ui uppercase">No clans yet — forge the first!</p>
                    </div>
                  ) : (
                    groups.map((group) => {
                      const isMember = group.members.some((m) => m?._id === user?._id)
                      const isOwner = group.owner?._id === user?._id
                      return (
                        <Card key={group._id} className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/40 hover:border-nexus-purple/50 transition-colors group">
                          <div className="flex items-start justify-between mb-8">
                            <div className="w-16 h-16 bg-nexus-purple/10 border border-nexus-purple/20 flex items-center justify-center hud-frame">
                              <Shield className="w-8 h-8 text-nexus-purple" />
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-white/40 font-ui uppercase">Members</div>
                              <div className="text-sm font-headline text-nexus-purple">{group.members.length}</div>
                            </div>
                          </div>
                          <h3 className="text-2xl font-headline font-black text-white mb-2 uppercase tracking-tighter">{group.name}</h3>
                          <p className="text-xs text-white/40 font-ui mb-4">{group.description || 'No description'}</p>
                          <div className="flex items-center gap-4 text-[10px] text-white/40 font-ui mb-6 uppercase">
                            <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-nexus-gold" /> {group.owner?.gamerTag || 'UNKNOWN'}</span>
                            <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> {group.stats?.totalMatches || 0} Matches</span>
                          </div>
                          {isOwner ? (
                            <Button
                              onClick={() => handleDeleteGroup(group._id)}
                              variant="outline"
                              className="w-full border-red-500/30 text-red-400 font-headline text-xs rounded-none hover:bg-red-500/20"
                            >
                              DISBAND
                            </Button>
                          ) : isMember ? (
                            <Button
                              onClick={() => handleLeaveGroup(group._id)}
                              variant="outline"
                              className="w-full border-white/10 text-white font-headline text-xs rounded-none hover:bg-white/5"
                            >
                              LEAVE CLAN
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleJoinGroup(group._id)}
                              className="w-full bg-nexus-purple text-white font-headline text-xs rounded-none hover:bg-nexus-purple/80"
                            >
                              REQUEST ENTRY
                            </Button>
                          )}
                        </Card>
                      )
                    })
                  )}
                </motion.div>
              )}

              {activeTab === "my-clans" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  {myGroups.length === 0 ? (
                    <div className="col-span-2 text-center py-20 opacity-40">
                      <Users className="w-16 h-16 mx-auto mb-4 text-white/20" />
                      <p className="text-xs font-ui uppercase">You haven't joined any clans</p>
                    </div>
                  ) : (
                    myGroups.map((group) => (
                      <Card key={group._id} className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/40">
                        <h3 className="text-2xl font-headline font-black text-white mb-4 uppercase tracking-tighter">{group.name}</h3>
                        <p className="text-xs text-white/40 font-ui mb-4">{group.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-nexus-purple font-ui">Members: {group.members.length}</div>
                          <Button
                            onClick={() => setChatClan({ _id: group._id, name: group.name })}
                            size="sm"
                            className="bg-[#ffd700] text-nexus-void font-headline text-[10px] rounded-none px-4 h-8"
                          >
                            <MessageSquare className="w-3 h-3 mr-1.5" />
                            CHAT
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {chatClan ? (
              <Card className="glass-panel border-white/10 rounded-none bg-nexus-carbon/60 h-[600px] flex flex-col overflow-hidden">
                <ClanChat
                  clanId={chatClan._id}
                  clanName={chatClan.name}
                  onLeave={() => setChatClan(null)}
                />
              </Card>
            ) : (
              <>
                <Card className="glass-panel border-white/10 p-6 rounded-none bg-nexus-carbon/60 h-[600px] flex flex-col">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <h4 className="font-headline text-xs text-white uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-nexus-purple" />
                      Active Clans
                    </h4>
                    <div className="w-2 h-2 bg-nexus-jade rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {groups.slice(0, 5).map((g) => (
                      <div key={g._id} className="flex items-center gap-3 p-3 bg-white/5 border-l-2 border-nexus-purple/40">
                        <Shield className="w-5 h-5 text-nexus-purple flex-shrink-0" />
                        <div>
                          <p className="text-xs font-headline text-white uppercase">{g.name}</p>
                          <p className="text-[10px] text-white/40 font-ui">{g.members.length} pilots</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="glass-panel border-white/10 p-6 rounded-none bg-nexus-purple/5 hud-frame">
                  <h4 className="font-headline text-xs text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-nexus-gold" />
                    Top Clans
                  </h4>
                  <div className="space-y-4">
                    {groups.slice(0, 5).map((g, i) => (
                      <div key={g._id} className="flex items-center gap-4">
                        <span className="text-xs font-headline text-nexus-gold w-6">#{i + 1}</span>
                        <div className="flex-1">
                          <div className="text-xs font-headline text-white uppercase">{g.name}</div>
                          <Progress value={Math.min(100, g.members.length * 10)} className="h-1 bg-white/5 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
