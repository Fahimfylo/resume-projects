'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Shield, Lock, Clock } from 'lucide-react';
import { useDM } from '@/lib/useSocket';
import { useOnlineStatus } from '@/lib/useSocket';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DMChatProps {
  targetUserId: string;
  targetGamerTag: string;
  onClose?: () => void;
}

export function DMChat({ targetUserId, targetGamerTag, onClose }: DMChatProps) {
  const { messages, typingUsers, loading, sendMessage, startTyping, stopTyping, hasHistory, historyCount, showHistory, toggleHistory } = useDM(targetUserId);
  const isOnline = useOnlineStatus(targetUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-[#ffd700]/50 bg-nexus-carbon flex items-center justify-center">
              <span className="font-headline text-sm" style={{ color: '#ffd700' }}>{targetGamerTag?.charAt(0) || '?'}</span>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-nexus-carbon ${isOnline ? 'bg-nexus-jade' : 'bg-white/20'}`} />
          </div>
          <div>
            <h3 className="font-headline text-sm text-white font-bold">{targetGamerTag}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-ui ${isOnline ? 'text-nexus-jade' : 'text-white/30'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <Lock className="w-2.5 h-2.5 text-nexus-purple/60" />
              <span className="text-[7px] font-ui text-nexus-purple/40 uppercase tracking-wider">Private</span>
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="w-7 h-7 text-white/40 hover:text-destructive" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
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
          {loading && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-[#ffd700] font-headline text-xs animate-pulse">LOADING MESSAGES...</div>
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-white/20 min-h-[200px]">
              <Lock className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-xs font-ui uppercase tracking-widest">Private Conversation</p>
              <p className="text-[10px] font-ui mt-1 text-white/10">Only visible to participants</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSend={sendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        typingUsers={typingUsers}
        placeholder={`Message @${targetGamerTag}`}
      />
    </div>
  );
}
