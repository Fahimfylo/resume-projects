'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Swords, Lock, ChevronDown, ChevronRight, Search, Users, User, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { usePresence } from '@/lib/useSocket';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Conversation {
  _id: string;
  roomId: string;
  participants: { _id: string; gamerTag: string; avatarUrl?: string; rank?: string }[];
  lastMessage?: { content: string; sender: { gamerTag: string }; sentAt: string };
}

interface ClanSummary {
  _id: string;
  name: string;
  members: number;
}

interface SearchUser {
  _id: string;
  gamerTag: string;
  avatarUrl?: string;
  rank?: string;
  level?: number;
  gamerBio?: string;
}

interface SearchGroup {
  _id: string;
  name: string;
  description?: string;
  owner: { _id: string; gamerTag: string; avatarUrl?: string; rank?: string };
  members: any[];
  moderators: any[];
  joinRequests: { userId: any; status: string }[];
  stats?: { wins: number; losses: number; totalMatches: number };
}

interface ChatSidebarProps {
  onSelectClan: (clanId: string, clanName: string) => void;
  onSelectDM: (userId: string, gamerTag: string) => void;
  activeClanId?: string | null;
  activeDMUserId?: string | null;
}

export function ChatSidebar({ onSelectClan, onSelectDM, activeClanId, activeDMUserId }: ChatSidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [myClans, setMyClans] = useState<ClanSummary[]>([]);
  const [clansExpanded, setClansExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ users: SearchUser[]; groups: SearchGroup[] }>({ users: [], groups: [] });
  const [searching, setSearching] = useState(false);
  const [joinLoading, setJoinLoading] = useState<Record<string, boolean>>({});
  const [joinStatus, setJoinStatus] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>({});
  const presence = usePresence();

  useEffect(() => {
    api.get<{ success: boolean; conversations: Conversation[] }>('/chat/conversations')
      .then((res) => setConversations(res.conversations))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get<{ success: boolean; groups: any[] }>('/groups')
      .then((res) => {
        const userGroups = res.groups.filter((g) =>
          g.members?.some((m: any) => String(m._id || m) === String(user?._id))
        );
        setMyClans(userGroups.map((g) => ({ _id: g._id, name: g.name, members: g.members?.length || 0 })));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get<{ success: boolean; users: SearchUser[]; groups: SearchGroup[] }>(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res);
      } catch {
        setSearchResults({ users: [], groups: [] });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleJoinGroup = useCallback(async (groupId: string) => {
    setJoinLoading((prev) => ({ ...prev, [groupId]: true }));
    try {
      await api.post(`/groups/${groupId}/join`);
      setJoinStatus((prev) => ({ ...prev, [groupId]: 'pending' }));
    } catch {
      setJoinStatus((prev) => ({ ...prev, [groupId]: 'rejected' }));
    } finally {
      setJoinLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  }, []);

  const isGroupMember = (group: SearchGroup) => {
    return group.members?.some((m: any) => String(m._id || m) === String(user?._id));
  };

  const isJoinPending = (group: SearchGroup) => {
    return group.joinRequests?.some(
      (r: any) => String(r.userId?._id || r.userId) === String(user?._id) && r.status === 'pending'
    );
  };

  const filteredClans = myClans.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p._id !== user?._id);
  };

  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="h-full flex flex-col bg-nexus-carbon/40 border-r border-white/10">
      <div className="p-4 border-b border-white/10 space-y-3">
        <h2 className="font-headline font-black text-white text-lg tracking-tighter">
          <span style={{ color: '#ffd700' }}>C</span>HAT
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups/people..."
            className="pl-8 h-8 bg-black/40 border-white/5 text-[10px] font-ui placeholder:text-white/20"
          />
          {searching && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-nexus-jade animate-spin" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {hasSearchQuery ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-4"
            >
              {searchResults.users.length > 0 && (
                <div>
                  <div className="text-[9px] font-ui text-white/30 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <User className="w-3 h-3" /> PEOPLE
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.users.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => onSelectDM(u._id, u.gamerTag)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ui transition-all rounded-sm text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                      >
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="text-[9px] font-headline">{u.gamerTag?.charAt(0) || '?'}</span>
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-nexus-carbon ${presence.get(u._id)?.online ? 'bg-nexus-jade' : 'bg-white/20'}`} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{u.gamerTag}</span>
                            {u.rank && (
                              <Badge className="text-[7px] bg-nexus-jade/10 text-nexus-jade border-nexus-jade/20 px-1 py-0">
                                {u.rank}
                              </Badge>
                            )}
                          </div>
                          {u.gamerBio && (
                            <div className="text-[9px] text-white/30 truncate mt-0.5">{u.gamerBio}</div>
                          )}
                        </div>
                        <MessageCircle className="w-3 h-3 text-nexus-purple/40 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.groups.length > 0 && (
                <div>
                  <div className="text-[9px] font-ui text-white/30 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Swords className="w-3 h-3" /> CLANS
                  </div>
                  <div className="space-y-0.5">
                    {searchResults.groups.map((g) => {
                      const isMember = isGroupMember(g);
                      const hasPending = isJoinPending(g) || joinStatus[g._id] === 'pending';
                      const isLoading = joinLoading[g._id];
                      return (
                        <div
                          key={g._id}
                          className="flex items-center gap-3 px-3 py-2.5 text-xs font-ui rounded-sm text-white/50 border-l-2 border-transparent"
                        >
                          <Swords className="w-3.5 h-3.5 shrink-0 text-white/30" />
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{g.name}</div>
                            <div className="text-[9px] text-white/30 truncate">
                              {g.owner?.gamerTag || 'UNKNOWN'} &middot; {g.members?.length || 0} members
                            </div>
                          </div>
                          {isMember ? (
                            <Button
                              onClick={() => onSelectClan(g._id, g.name)}
                              size="sm"
                              className="h-6 bg-[#ffd700] text-nexus-void text-[9px] font-headline rounded-none px-3"
                            >
                              CHAT
                            </Button>
                          ) : hasPending ? (
                            <Badge className="text-[8px] bg-nexus-jade/10 text-nexus-jade border-nexus-jade/20">
                              PENDING
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handleJoinGroup(g._id)}
                              disabled={isLoading}
                              size="sm"
                              className="h-6 bg-nexus-purple/20 text-nexus-purple hover:bg-nexus-purple/40 text-[9px] font-headline rounded-none px-3"
                            >
                              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'REQUEST ENTRY'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {searchResults.users.length === 0 && searchResults.groups.length === 0 && !searching && (
                <div className="text-[10px] font-ui text-white/20 text-center py-8">
                  {searchQuery.trim() ? 'No results found' : 'Start typing to search'}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-3">
                <button
                  onClick={() => setClansExpanded(!clansExpanded)}
                  className="flex items-center gap-2 w-full text-left py-2 text-[10px] font-ui text-white/40 uppercase tracking-[0.2em] hover:text-white/60 transition-colors"
                >
                  {clansExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Swords className="w-3 h-3" />
                  CLANS
                </button>

                {clansExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {filteredClans.map((clan) => (
                      <button
                        key={clan._id}
                        onClick={() => onSelectClan(clan._id, clan.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ui transition-all rounded-sm ${
                          activeClanId === clan._id
                            ? 'bg-[#ffd700]/10 text-[#ffd700] border-l-2 border-[#ffd700]'
                            : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                      >
                        <Swords className={`w-3.5 h-3.5 shrink-0 ${activeClanId === clan._id ? 'text-[#ffd700]' : ''}`} />
                        <span className="truncate flex-1 text-left">{clan.name}</span>
                        <Badge className="text-[8px] bg-white/5 text-white/30 border-white/5">{clan.members}</Badge>
                      </button>
                    ))}
                    {filteredClans.length === 0 && (
                      <div className="text-[10px] font-ui text-white/20 text-center py-4">No clans joined</div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-3 pt-0">
                <button
                  onClick={() => setDmsExpanded(!dmsExpanded)}
                  className="flex items-center gap-2 w-full text-left py-2 text-[10px] font-ui text-white/40 uppercase tracking-[0.2em] hover:text-white/60 transition-colors"
                >
                  {dmsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <MessageCircle className="w-3 h-3" />
                  DIRECT MESSAGES
                </button>

                {dmsExpanded && (
                  <div className="mt-1 space-y-0.5">
                    {conversations.length === 0 && (
                      <div className="text-[10px] font-ui text-white/20 text-center py-4">No conversations</div>
                    )}
                    {conversations.map((conv) => {
                      const other = getOtherParticipant(conv);
                      if (!other) return null;
                      const isOnline = presence.get(other._id)?.online;
                      return (
                        <button
                          key={conv._id}
                          onClick={() => onSelectDM(other._id, other.gamerTag)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-ui transition-all rounded-sm ${
                            activeDMUserId === other._id
                              ? 'bg-[#ffd700]/10 text-[#ffd700] border-l-2 border-[#ffd700]'
                              : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                              <span className="text-[9px] font-headline">{other.gamerTag?.charAt(0) || '?'}</span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-nexus-carbon ${isOnline ? 'bg-nexus-jade' : 'bg-white/20'}`} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{other.gamerTag}</span>
                              {conv.lastMessage && (
                                <span className="text-[8px] text-white/20 shrink-0 ml-2">
                                  {new Date(conv.lastMessage.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <div className="text-[9px] text-white/30 truncate mt-0.5">
                                {conv.lastMessage.content}
                              </div>
                            )}
                          </div>
                          <Lock className="w-2.5 h-2.5 text-nexus-purple/30 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
