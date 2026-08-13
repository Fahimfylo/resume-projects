'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  Users, Gamepad2, Swords, ShieldAlert, Activity, Zap, Clock, AlertTriangle,
  BarChart3, Globe, UserPlus, BrainCircuit,
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const { is, can, role } = useRBAC();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }

    if (!is.staff) {
      router.push('/dashboard');
      return;
    }

    api.get<{ success: boolean; dashboard: any }>('/admin/dashboard')
      .then((res) => setData(res.dashboard))
      .catch(() => setError('Failed to load telemetry'));
  }, [user, loading, router]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-nexus-void flex items-center justify-center">
        <div className="text-nexus-jade font-headline text-sm tracking-[0.3em] animate-pulse">
          SYNCING COMMAND CENTER TELEMETRY...
        </div>
      </div>
    );
  }

  const widgets = [
    { icon: Users, label: 'Total Users', value: data.totalUsers, color: 'text-nexus-jade', border: 'border-nexus-jade/30' },
    { icon: Activity, label: 'Active Players (24h)', value: data.activePlayers, color: 'text-nexus-teal', border: 'border-nexus-teal/30' },
    { icon: Zap, label: 'Online Now', value: data.onlineUsers, color: 'text-nexus-purple', border: 'border-nexus-purple/30' },
    { icon: BrainCircuit, label: 'AI Sessions (24h)', value: data.aiSessions, color: 'text-nexus-gold', border: 'border-nexus-gold/30' },
    { icon: Swords, label: 'Active Clans', value: data.totalGroups, color: 'text-nexus-jade', border: 'border-nexus-jade/30' },
    { icon: ShieldAlert, label: 'Pending Reports', value: data.pendingReports, color: 'text-destructive', border: 'border-destructive/30' },
    { icon: UserPlus, label: 'New (7d)', value: data.newRegistrations, color: 'text-nexus-teal', border: 'border-nexus-teal/30' },
    { icon: AlertTriangle, label: 'Suspicious', value: data.suspiciousAccounts, color: 'text-amber-500', border: 'border-amber-500/30' },
  ];

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
          <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">NEXUS Command Center</div>
          <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
            GLOBAL <span className="text-nexus-jade">OVERVIEW</span>
          </h1>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-nexus-carbon/60 border border-white/10 rounded-sm">
            <Clock className="w-3 h-3 text-nexus-jade" />
            <span className="text-[10px] font-ui text-white/40 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="w-2 h-2 bg-nexus-jade rounded-full animate-pulse" />
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
            <Card className={`glass-panel p-5 rounded-none hud-frame ${w.border} bg-nexus-carbon/40`}>
              <div className="flex items-center justify-between mb-3">
                <w.icon className={`w-5 h-5 ${w.color}`} />
                <span className="text-[10px] font-ui text-white/30 uppercase tracking-widest">{w.label}</span>
              </div>
              <div className={`text-3xl font-headline font-black ${w.color}`}>
                {w.value.toLocaleString()}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui text-nexus-jade tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Sessions by Game (7d)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1115', border: '1px solid #76ff0320', borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: '#76ff03' }}
                />
                <Bar dataKey="sessions" fill="#76ff03" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-panel p-6 rounded-none hud-frame bg-nexus-carbon/40 border-white/10">
          <h3 className="text-xs font-ui text-nexus-teal tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> New Registrations (14d)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regData}>
                <XAxis dataKey="date" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1115', border: '1px solid #00e5cc20', borderRadius: 0, fontSize: 12 }}
                  labelStyle={{ color: '#00e5cc' }}
                />
                <Bar dataKey="registrations" fill="#00e5cc" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
