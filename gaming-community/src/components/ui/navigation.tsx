"use client"

import { motion } from "framer-motion"
import { Shield, LayoutDashboard, BrainCircuit, Fingerprint, Bell, Search, LogIn, Users, PlayCircle, BarChart3, Globe, ShieldAlert, Swords, Eye, MessageCircle } from "lucide-react"
import { Button } from "./button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarImage, AvatarFallback } from "./avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "./dropdown-menu"
import { useRBAC } from "@/lib/useRBAC"
import { RoleBadge } from "@/components/rbac/PermissionGate"
import { useSocketContext } from "@/lib/SocketProvider"

export function Navigation() {
  const { user, loading, logout } = useAuth();
  const { is, can, role } = useRBAC();
  const { unreadCount } = useSocketContext();

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 jade-orb rounded-full flex items-center justify-center kai-glow transition-transform group-hover:scale-110">
            <Shield className="text-nexus-void w-6 h-6" />
          </div>
          <span className="font-headline text-2xl font-black tracking-tighter text-white group-hover:text-nexus-jade transition-colors">
            NEXUS
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              HUD
            </Button>
          </Link>
          <Link href="/social">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <Globe className="w-4 h-4 mr-2" />
              Feed
            </Button>
          </Link>
          <Link href="/tracking">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <PlayCircle className="w-4 h-4 mr-2" />
              Track
            </Button>
          </Link>
          <Link href="/coach">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <BrainCircuit className="w-4 h-4 mr-2" />
              AI Coach
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <BarChart3 className="w-4 h-4 mr-2" />
              Lab
            </Button>
          </Link>
          <Link href="/groups">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <Users className="w-4 h-4 mr-2" />
              Clans
            </Button>
          </Link>
          <Link href="/chat">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-nexus-jade hover:bg-white/5 rounded-full px-4 font-ui">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search Galaxy..."
            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm w-48 focus:w-64 transition-all focus:outline-none focus:border-nexus-jade/50 font-ui"
          />
        </div>

        <div className="flex items-center gap-2">
          {!loading && user ? (
            <>
              <div className="relative">
                <Button size="icon" variant="ghost" className="text-white/60 hover:text-nexus-jade hover:bg-transparent hover:border hover:border-nexus-jade/50 relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-nexus-jade text-nexus-void text-[8px] font-headline font-bold px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {unreadCount === 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-nexus-jade rounded-full animate-pulse" />
                  )}
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="w-10 h-10 rounded-full border-2 border-nexus-jade/50 p-0.5 cursor-pointer hover:scale-105 transition-transform">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={user.avatarUrl || `https://picsum.photos/seed/${user._id}/100/100`} />
                      <AvatarFallback className="bg-nexus-carbon text-nexus-jade font-headline">
                        {user.gamerTag?.charAt(0) || 'G'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 glass-panel border-white/10 text-white">
                  <DropdownMenuLabel className="font-headline text-xs text-nexus-jade flex items-center gap-2">
                    PILOT: {user.gamerTag || user.email}
                    <RoleBadge role={role} />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="focus:bg-nexus-jade focus:text-nexus-void">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/identity">
                    <DropdownMenuItem className="focus:bg-nexus-jade focus:text-nexus-void">
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Identity Forge
                    </DropdownMenuItem>
                  </Link>
                  {is.staff && (
                    <>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <Link href="/guardians/dashboard">
                        <DropdownMenuItem className="focus:bg-[#ffd700] focus:text-nexus-void">
                          <ShieldAlert className="w-4 h-4 mr-2" style={{ color: '#ffd700' }} />
                          Guardian Command
                        </DropdownMenuItem>
                      </Link>
                      {can('moderation.review') && (
                        <Link href="/guardians/moderation">
                          <DropdownMenuItem className="focus:bg-[#ffd700] focus:text-nexus-void">
                            <Eye className="w-4 h-4 mr-2" style={{ color: '#ffd700' }} />
                            Moderation Queue
                          </DropdownMenuItem>
                        </Link>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive focus:text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="outline" className="border-nexus-jade/30 text-nexus-jade hover:bg-nexus-jade hover:text-nexus-void font-headline tracking-tighter">
                INITIATE SYNC
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
