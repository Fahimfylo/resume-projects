'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Swords, Trash2, ShieldBan, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100, ADMIN: 80, MODERATOR: 60, TEAM_LEADER: 40,
  VERIFIED_CREATOR: 30, PRO_PLAYER: 20, USER: 10,
};

export default function AdminClans() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [newOwnerId, setNewOwnerId] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; groups: any[] }>('/admin/groups');
      setGroups(res.groups);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if ((ROLE_HIERARCHY[user.role] || 0) < 60) { router.push('/dashboard'); return; }
    fetchGroups();
  }, [user, loading, router, fetchGroups]);

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete this clan permanently?')) return;
    try {
      await api.delete(`/admin/groups/${groupId}`);
      fetchGroups();
    } catch {}
  };

  const handleSuspend = async (groupId: string) => {
    try {
      await api.post(`/admin/groups/${groupId}/suspend`, {});
      fetchGroups();
    } catch {}
  };

  const handleTransfer = async (groupId: string) => {
    if (!newOwnerId) return;
    try {
      await api.post(`/admin/groups/${groupId}/transfer`, { newOwnerId });
      setNewOwnerId('');
      fetchGroups();
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">Community</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          CLAN <span className="text-nexus-gold">DIRECTORY</span>
        </h1>
      </div>

      <div className="space-y-4">
        {groups.map((g, i) => (
          <motion.div
            key={g._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center border border-white/10">
                  <Swords className="w-6 h-6 text-nexus-gold" />
                </div>
                <div>
                  <h3 className="font-headline text-lg text-white">{g.name}</h3>
                  <div className="text-xs font-ui text-white/40">
                    Owner: {g.owner?.gamerTag || 'Unknown'} • {g.members?.length || 0} members
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New owner ID"
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-32 h-8 bg-black/40 border-white/10 text-xs font-ui"
                  />
                  <Button size="sm" variant="ghost" className="text-white/40 hover:text-nexus-teal font-ui text-xs" onClick={() => handleTransfer(g._id)}>
                    <UserCog className="w-3.5 h-3.5 mr-1" /> Transfer
                  </Button>
                </div>
                <Button size="sm" variant="ghost" className="text-white/40 hover:text-amber-400 font-ui text-xs" onClick={() => handleSuspend(g._id)}>
                  <ShieldBan className="w-3.5 h-3.5 mr-1" /> Suspend
                </Button>
                <Button size="sm" variant="ghost" className="text-white/40 hover:text-destructive font-ui text-xs" onClick={() => handleDelete(g._id)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
            {g.description && <p className="mt-3 text-xs text-white/50 font-ui">{g.description}</p>}
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No clans registered</div>
        )}
      </div>
    </div>
  );
}
