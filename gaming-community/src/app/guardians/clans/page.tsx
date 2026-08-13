'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Swords, Trash2, ShieldBan, UserCog, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function GuardianClans() {
  const { user, loading } = useAuth();
  const { can } = useRBAC();
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
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
    if (!can('clans.manage')) { router.push('/dashboard'); return; }
    fetchGroups();
  }, [user, loading, router, fetchGroups, can]);

  const fetchJoinRequests = async (groupId: string) => {
    try {
      const res = await api.get<{ success: boolean; requests: any[] }>(`/groups/${groupId}/requests`);
      setJoinRequests(res.requests);
      setSelectedGroup(groupId);
    } catch {}
  };

  const handleApproveRequest = async (groupId: string, requestId: string) => {
    try {
      await api.post(`/groups/${groupId}/requests/${requestId}/approve`);
      fetchJoinRequests(groupId);
      fetchGroups();
    } catch {}
  };

  const handleRejectRequest = async (groupId: string, requestId: string) => {
    try {
      await api.post(`/groups/${groupId}/requests/${requestId}/reject`);
      fetchJoinRequests(groupId);
    } catch {}
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Delete this clan permanently?')) return;
    try {
      await api.delete(`/admin/groups/${groupId}`);
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
        <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian Clan Ops</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          CLAN <span style={{ color: '#ffd700' }}>DIRECTORY</span>
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
                  <Swords className="w-6 h-6" style={{ color: '#ffd700' }} />
                </div>
                <div>
                  <h3 className="font-headline text-lg text-white">{g.name}</h3>
                  <div className="text-xs font-ui text-white/40">
                    Owner: {g.owner?.gamerTag || 'Unknown'} &bull; {g.members?.length || 0} members
                    {g.joinRequests?.filter((r: any) => r.status === 'pending').length > 0 && (
                      <Badge className="ml-2 text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                        {g.joinRequests.filter((r: any) => r.status === 'pending').length} pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-nexus-jade font-ui text-xs"
                  onClick={() => fetchJoinRequests(g._id)}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Requests
                </Button>
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
                {can('clans.delete') && (
                  <Button size="sm" variant="ghost" className="text-white/40 hover:text-destructive font-ui text-xs" onClick={() => handleDelete(g._id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
            {g.description && <p className="mt-3 text-xs text-white/50 font-ui">{g.description}</p>}

            {selectedGroup === g._id && joinRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="text-[10px] font-ui text-amber-400 uppercase tracking-widest mb-2">Pending Join Requests</div>
                {joinRequests.map((req: any) => (
                  <div key={req._id} className="flex items-center justify-between bg-black/30 p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-headline text-white">{req.userId?.gamerTag || 'Unknown'}</div>
                      <div className="text-[9px] text-white/30 font-ui">Lv.{req.userId?.level || '?'}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-nexus-jade/20 text-nexus-jade border border-nexus-jade/30 font-ui text-xs" onClick={() => handleApproveRequest(g._id, req._id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" className="font-ui text-xs" onClick={() => handleRejectRequest(g._id, req._id)}>
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No clans registered</div>
        )}
      </div>
    </div>
  );
}
