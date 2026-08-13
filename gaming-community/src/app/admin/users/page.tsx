'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Search, Shield, Ban, UserX, RotateCcw, LogOut, ChevronLeft, ChevronRight,
  Trash2, Clock, AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { ROLE_HIERARCHY } from '@/lib/rbac';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'text-red-400 border-red-400/30 bg-red-400/10',
  ADMIN: 'text-nexus-purple border-nexus-purple/30 bg-nexus-purple/10',
  MODERATOR: 'text-nexus-teal border-nexus-teal/30 bg-nexus-teal/10',
  TEAM_LEADER: 'text-nexus-gold border-nexus-gold/30 bg-nexus-gold/10',
  VERIFIED_CREATOR: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  PRO_PLAYER: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  USER: 'text-white/50 border-white/10 bg-white/5',
};

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const { can, is } = useRBAC();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    try {
      const res = await api.get<{ success: boolean; users: any[]; pagination: any }>(`/admin/users?${params}`);
      setUsers(res.users);
      setPagination(res.pagination);
    } catch {}
  }, [search, roleFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth'); return; }
    if (!can('users.view')) { router.push('/dashboard'); return; }
    fetchUsers();
  }, [user, authLoading, router, fetchUsers, can]);

  const handleBan = async (userId: string, permanent: boolean) => {
    try {
      await api.post(`/admin/users/${userId}/ban`, { reason: '', permanent });
      setBanDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
    } catch {}
  };

  const handleUnban = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/unban`, {});
      fetchUsers(pagination.page);
    } catch {}
  };

  const handleSuspend = async (userId: string, days: number) => {
    try {
      await api.post(`/admin/users/${userId}/suspend`, { days, reason: '' });
      setBanDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
    } catch {}
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(pagination.page);
    } catch {}
  };

  const handleForceLogout = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/force-logout`, {});
      fetchUsers(pagination.page);
    } catch {}
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('PERMANENTLY DELETE this user and all associated data? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers(pagination.page);
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">Management</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          USER <span className="text-nexus-purple">DIRECTORY</span>
        </h1>
      </div>

      <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="Search by gamer tag or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); fetchUsers(1); } }}
              className="pl-9 bg-black/40 border-white/10 text-sm font-ui"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); fetchUsers(1); }}>
            <SelectTrigger className="w-[160px] bg-black/40 border-white/10 font-ui text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-nexus-carbon border-white/10">
              <SelectItem value=" ">All Roles</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MODERATOR">Moderator</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchUsers(1)} variant="outline" className="border-white/10 font-ui text-xs">
            Scan
          </Button>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Gamer Tag</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest hidden lg:table-cell">Email</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Role</th>
              <th className="text-center py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Status</th>
              <th className="text-center py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest hidden md:table-cell">Warnings</th>
              <th className="text-right py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr
                key={u._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4">
                  <Link href={`/admin/users?id=${u._id}`} className="font-headline text-white hover:text-nexus-jade transition-colors">
                    {u.gamerTag || 'UNNAMED'}
                  </Link>
                  <div className="text-[10px] text-white/30 font-ui">{u.rank || 'NOVICE'} Lv.{u.level || 1}</div>
                </td>
                <td className="py-3 px-4 text-white/50 font-ui text-xs hidden lg:table-cell">{u.email}</td>
                <td className="py-3 px-4">
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u._id, v)}
                      disabled={!can('roles.promote')}
                    >
                    <SelectTrigger className={`h-7 text-[10px] font-ui border ${ROLE_COLORS[u.role] || 'border-white/10'} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nexus-carbon border-white/10 text-xs">
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MODERATOR">Moderator</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-1">
                    {u.isBanned && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">BANNED</Badge>}
                    {u.isSuspended && <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">SUSPENDED</Badge>}
                    {!u.isBanned && !u.isSuspended && <Badge className="text-[9px] px-1.5 py-0 bg-nexus-jade/10 text-nexus-jade border-nexus-jade/30">ACTIVE</Badge>}
                  </div>
                </td>
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  <span className={`text-xs font-ui ${u.warnings > 0 ? 'text-amber-400' : 'text-white/30'}`}>{u.warnings || 0}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Dialog open={banDialogOpen && selectedUser?._id === u._id} onOpenChange={setBanDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-white/40 hover:text-destructive"
                          onClick={() => setSelectedUser(u)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-nexus-carbon border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle className="font-headline">ACTION: {selectedUser?.gamerTag}</DialogTitle>
                          <DialogDescription className="text-white/50 font-ui text-xs">Apply restriction</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <Button onClick={() => handleBan(u._id, true)} variant="destructive" className="font-ui text-xs">
                            <Ban className="w-4 h-4 mr-2" /> Permanent Ban
                          </Button>
                          <Button onClick={() => handleSuspend(u._id, 3)} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 font-ui text-xs">
                            <Clock className="w-4 h-4 mr-2" /> 3-Day Suspension
                          </Button>
                          <Button onClick={() => handleSuspend(u._id, 7)} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 font-ui text-xs">
                            <Clock className="w-4 h-4 mr-2" /> 7-Day Suspension
                          </Button>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setBanDialogOpen(false)} className="font-ui text-xs">Cancel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {u.isBanned && (
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-white/40 hover:text-nexus-jade" onClick={() => handleUnban(u._id)}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Button size="icon" variant="ghost" className="w-7 h-7 text-white/40 hover:text-nexus-gold" onClick={() => handleForceLogout(u._id)}>
                      <LogOut className="w-3.5 h-3.5" />
                    </Button>

                    {can('users.remove') && is.superAdmin && (
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-white/40 hover:text-destructive" onClick={() => handleDelete(u._id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">
            No users found
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-[10px] font-ui text-white/30">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="border-white/10 font-ui text-xs"
            >
              <ChevronLeft className="w-3 h-3 mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="border-white/10 font-ui text-xs"
            >
              Next <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
