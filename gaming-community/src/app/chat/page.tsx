"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { DMChat } from "@/components/chat/DMChat"
import { ClanChat } from "@/components/chat/ClanChat"
import { MessageCircle, Swords } from "lucide-react"

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])

  const [activeClan, setActiveClan] = useState<{ clanId: string; clanName: string } | null>(null)
  const [activeDM, setActiveDM] = useState<{ userId: string; gamerTag: string } | null>(null)

  const handleSelectClan = (clanId: string, clanName: string) => {
    setActiveDM(null)
    setActiveClan({ clanId, clanName })
  }

  const handleSelectDM = (userId: string, gamerTag: string) => {
    setActiveClan(null)
    setActiveDM({ userId, gamerTag })
  }

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        <div className="mb-8">
          <h1 className="text-4xl font-headline font-black text-white uppercase tracking-tighter">
            NEXUS <span style={{ color: '#ffd700' }}>CHAT</span>
          </h1>
          <p className="text-white/40 font-ui text-sm mt-2 uppercase tracking-widest">Real-time communication hub</p>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-0 h-[65vh] min-h-[500px]">
          <Card className="glass-panel border-white/10 rounded-none bg-nexus-carbon/60 overflow-hidden">
            <ChatSidebar
              onSelectClan={handleSelectClan}
              onSelectDM={handleSelectDM}
              activeClanId={activeClan?.clanId || null}
              activeDMUserId={activeDM?.userId || null}
            />
          </Card>

          <Card className="glass-panel border-white/10 rounded-none bg-nexus-carbon/40 overflow-hidden border-l-0">
            {activeClan ? (
              <ClanChat clanId={activeClan.clanId} clanName={activeClan.clanName} />
            ) : activeDM ? (
              <DMChat targetUserId={activeDM.userId} targetGamerTag={activeDM.gamerTag} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <MessageCircle className="w-16 h-16 mb-6 opacity-30" />
                <div className="w-12 h-12 flex items-center justify-center mb-4 border border-white/10 rounded-full">
                  <Swords className="w-6 h-6" style={{ color: '#ffd700', opacity: 0.5 }} />
                </div>
                <p className="text-sm font-headline uppercase tracking-widest text-white/30">Select a conversation</p>
                <p className="text-[10px] font-ui mt-2 text-white/10">Choose a clan or DM from the sidebar</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
