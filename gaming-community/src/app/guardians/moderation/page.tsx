'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRBAC } from '@/lib/useRBAC';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Trash2, MessageSquare, FileText, ShieldAlert, CheckCircle, XCircle,
  ArrowUpCircle, Eye,
} from 'lucide-react';

const MOD_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  approved: 'bg-nexus-jade/10 text-nexus-jade border-nexus-jade/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  escalated: 'bg-nexus-purple/10 text-nexus-purple border-nexus-purple/30',
};

export default function GuardianModeration() {
  const { user, loading: authLoading } = useAuth();
  const { can } = useRBAC();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchModeration = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<{ success: boolean; posts: any[]; comments: any[]; pagination: any }>(`/admin/moderation?${params}`);
      setPosts(res.posts);
      setComments(res.comments);
      setPagination(res.pagination);
    } catch {}
  }, [statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth'); return; }
    if (!can('moderation.review')) { router.push('/dashboard'); return; }
    fetchModeration();
  }, [user, authLoading, router, fetchModeration, can]);

  const handleApprove = async (postId: string) => {
    setProcessing(postId);
    try {
      await api.post('/admin/moderation/approve', { postId });
      fetchModeration(pagination.page);
    } catch {}
    setProcessing(null);
  };

  const handleReject = async (postId: string) => {
    const reason = prompt('Rejection reason (optional):');
    setProcessing(postId);
    try {
      await api.post('/admin/moderation/reject', { postId, reason: reason || undefined });
      fetchModeration(pagination.page);
    } catch {}
    setProcessing(null);
  };

  const handleEscalate = async (postId: string) => {
    const reason = prompt('Reason for escalation:');
    setProcessing(postId);
    try {
      await api.post('/admin/moderation/escalate', { postId, reason: reason || undefined });
      fetchModeration(pagination.page);
    } catch {}
    setProcessing(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Remove this post? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/moderation/posts/${postId}`);
      fetchModeration(pagination.page);
    } catch {}
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Remove this comment?')) return;
    try {
      await api.delete(`/admin/moderation/posts/${postId}/comments/${commentId}`);
      fetchModeration(pagination.page);
    } catch {}
  };

  return (
    <div className="p-6 lg:p-10 pt-20 lg:pt-10">
      <div className="mb-8">
        <div className="text-[10px] font-ui text-[#ffd700] tracking-[0.5em] mb-2 uppercase">Guardian Moderation</div>
        <h1 className="text-3xl lg:text-5xl font-headline font-black text-white tracking-tighter uppercase">
          CONTENT <span style={{ color: '#ffd700' }}>REVIEW</span>
        </h1>
      </div>

      <Card className="glass-panel border-white/10 p-4 rounded-none hud-frame bg-nexus-carbon/40 mb-6">
        <div className="flex items-center gap-4">
          <Eye className="w-4 h-4 text-white/40" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); }}>
            <SelectTrigger className="w-[180px] bg-black/40 border-white/10 font-ui text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-nexus-carbon border-white/10">
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] font-ui text-white/30">
            {pagination.total} {statusFilter ? `${statusFilter} ` : ''}items
          </div>
        </div>
      </Card>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="bg-nexus-carbon/60 border border-white/10 p-1 rounded-none">
          <TabsTrigger value="posts" className="font-ui text-xs data-[state=active]:bg-[#ffd700] data-[state=active]:text-nexus-void rounded-none">
            <FileText className="w-3.5 h-3.5 mr-2" /> Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="font-ui text-xs data-[state=active]:bg-[#ffd700] data-[state=active]:text-nexus-void rounded-none">
            <MessageSquare className="w-3.5 h-3.5 mr-2" /> Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel border-white/10 p-5 rounded-none hud-frame bg-nexus-carbon/40"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-headline" style={{ color: '#ffd700' }}>{post.userId?.gamerTag || 'UNKNOWN'}</span>
                    <Badge className={`text-[9px] ${MOD_STATUS_COLORS[post.moderationStatus] || 'bg-white/5 text-white/40'}`}>
                      {post.moderationStatus || 'unknown'}
                    </Badge>
                    {post.isFlagged && <Badge className="text-[9px] bg-destructive/10 text-destructive border-destructive/30">FLAGGED</Badge>}
                    <span className="text-[9px] text-white/30 font-ui">{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-white/80 line-clamp-3">{post.content}</p>
                  {post.image && <Badge className="mt-2 text-[9px] bg-nexus-purple/10 text-nexus-purple border-nexus-purple/30">Has Image</Badge>}
                  {post.moderationNote && (
                    <div className="mt-2 text-[10px] text-white/40 font-ui italic">
                      Note: {post.moderationNote}
                    </div>
                  )}
                  {post.moderatedBy && (
                    <div className="mt-1 text-[9px] text-white/30 font-ui">
                      Reviewed by: {post.moderatedBy?.gamerTag || 'System'}
                    </div>
                  )}
                </div>
              </div>

              {post.moderationStatus === 'pending' && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {can('moderation.approve') && (
                    <Button
                      size="sm"
                      className="bg-nexus-jade/20 text-nexus-jade hover:bg-nexus-jade/30 border border-nexus-jade/30 font-ui text-xs"
                      onClick={() => handleApprove(post._id)}
                      disabled={processing === post._id}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  )}
                  {can('moderation.reject') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="font-ui text-xs"
                      onClick={() => handleReject(post._id)}
                      disabled={processing === post._id}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  )}
                  {can('moderation.escalate') && (
                    <Button
                      size="sm"
                      className="bg-nexus-purple/20 text-nexus-purple hover:bg-nexus-purple/30 border border-nexus-purple/30 font-ui text-xs"
                      onClick={() => handleEscalate(post._id)}
                      disabled={processing === post._id}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Escalate
                    </Button>
                  )}
                </div>
              )}

              {post.moderationStatus === 'escalated' && can('moderation.override') && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                  {can('moderation.approve') && (
                    <Button
                      size="sm"
                      className="bg-nexus-jade/20 text-nexus-jade hover:bg-nexus-jade/30 border border-nexus-jade/30 font-ui text-xs"
                      onClick={() => handleApprove(post._id)}
                      disabled={processing === post._id}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Override Approve
                    </Button>
                  )}
                  {can('moderation.reject') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="font-ui text-xs"
                      onClick={() => handleReject(post._id)}
                      disabled={processing === post._id}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Override Reject
                    </Button>
                  )}
                </div>
              )}

              {can('feed.delete') && (
                <div className="flex justify-end pt-3 border-t border-white/5 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/40 hover:text-destructive font-ui text-xs"
                    onClick={() => handleDeletePost(post._id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Post
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No posts to moderate</div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-3">
          {comments.map((comment, i) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel border-white/10 p-5 rounded-none hud-frame bg-nexus-carbon/40 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-headline" style={{ color: '#ffd700' }}>{comment.gamerTag || 'UNKNOWN'}</span>
                  <span className="text-[9px] text-white/30 font-ui">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/80">{comment.content}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-white/40 hover:text-destructive"
                onClick={() => handleDeleteComment(comment.postId, comment._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-16 text-white/30 font-ui text-xs uppercase tracking-widest">No comments to moderate</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
