'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100, ADMIN: 80, MODERATOR: 60, TEAM_LEADER: 40,
  VERIFIED_CREATOR: 30, PRO_PLAYER: 20, USER: 10,
};

export default function AdminLogs() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, pages: 1 });

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const res = await api.get<{ success: boolean; logs: any[]; pagination: any }>(`/admin/logs?page=${page}`);
      setLogs(res.logs);
      setPagination(res.pagination);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if ((ROLE_HIERARCHY[user.role] || 0) < 60) { router.push('/dashboard'); return; }
    fetchLogs();
  }, [user, loading, router, fetchLogs]);

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-nexus-jade tracking-[0.5em] mb-2 uppercase">Audit Trail</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          AUDIT <span className="text-nexus-teal">LOGS</span>
        </h1>
        <div className="mt-2 text-xs font-ui text-white/40">{pagination.total} total entries</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Time</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Admin</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Action</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest">Target</th>
              <th className="text-left py-3 px-4 text-[10px] font-ui text-white/40 uppercase tracking-widest hidden lg:table-cell">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <motion.tr
                key={log._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 text-[10px] text-white/50 font-ui whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className="font-headline text-xs text-nexus-jade">{log.admin?.gamerTag || 'System'}</span>
                </td>
                <td className="py-3 px-4">
                  <Badge className="text-[9px] bg-white/5 text-white/60 border-white/10 uppercase">{log.action}</Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] bg-nexus-purple/10 text-nexus-purple border-nexus-purple/30">{log.targetType}</Badge>
                    {log.targetId && <span className="text-[9px] text-white/30 font-mono">{log.targetId.slice(-8)}</span>}
                  </div>
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <span className="text-[10px] text-white/40 font-ui">{JSON.stringify(log.details)?.slice(0, 60) || '-'}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No audit logs found</div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-[10px] font-ui text-white/30">Page {pagination.page} of {pagination.pages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)} className="border-white/10 font-ui text-xs">
              <ChevronLeft className="w-3 h-3 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchLogs(pagination.page + 1)} className="border-white/10 font-ui text-xs">
              Next <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
