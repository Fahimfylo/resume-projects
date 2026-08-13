'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, AlertTriangle, BarChart3 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function GuardianAiCenter() {
  const { user, loading } = useAuth();
  const { is } = useRBAC();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
    api.get<{ success: boolean; aiCenter: any }>('/admin/ai-center')
      .then((res) => setData(res.aiCenter))
      .catch(() => {});
  }, [user, loading, is.staff, router]);

  if (!data) return <div className="min-h-screen bg-nexus-void flex items-center justify-center"><div className="text-[#ffd700] font-headline text-sm animate-pulse">LOADING AI TELEMETRY...</div></div>;

  const chartData = (data.aiByGame || []).map((g: any) => ({ name: g._id?.length > 12 ? g._id?.slice(0, 12) + '...' : g._id, generations: g.count }));

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian AI Command</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          AI <span className="text-nexus-purple">CENTER</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-nexus-purple/30">
          <BrainCircuit className="w-5 h-5 text-nexus-purple mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Total Generations</div>
          <div className="text-2xl font-headline font-black text-white">{data.totalGenerations.toLocaleString()}</div>
        </Card>
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-destructive/30">
          <AlertTriangle className="w-5 h-5 text-destructive mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Failed Requests</div>
          <div className="text-2xl font-headline font-black text-white">{data.failedRequests.toLocaleString()}</div>
        </Card>
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-amber-500/30">
          <BarChart3 className="w-5 h-5 text-amber-400 mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Failure Rate</div>
          <div className="text-2xl font-headline font-black text-white">{data.failureRate}%</div>
        </Card>
      </div>

      <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
        <h3 className="text-xs font-ui text-nexus-purple tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> AI Generations by Game
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f1115', border: '1px solid #9933ff20', borderRadius: 0, fontSize: 12 }} labelStyle={{ color: '#9933ff' }} />
              <Bar dataKey="generations" fill="#9933ff" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
