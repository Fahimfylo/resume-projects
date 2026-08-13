'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Bell, Send, Megaphone } from 'lucide-react';

export default function GuardianNotifications() {
  const { user, loading } = useAuth();
  const { is } = useRBAC();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [form, setForm] = useState({ type: 'global_announcement', title: '', message: '', targetRole: 'ALL' });

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; notifications: any[] }>('/admin/notifications');
      setNotifications(res.notifications);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!is.staff) { router.push('/dashboard'); return; }
    fetchNotifications();
  }, [user, loading, router, fetchNotifications, is.staff]);

  const handleSend = async () => {
    if (!form.title || !form.message) return;
    try {
      await api.post('/admin/notifications', form);
      setForm({ type: 'global_announcement', title: '', message: '', targetRole: 'ALL' });
      fetchNotifications();
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian Broadcast</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          NOTIFICATION <span className="text-nexus-teal">HUB</span>
        </h1>
      </div>

      <Card className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40 mb-8">
        <h3 className="text-xs font-ui text-nexus-teal tracking-[0.3em] mb-6 uppercase flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Send Global Announcement
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 text-sm font-ui text-white">
              <option value="global_announcement">Global Announcement</option>
              <option value="maintenance_alert">Maintenance Alert</option>
              <option value="esports_update">Esports Update</option>
              <option value="security_warning">Security Warning</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Target Role</label>
            <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="w-full bg-black/40 border border-white/10 p-2 text-sm font-ui text-white">
              <option value="ALL">All Users</option>
              <option value="ADMIN">Admins Only</option>
              <option value="MODERATOR">Moderators</option>
              <option value="USER">Regular Users</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" className="bg-black/40 border-white/10 font-ui text-sm" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-1 block">Message</label>
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Broadcast message..." className="bg-black/40 border-white/10 font-ui text-sm" />
        </div>
        <Button onClick={handleSend} className="bg-nexus-teal text-nexus-void font-ui text-xs">
          <Send className="w-4 h-4 mr-2" /> Broadcast
        </Button>
      </Card>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div
            key={n._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel border-white/10 p-5 rounded-none hud-frame bg-nexus-carbon/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Bell className="w-4 h-4 text-nexus-teal mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline text-sm text-white">{n.title}</span>
                    <Badge className="text-[9px] bg-white/5 text-white/40 border-white/10">{n.type}</Badge>
                    <Badge className="text-[9px] bg-nexus-teal/10 text-nexus-teal border-nexus-teal/30">{n.targetRole}</Badge>
                  </div>
                  <p className="text-xs text-white/60 font-ui">{n.message}</p>
                </div>
              </div>
              <div className="text-[9px] text-white/30 font-ui shrink-0">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No notifications sent yet</div>
        )}
      </div>
    </div>
  );
}
