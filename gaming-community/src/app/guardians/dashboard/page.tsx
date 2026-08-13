'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Users, Swords, ShieldAlert, Activity, Zap, Clock, AlertTriangle,
  BarChart3, UserPlus, BrainCircuit, Eye, Flag, Gavel,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function GuardianDashboard() {
  const { user, loading } = useAuth();
  const { is, can } = useRBAC();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
    api.get<{ success: boolean; dashboard: any }>('/admin/dashboard')
      .then((res) => setData(res.dashboard))
      .catch(() => setError('Failed to load telemetry'));
  }, [user, loading, is.staff, router]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-nexus-void flex items-center justify-center">
        <div className="text-[#ffd700] font-headline text-sm tracking-[0.3em] animate-pulse">
          SYNCING GUARDIAN TELEMETRY...
        </div>
      </div>
    );
  }

  const widgets: { icon: any; label: string; value: number; show: boolean }[] = [
    { icon: Users, label: 'Total Users', value: data.totalUsers, show: true },
    { icon: Activity, label: 'Active Players (24h)', value: data.activePlayers, show: true },
    { icon: Zap, label: 'Online Now', value: data.onlineUsers, show: true },
    { icon: BrainCircuit, label: 'AI Sessions (24h)', value: data.aiSessions, show: can('system.settings') },
    { icon: Swords, label: 'Active Clans', value: data.totalGroups, show: can('clans.manage') },
    { icon: ShieldAlert, label: 'Pending Reports', value: data.pendingReports, show: can('moderation.review') },
    { icon: UserPlus, label: 'New (7d)', value: data.newRegistrations, show: true },
    { icon: AlertTriangle, label: 'Suspicious', value: data.suspiciousAccounts, show: can('users.view') },
  ].filter(w => w.show);

  const chartData = (data.sessionsByGame || []).map((g: any) => ({
    name: g._id?.length > 12 ? g._id?.slice(0, 12) + '...' : g._id,
    sessions: g.count,
    players: g.uniqueUsers || 0,
  }));

  const regData = (data.dailyRegistrations || []).map((d: any) => ({
    date: d._id?.slice(5) || d._id,
    registrations: d.count,
  }));

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian Command Center</div>
          <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
            GUARDIAN <span style={{ color: '#ffd700' }}>OVERVIEW</span>
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-nexus-carbon/60 border border-white/10 rounded-sm">
            <Clock className="w-3 h-3 text-[#ffd700]" />
            <span className="text-[10px] font-ui text-white/40 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#ffd700' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {widgets.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <w.icon className="w-5 h-5" style={{ color: '#ffd700' }} />
                <span className="text-[10px] font-ui text-white/30 uppercase tracking-widest">{w.label}</span>
              </div>
              <div className="text-3xl font-headline font-black text-white">
                {w.value.toLocaleString()}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui tracking-[0.3em] mb-6 uppercase flex items-center gap-2" style={{ color: '#ffd700' }}>
            <BarChart3 className="w-4 h-4" /> Sessions by Game (7d)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1115', border: '1px solid #ffd70020', borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: '#ffd700' }}
                />
                <Bar dataKey="sessions" fill="#ffd700" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui tracking-[0.3em] mb-6 uppercase flex items-center gap-2" style={{ color: '#ffd700' }}>
            <UserPlus className="w-4 h-4" /> New Registrations (14d)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regData}>
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1115', border: '1px solid #ffd70020', borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: '#ffd700' }}
                />
                <Bar dataKey="registrations" fill="#ffd700" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {can('moderation.review') && (
          <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10 flex items-center gap-4">
            <Eye className="w-8 h-8" style={{ color: '#ffd700' }} />
            <div>
              <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest">Moderation Queue</div>
              <div className="text-lg font-headline font-bold text-white">{data.pendingReports || 0} pending</div>
            </div>
          </Card>
        )}
        {can('users.view') && (
          <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10 flex items-center gap-4">
            <Users className="w-8 h-8 text-nexus-purple" />
            <div>
              <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest">Total Registered</div>
              <div className="text-lg font-headline font-bold text-white">{data.totalUsers || 0}</div>
            </div>
          </Card>
        )}
        {can('clans.manage') && (
          <Card className="glass-panel p-5 rounded-none hud-frame bg-nexus-carbon/40 border-white/10 flex items-center gap-4">
            <Swords className="w-8 h-8 text-nexus-teal" />
            <div>
              <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest">Active Clans</div>
              <div className="text-lg font-headline font-bold text-white">{data.totalGroups || 0}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
