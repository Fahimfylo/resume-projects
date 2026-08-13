'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Users, Shield, LogOut, Clock } from 'lucide-react';
import { useClanChat } from '@/lib/useSocket';
import { useAuth } from '@/lib/auth-context';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClanChatProps {
  clanId: string;
  clanName: string;
  onLeave?: () => void;
  onStartDM?: (userId: string) => void;
}

export function ClanChat({ clanId, clanName, onLeave, onStartDM }: ClanChatProps) {
  const { user } = useAuth();
  const { messages, onlineMembers, typingUsers, joined, loading, sendMessage, startTyping, stopTyping, reportMessage, hasHistory, historyCount, showHistory, toggleHistory } = useClanChat(clanId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReport = async (messageId: string) => {
    const reason = prompt('Reason for reporting this message:');
    if (!reason) return;
    try {
      await reportMessage(messageId, reason);
      alert('Message reported to moderators.');
    } catch {
      alert('Failed to report message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#ffd700] font-headline text-xs animate-pulse">LOADING CLAN CHAT...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
            <Swords className="w-5 h-5" style={{ color: '#ffd700' }} />
          </div>
          <div>
            <h3 className="font-headline text-sm text-white font-bold">{clanName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-nexus-jade" />
                <span className="text-[9px] font-ui text-white/40">{onlineMembers.length} online</span>
              </div>
              <Badge className="text-[8px] bg-white/5 text-white/40 border-white/10">CLAN CHAT</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onlineMembers.length > 0 && (
            <div className="flex -space-x-2">
              {onlineMembers.slice(0, 4).map((m) => (
                <div
                  key={m.userId}
                  className="w-7 h-7 rounded-full border-2 border-nexus-carbon bg-nexus-carbon flex items-center justify-center text-[8px] font-headline text-white cursor-pointer hover:border-[#ffd700] transition-colors"
                  title={m.gamerTag}
                  onClick={() => onStartDM?.(m.userId)}
                >
                  {m.gamerTag?.charAt(0) || '?'}
                </div>
              ))}
              {onlineMembers.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-nexus-carbon bg-black/60 flex items-center justify-center text-[8px] text-white/40">
                  +{onlineMembers.length - 4}
                </div>
              )}
            </div>
          )}
          {onLeave && (
            <Button variant="ghost" size="icon" className="w-7 h-7 text-white/40 hover:text-destructive" onClick={onLeave}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {hasHistory && (
            <motion.button
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onClick={toggleHistory}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-[10px] font-ui border-b border-white/5 hover:bg-white/5 transition-colors"
              style={{ color: showHistory ? '#00e5cc' : '#ffd700' }}
            >
              <Clock className="w-3 h-3" />
              {showHistory
                ? 'Hide 24h history'
                : `Show 24h history (${historyCount} older message${historyCount !== 1 ? 's' : ''})`
              }
            </motion.button>
          )}
        </AnimatePresence>
        <div className="p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white/20 min-h-[200px]">
              <Swords className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-xs font-ui uppercase tracking-widest">No messages yet</p>
              <p className="text-[10px] font-ui mt-1 text-white/10">Be the first to speak in clan chat</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} onReport={handleReport} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSend={sendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        typingUsers={typingUsers}
        placeholder={`Message #${clanName}`}
        disabled={!joined}
      />
    </div>
  );
}
