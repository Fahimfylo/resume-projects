'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Gamepad2, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from 'recharts';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100, ADMIN: 80, MODERATOR: 60, TEAM_LEADER: 40,
  VERIFIED_CREATOR: 30, PRO_PLAYER: 20, USER: 10,
};

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if ((ROLE_HIERARCHY[user.role] || 0) < 60) { router.push('/dashboard'); return; }
    api.get<{ success: boolean; analytics: any }>('/admin/analytics')
      .then((res) => setData(res.analytics))
      .catch(() => {});
  }, [user, loading, router]);

  if (!data) return <div className="min-h-screen bg-nexus-void flex items-center justify-center"><div className="text-nexus-jade font-headline text-sm animate-pulse">CALCULATING METRICS...</div></div>;

  const dauChartData = (data.dauData || []).map((d: any) => ({ date: d._id?.slice(5) || d._id, users: d.count }));
  const topGamesData = (data.topGames || []).map((g: any) => ({ name: g._id?.length > 12 ? g._id?.slice(0, 12) + '...' : g._id, sessions: g.sessions, players: g.uniquePlayers }));

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">Metrics Lab</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          PLATFORM <span className="text-nexus-teal">ANALYTICS</span>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <Users className="w-5 h-5 text-nexus-teal mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Total Users</div>
          <div className="text-2xl font-headline font-black text-white">{data.totalUsers?.toLocaleString() || 0}</div>
        </Card>
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <Gamepad2 className="w-5 h-5 text-nexus-jade mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Total Sessions</div>
          <div className="text-2xl font-headline font-black text-white">{data.totalSessions?.toLocaleString() || 0}</div>
        </Card>
        <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <TrendingUp className="w-5 h-5 text-nexus-gold mb-3" />
          <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1">Top Game</div>
          <div className="text-2xl font-headline font-black text-white">{data.topGames?.[0]?._id || 'N/A'}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui text-nexus-teal tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> DAU (30d)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dauChartData}>
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f1115', border: '1px solid #00e5cc20', borderRadius: 0, fontSize: 12 }} labelStyle={{ color: '#00e5cc' }} />
                <Line type="monotone" dataKey="users" stroke="#00e5cc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui text-nexus-jade tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Most Played Games
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGamesData}>
                <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f1115', border: '1px solid #76ff0320', borderRadius: 0, fontSize: 12 }} labelStyle={{ color: '#76ff03' }} />
                <Bar dataKey="sessions" fill="#76ff03" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
