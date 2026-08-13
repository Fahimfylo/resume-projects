'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ToggleLeft, Plus, X } from 'lucide-react';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100, ADMIN: 80, MODERATOR: 60, TEAM_LEADER: 40,
  VERIFIED_CREATOR: 30, PRO_PLAYER: 20, USER: 10,
};

export default function AdminFeatureFlags() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: '', description: '', category: 'experimental' });

  const fetchFlags = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; flags: any[] }>('/admin/feature-flags');
      setFlags(res.flags);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if ((ROLE_HIERARCHY[user.role] || 0) < 60) { router.push('/dashboard'); return; }
    fetchFlags();
  }, [user, loading, router, fetchFlags]);

  const handleToggle = async (flagId: string, currentEnabled: boolean) => {
    try {
      await api.patch(`/admin/feature-flags/${flagId}`, { enabled: !currentEnabled });
      fetchFlags();
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.key) return;
    try {
      await api.post('/admin/feature-flags', form);
      setForm({ key: '', description: '', category: 'experimental' });
      setShowForm(false);
      fetchFlags();
    } catch {}
  };

  const categoryColors: Record<string, string> = {
    ai: 'text-nexus-purple border-nexus-purple/30 bg-nexus-purple/10',
    social: 'text-nexus-teal border-nexus-teal/30 bg-nexus-teal/10',
    chat: 'text-nexus-jade border-nexus-jade/30 bg-nexus-jade/10',
    tournaments: 'text-nexus-gold border-nexus-gold/30 bg-nexus-gold/10',
    experimental: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">System Config</div>
          <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
            FEATURE <span className="text-amber-400">FLAGS</span>
          </h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 font-ui text-xs">
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Cancel' : 'New Flag'}
        </Button>
      </div>

      {showForm && (
        <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Key</label>
              <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="feature_key" className="bg-black/40 border-white/10 font-ui text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 text-sm font-ui text-white">
                <option value="ai">AI</option>
                <option value="social">Social</option>
                <option value="chat">Chat</option>
                <option value="tournaments">Tournaments</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this flag controls" className="bg-black/40 border-white/10 font-ui text-sm" />
            </div>
          </div>
          <Button onClick={handleCreate} className="bg-amber-500/30 text-amber-400 border border-amber-500/30 font-ui text-xs">
            <ToggleLeft className="w-4 h-4 mr-2" /> Create Flag
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {flags.map((flag, i) => (
          <motion.div
            key={flag._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel border-white/10 p-5 rounded-none hud-frame bg-nexus-carbon/40 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Switch checked={flag.enabled} onCheckedChange={() => handleToggle(flag._id, flag.enabled)} className="data-[state=checked]:bg-nexus-jade" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline text-sm text-white font-mono">{flag.key}</span>
                  <Badge className={`text-[9px] ${categoryColors[flag.category] || categoryColors.experimental}`}>{flag.category}</Badge>
                </div>
                {flag.description && <div className="text-[10px] font-ui text-white/40 mt-0.5">{flag.description}</div>}
              </div>
            </div>
            <div className={`text-[10px] font-ui uppercase tracking-widest ${flag.enabled ? 'text-nexus-jade' : 'text-white/30'}`}>
              {flag.enabled ? 'ACTIVE' : 'DISABLED'}
            </div>
          </motion.div>
        ))}
        {flags.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No feature flags configured</div>
        )}
      </div>
    </div>
  );
}
