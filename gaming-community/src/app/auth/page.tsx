"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, Loader2, KeyRound, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/ui/navigation"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [gamerTag, setGamerTag] = useState("")
  const [otp, setOtp] = useState("")
  const [pendingEmail, setPendingEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register, verifyEmail, resendOtp, login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
        router.push("/dashboard")
      } else {
        const { email: registeredEmail } = await register(email, password, gamerTag || undefined)
        setPendingEmail(registeredEmail)
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await verifyEmail(pendingEmail, otp)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError("")
    try {
      await resendOtp(pendingEmail)
      setError("")
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    }
  }

  if (pendingEmail) {
    return (
      <main className="min-h-screen bg-nexus-void flex flex-col items-center justify-center p-6">
        <Navigation />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="glass-panel border-white/10 p-8 hud-frame rounded-none">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 jade-orb rounded-full flex items-center justify-center mb-4 kai-glow">
                <KeyRound className="text-nexus-void w-8 h-8" />
              </div>
              <h1 className="text-3xl font-headline font-black text-white tracking-tighter uppercase">
                Verify Identity
              </h1>
              <p className="text-white/40 font-ui text-sm mt-2 text-center">
                Enter the 6-digit code sent to<br />
                <span className="text-nexus-jade">{pendingEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="bg-white/5 border-white/10 pl-10 font-ui text-white text-center text-2xl tracking-[8px]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs font-ui text-center">{error}</p>
              )}
              <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-12 bg-nexus-jade text-nexus-void font-headline rounded-none hud-frame">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "VERIFYING..." : "VERIFY"}
              </Button>
            </form>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setPendingEmail("")}
                className="text-white/40 font-ui text-sm hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button
                onClick={handleResendOtp}
                className="text-nexus-jade font-ui text-sm hover:underline"
              >
                Resend Code
              </button>
            </div>
          </Card>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-nexus-void flex flex-col items-center justify-center p-6">
      <Navigation />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="glass-panel border-white/10 p-8 hud-frame rounded-none">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 jade-orb rounded-full flex items-center justify-center mb-4 kai-glow">
              <Shield className="text-nexus-void w-8 h-8" />
            </div>
            <h1 className="text-3xl font-headline font-black text-white tracking-tighter uppercase">
              {isLogin ? "System Access" : "Create Identity"}
            </h1>
            <p className="text-white/40 font-ui text-sm mt-2">
              Sync your neural core with NEXUS
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-white/20" />
                <Input
                  type="text"
                  placeholder="GAMER_TAG"
                  className="bg-white/5 border-white/10 pl-10 font-ui text-white"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <Input
                type="email"
                placeholder="NEURAL_EMAIL"
                className="bg-white/5 border-white/10 pl-10 font-ui text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-white/20" />
              <Input
                type="password"
                placeholder="SECURITY_KEY"
                className="bg-white/5 border-white/10 pl-10 font-ui text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs font-ui text-center">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full h-12 bg-nexus-jade text-nexus-void font-headline rounded-none hud-frame">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? (isLogin ? "AUTHENTICATING..." : "INITIALIZING...") : (isLogin ? "AUTHENTICATE" : "INITIALIZE")}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-nexus-jade font-ui text-sm hover:underline"
            >
              {isLogin ? "New Pilot? Forge Identity" : "Already Synced? Access Core"}
            </button>
          </div>
        </Card>
      </motion.div>
    </main>
  )
}
