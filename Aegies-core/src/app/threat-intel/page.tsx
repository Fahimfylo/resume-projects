"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import { ShieldCheck, Zap, Newspaper, TrendingUp, Info, RefreshCw, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { aiDailySecurityBrief, DailyBriefOutput } from "@/ai/flows/ai-threat-intelligence";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { STATIC_THREATS, ACTIVE_VECTORS, TELEMETRY_SOURCES } from "@/constants";

export default function ThreatIntel() {
  const [brief, setBrief] = useState<DailyBriefOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const intelHero = PlaceHolderImages.find(img => img.id === 'threat-intel-hero');

  const fetchBrief = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiDailySecurityBrief({});
      setBrief(data);
    } catch (error) {
      console.error("Failed to load brief", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 pt-28 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold">Threat Intelligence Center</h1>
            <p className="text-muted-foreground text-sm">Real-time global telemetry and predictive analysis.</p>
          </div>
          <Button 
            variant="outline" 
            className="border-white/10 hover:bg-white/5 gap-2"
            onClick={fetchBrief}
            disabled={loading}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Intelligence
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Daily Briefing Card */}
            <Card className="glass-dark border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Cpu className="w-24 h-24" />
              </div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Zap className="w-4 h-4 fill-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">AI-Generated Intelligence Brief</span>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-full bg-white/5" />
                  </div>
                ) : (
                  <>
                    <CardTitle className="font-headline text-2xl">{brief?.headline}</CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {brief?.summary}
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                {loading ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    <Skeleton className="h-32 bg-white/5" />
                    <Skeleton className="h-32 bg-white/5" />
                    <Skeleton className="h-32 bg-white/5" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {brief?.keyThreats.map((threat, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5 flex flex-col justify-between">
                        <div className="space-y-2">
                          <Badge variant="outline" className={
                            threat.severity === 'Critical' ? 'text-destructive border-destructive/30' :
                            threat.severity === 'High' ? 'text-accent border-accent/30' :
                            'text-primary border-primary/30'
                          }>
                            {threat.severity}
                          </Badge>
                          <h4 className="text-sm font-bold">{threat.name}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-3">{threat.description}</p>
                        </div>
                        <p className="text-[10px] mt-4 font-mono text-muted-foreground uppercase">{threat.type}</p>
                      </div>
                    ))}
                  </div>
                )}

                {!loading && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> Recommended Defenses
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {brief?.mitigationTips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start">
                          <span className="text-primary mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Bulletins */}
            <div className="space-y-4">
              <h3 className="font-headline text-xl font-bold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-muted-foreground" />
                Latest Bulletins
              </h3>
              <div className="grid gap-4">
                {STATIC_THREATS.map((bulletin) => (
                  <Card key={bulletin.id} className="glass-dark border-white/5 hover:border-white/10 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded bg-white/5">
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{bulletin.title}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] text-muted-foreground">{bulletin.date}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[10px] text-primary">{bulletin.category}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Read More</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="glass-dark border-white/5 overflow-hidden">
              <div className="h-32 relative">
                 <Image 
                  src={intelHero?.imageUrl || ""} 
                  alt="Intelligence" 
                  fill
                  className="object-cover opacity-40 grayscale"
                  data-ai-hint="cyber intelligence"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C16] to-transparent" />
              </div>
              <CardHeader className="-mt-10 relative z-10">
                <CardTitle className="text-sm">Global Threat Index</CardTitle>
                <CardDescription className="text-xs">Aggregate risk based on active exploits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="text-5xl font-headline font-bold text-accent">68<span className="text-sm text-muted-foreground ml-1">/100</span></div>
                  <div className="flex items-center gap-2 text-accent mt-2 animate-pulse">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-tighter">Rising Volatility</span>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Vectors</h4>
                  {ACTIVE_VECTORS.map((vector, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>{vector.label}</span>
                        <span>{vector.val}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${vector.color}`} style={{ width: `${vector.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="text-sm">Telemetry Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TELEMETRY_SOURCES.map((src, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{src}</span>
                      <span className="flex h-2 w-2 rounded-full bg-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
