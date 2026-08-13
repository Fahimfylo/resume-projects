"use client";

import Link from "next/link";
import { Shield, LayoutDashboard, Search, History, BookOpen, Activity, GraduationCap } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "SOC", href: "/soc-dashboard", icon: Activity },
  { name: "File Scanner", href: "/scanner/file", icon: Search },
  { name: "URL Scanner", href: "/scanner/url", icon: Search },
  { name: "History", href: "/reports", icon: History },
  { name: "Threat Intel", href: "/threat-intel", icon: BookOpen },
  { name: "Training", href: "/security-training", icon: GraduationCap },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "from-primary to-accent",
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-green-500 to-emerald-500",
  "from-orange-500 to-red-500",
];

function getAvatarColor(id: string) {
  const index = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[index % avatarColors.length];
}

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight text-glow">
            AEGIS<span className="text-primary">CORE</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Link
          href="/settings"
          className={`h-9 w-9 rounded-full bg-gradient-to-br ${getAvatarColor(user?.id || "")} flex items-center justify-center text-white text-sm font-bold overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0`}
        >
          {user?.image ? (
            <img src={user.image} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(user?.name || "U")
          )}
        </Link>
      </div>
    </nav>
  );
}
