"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/navigation/Navbar";
import {
  Shield, ShieldCheck, ShieldAlert, Globe, FileWarning,
  Activity, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, TrendingUp, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SecurityScoreReport, ScoreCategory } from "@/types/security/score";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar,
} from 'recharts';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  file: FileWarning,
  shield: Shield,
  activity: Activity,
  check: CheckCircle,
};

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-400',
  B: 'text-blue-400',
  C: 'text-yellow-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const GRADE_BG: Record<string, string> = {
  A: 'bg-green-500/20 border-green-500/30',
  B: 'bg-blue-500/20 border-blue-500/30',
  C: 'bg-yellow-500/20 border-yellow-500/30',
  D: 'bg-orange-500/20 border-orange-500/30',
  F: 'bg-red-500/20 border-red-500/30',
};

export default function SecurityScorePage() {
  const [data, setData] = useState<SecurityScoreReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/score');
      if (res.ok) setData(await res.json());
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScore(); }, [fetchScore]);

  return (
    <div className="min-h-screen bg-[#0A0C16]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 pt-28 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold">Cyber Hygiene Score</h1>
            <p className="text-muted-foreground">Your personal security posture assessment</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchScore} disabled={loading} className="border-white/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : data ? (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-dark border-white/5">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className={cn(
                    'w-32 h-32 rounded-full flex items-center justify-center border-4 mb-4',
                    GRADE_BG[data.overallGrade]
                  )}>
                    <span className={cn('text-5xl font-headline font-bold', GRADE_COLORS[data.overallGrade])}>
                      {data.overallGrade}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-headline font-bold">{data.overallScore}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Overall Security Score</p>
                </CardContent>
              </Card>

              <Card className="glass-dark border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Score Breakdown</CardTitle>
                  <CardDescription>Weighted category analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.categories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.icon] || Shield;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">{cat.name}</span>
                            <span className="text-[10px] text-muted-foreground">({cat.weight}%)</span>
                          </div>
                          <span className={cn(
                            'text-xs font-bold',
                            cat.score >= 70 ? 'text-green-400' : cat.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {cat.score}/100
                          </span>
                        </div>
                        <Progress
                          value={cat.score}
                          className="h-1.5 bg-white/5"
                          indicatorClassName={cn(
                            cat.score >= 70 ? 'bg-green-500' : cat.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          )}
                        />
                        <p className="text-[10px] text-muted-foreground">{cat.details}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Score History */}
            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Score History (7 Days)
                </CardTitle>
                <CardDescription>Daily security score trend</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="date" stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="#ffffff30" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0A0C16', borderColor: '#ffffff10', borderRadius: 8 }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#scoreGradient)"
                      dot={{ r: 4, fill: '#3B82F6', stroke: '#0A0C16', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="glass-dark border-white/5">
              <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  Recommendations
                </CardTitle>
                <CardDescription>Actionable steps to improve your score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No scan data yet. Run scans to generate your security score.
          </div>
        )}
      </main>
    </div>
  );
}
