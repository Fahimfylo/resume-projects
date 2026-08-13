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
import { Flag, ShieldAlert, AlertTriangle, Ban, UserX, MessageSquare } from 'lucide-react';

export default function GuardianReports() {
  const { user, loading } = useAuth();
  const { can } = useRBAC();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, pages: 1 });

  const fetchReports = useCallback(async (page = 1) => {
    try {
      const res = await api.get<{ success: boolean; reports: any[]; pagination: any }>(`/admin/reports?page=${page}&status=pending`);
      setReports(res.reports);
      setPagination(res.pagination);
    } catch {}
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/auth'); return; }
    if (!can('moderation.review')) { router.push('/dashboard'); return; }
    fetchReports();
  }, [user, loading, router, fetchReports, can]);

  const handleResolve = async (reportId: string, action: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}`, { action, status: 'resolved' });
      fetchReports(pagination.page);
    } catch {}
  };

  const handleDismiss = async (reportId: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}`, { action: 'none', status: 'dismissed' });
      fetchReports(pagination.page);
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Reports Center</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          REPORT <span className="text-destructive">INBOX</span>
        </h1>
        <div className="mt-2 text-xs font-ui text-white/40">{pagination.total} pending reports</div>
      </div>

      <div className="space-y-4">
        {reports.map((report, i) => (
          <motion.div
            key={report._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel border-white/10 p-6 rounded-none hud-frame bg-nexus-carbon/40"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flag className="w-4 h-4 text-destructive" />
                  <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/30 uppercase">{report.reason}</Badge>
                  <Badge className="text-[9px] bg-white/5 text-white/40 border-white/10">{report.targetType}</Badge>
                </div>
                <div className="text-xs text-white/60 font-ui mt-1">
                  Reported by <span style={{ color: '#ffd700' }}>{report.reporter?.gamerTag || 'System'}</span>
                  {report.targetUser && (
                    <> against <span className="text-amber-400">{report.targetUser?.gamerTag || 'Unknown'}</span></>
                  )}
                </div>
              </div>
              <div className="text-[9px] text-white/30 font-ui shrink-0">{new Date(report.createdAt).toLocaleString()}</div>
            </div>

            {report.description && (
              <div className="mb-4 p-3 bg-black/30 border border-white/5 text-sm text-white/70 font-ui">
                {report.description}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="destructive" onClick={() => handleResolve(report._id, 'permanent_ban')} className="font-ui text-xs">
                <Ban className="w-3.5 h-3.5 mr-1" /> Ban
              </Button>
              <Button size="sm" className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 font-ui text-xs" onClick={() => handleResolve(report._id, 'temp_suspension')}>
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Suspend (7d)
              </Button>
              <Button size="sm" className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 font-ui text-xs" onClick={() => handleResolve(report._id, 'warning')}>
                <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Warning
              </Button>
              <Button size="sm" variant="ghost" className="text-white/40 hover:text-nexus-jade font-ui text-xs" onClick={() => handleDismiss(report._id)}>
                Dismiss
              </Button>
            </div>
          </motion.div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No pending reports — peace prevails</div>
        )}
      </div>
    </div>
  );
}
