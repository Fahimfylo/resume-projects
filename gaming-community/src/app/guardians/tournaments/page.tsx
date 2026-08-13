'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Trophy, Plus, X } from 'lucide-react';

export default function GuardianTournaments() {
  const { user, loading } = useAuth();
  const { can } = useRBAC();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', game: '', description: '', type: 'solo', maxParticipants: 16, prizePool: 0 });

  const fetchTournaments = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; tournaments: any[] }>('/admin/tournaments');
      setTournaments(res.tournaments);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!can('tournaments.manage')) { router.push('/dashboard'); return; }
    fetchTournaments();
  }, [user, loading, router, fetchTournaments, can]);

  const handleCreate = async () => {
    try {
      await api.post('/admin/tournaments', form);
      setShowForm(false);
      setForm({ name: '', game: '', description: '', type: 'solo', maxParticipants: 16, prizePool: 0 });
      fetchTournaments();
    } catch {}
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/tournaments/${id}`, { status });
      fetchTournaments();
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian Tournaments</div>
          <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
            TOURNAMENT <span style={{ color: '#ffd700' }}>HUB</span>
          </h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="font-ui text-xs text-nexus-void" style={{ backgroundColor: '#ffd700' }}>
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Cancel' : 'Create'}
        </Button>
      </div>

      {showForm && (
        <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40 mb-8">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black/40 border-white/10 font-ui text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Game</label>
              <Input value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })} className="bg-black/40 border-white/10 font-ui text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 text-sm font-ui text-white">
                <option value="solo">Solo</option>
                <option value="team">Team</option>
                <option value="clan">Clan</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Max Players</label>
                <Input type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 16 })} className="bg-black/40 border-white/10 font-ui text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Prize Pool</label>
                <Input type="number" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: parseInt(e.target.value) || 0 })} className="bg-black/40 border-white/10 font-ui text-sm" />
              </div>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-black/40 border-white/10 font-ui text-sm" />
          </div>
          <Button onClick={handleCreate} className="font-ui text-xs text-nexus-void" style={{ backgroundColor: '#ffd700' }}>
            <Trophy className="w-4 h-4 mr-2" /> Launch Tournament
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {tournaments.map((t, i) => (
          <motion.div
            key={t._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Trophy className="w-5 h-5" style={{ color: '#ffd700' }} />
                  <h3 className="font-headline text-lg text-white">{t.name}</h3>
                  <Badge className={`text-[9px] ${
                    t.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    t.status === 'in_progress' ? 'bg-nexus-jade/10 text-nexus-jade border-nexus-jade/30' :
                    t.status === 'completed' ? 'bg-white/5 text-white/40 border-white/10' :
                    'bg-destructive/10 text-destructive border-destructive/30'
                  }`}>{t.status}</Badge>
                </div>
                <div className="text-xs font-ui text-white/50">{t.game} &bull; {t.type} &bull; {t.participants?.length || 0}/{t.maxParticipants}</div>
              </div>
              <div className="text-right text-xs font-ui">
                <div className="font-headline" style={{ color: '#ffd700' }}>${(t.prizePool || 0).toLocaleString()}</div>
                <div className="text-white/30 text-[9px]">Created by {t.createdBy?.gamerTag || 'Admin'}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {t.status === 'upcoming' && (
                <Button size="sm" className="bg-nexus-jade/20 text-nexus-jade border border-nexus-jade/30 font-ui text-xs" onClick={() => handleStatusChange(t._id, 'in_progress')}>
                  Start
                </Button>
              )}
              {t.status === 'in_progress' && (
                <Button size="sm" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-ui text-xs" onClick={() => handleStatusChange(t._id, 'completed')}>
                  Complete
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-destructive font-ui text-xs" onClick={() => handleStatusChange(t._id, 'cancelled')}>
                Cancel
              </Button>
            </div>
          </motion.div>
        ))}
        {tournaments.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No tournaments yet</div>
        )}
      </div>
    </div>
  );
}
