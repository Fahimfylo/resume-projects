"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/ui/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Shield, Sparkles, Fingerprint, RefreshCcw, Upload } from "lucide-react"
import { createAIGamerIdentity, type AIGamerIdentityCreationOutput } from "@/ai/flows/ai-gamer-identity-creation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function IdentityForgePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth")
  }, [user, authLoading, router])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [gamerTag, setGamerTag] = useState("")
  const [preferences, setPreferences] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<AIGamerIdentityCreationOutput | null>(null)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const output = await createAIGamerIdentity({
        gamerTag,
        gamingPreferences: preferences.split(',').map(s => s.trim()),
      })
      setResult(output)

      await api.put('/users/profile', {
        gamerTag,
        gamerBio: output.gamerBio,
        avatarUrl: output.avatarImageUrl,
        gamingPreferences: preferences.split(',').map(s => s.trim()),
      })

      toast({
        title: "IDENTITY FORGED",
        description: "Your Gamer DNA has been synchronized with NEXUS.",
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "SYNC FAILED",
        description: "Could not materialize identity. Check your neural uplink.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const baseUrl = process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const token = localStorage.getItem('nexus_access_token')
      const res = await fetch(`${baseUrl}/api/upload/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      const avatarImageUrl = data.avatarUrl?.startsWith('data:') ? data.avatarUrl : `${baseUrl}${data.avatarUrl}`
      setResult((prev) => prev ? { ...prev, avatarImageUrl } : prev)

      toast({
        title: "AVATAR UPLOADED",
        description: "Your new profile image is live.",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "UPLOAD FAILED",
        description: err.message,
      })
    } finally {
      setUploading(false)
    }
  }

  if (authLoading) return <div className="min-h-screen bg-nexus-void flex items-center justify-center text-nexus-jade font-headline">SYNCING...</div>

  return (
    <main className="min-h-screen bg-nexus-void">
      <Navigation />

      <div className="container px-6 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="w-16 h-16 jade-orb rounded-full flex items-center justify-center mb-4 kai-glow">
              <Fingerprint className="text-nexus-void w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-white tracking-tighter uppercase mb-4">
              IDENTITY <span className="text-nexus-jade">FORGE</span>
            </h1>
            <p className="text-white/50 font-ui text-xl max-w-2xl leading-relaxed">
              Define your playstyle, and our AI will materialize a unique cinematic avatar and mythic bio for your NEXUS profile.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Input Form */}
            <Card className="glass-panel border-white/10 p-8 rounded-none hud-frame bg-nexus-carbon/40">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-nexus-jade font-headline uppercase tracking-[0.2em]">Gamer Tag</label>
                  <Input
                    value={gamerTag}
                    onChange={e => setGamerTag(e.target.value)}
                    placeholder="X_KAI_SPIRIT_X"
                    className="bg-white/5 border-white/10 text-white font-ui h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-nexus-teal font-headline uppercase tracking-[0.2em]">Gaming Preferences</label>
                  <Textarea
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    placeholder="Wukong, Cyberpunk, Valorant, Aggressive Playstyle, Stealth..."
                    className="bg-white/5 border-white/10 text-white font-ui min-h-[120px]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-nexus-jade text-nexus-void font-headline text-lg rounded-none hud-frame group"
                >
                  {loading ? (
                    <RefreshCcw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      MATERIALIZE IDENTITY
                      <Sparkles className="w-5 h-5 ml-2 group-hover:scale-125 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

              {/* Manual Avatar Upload */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <label className="text-[10px] text-nexus-purple font-headline uppercase tracking-[0.2em] block mb-4">
                  Or Upload Avatar Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="w-full h-12 border-white/10 text-white font-ui rounded-none hover:bg-white/5"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "UPLOADING..." : "CHOOSE IMAGE"}
                </Button>
              </div>
            </Card>

            {/* Result Preview */}
            <div className="relative">
              {loading || uploading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-nexus-void/60 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 jade-orb rounded-full animate-ping mx-auto mb-4" />
                    <div className="text-nexus-jade font-headline text-xs tracking-widest">SYNTHESIZING...</div>
                  </div>
                </div>
              ) : null}

              <Card className={`glass-panel border-white/10 p-8 rounded-none hud-frame min-h-[500px] flex flex-col items-center justify-center text-center transition-all ${result ? 'opacity-100' : 'opacity-40'}`}>
                {result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full space-y-8"
                  >
                    <div className="w-48 h-48 rounded-2xl border-2 border-nexus-jade p-1 mx-auto kai-glow overflow-hidden relative group">
                      <img src={result.avatarImageUrl} className="w-full h-full object-cover rounded-xl" alt="AI Avatar" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Upload className="w-8 h-8 text-nexus-jade" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-3xl font-headline font-black text-white mb-4 tracking-tighter uppercase">{gamerTag}</h3>
                      <div className="p-6 bg-white/5 border border-white/5 font-ui text-white/60 italic leading-relaxed">
                        &ldquo;{result.gamerBio}&rdquo;
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-white/20">
                    <Shield className="w-24 h-24 mx-auto mb-6 opacity-10" />
                    <p className="font-headline text-sm tracking-widest">AWAITING NEURAL DATA</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
