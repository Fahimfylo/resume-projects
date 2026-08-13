'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Flag, Check, CheckCheck, File, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface Attachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

interface MessageBubbleProps {
  message: any;
  onReport?: (messageId: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function MessageBubble({ message, onReport }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwn = user?._id === message.sender?._id;
  const [showActions, setShowActions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const attachments: Attachment[] | undefined = message.attachments;

  const hasRead = message.readBy?.length > 1;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasContent = message.content?.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div
        className={`max-w-[75%] relative`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <span className="text-[10px] font-ui" style={{ color: '#ffd700' }}>
              {message.sender?.gamerTag || 'Unknown'}
            </span>
          </div>
        )}

        {attachments && attachments.length > 0 && (
          <div className={`space-y-1.5 mb-1.5 ${isOwn ? 'items-end' : 'items-start'}`}>
            {attachments.map((att, i) => (
              att.mimeType.startsWith('image/') ? (
                <button
                  key={i}
                  onClick={() => setPreviewUrl(att.url)}
                  className={`block overflow-hidden border border-white/10 hover:border-[#ffd700]/50 transition-colors ${isOwn ? 'rounded-tl-xl rounded-bl-xl' : 'rounded-tr-xl rounded-br-xl'}`}
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="max-w-[280px] max-h-[320px] w-full h-auto object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                <a
                  key={i}
                  href={att.url}
                  download={att.name}
                  className={`flex items-center gap-3 px-3 py-2 bg-black/30 border border-white/10 hover:border-nexus-jade/50 transition-colors text-[11px] font-ui ${isOwn ? 'rounded-tl-lg rounded-bl-lg' : 'rounded-tr-lg rounded-br-lg'}`}
                >
                  <File className="w-4 h-4 shrink-0 text-nexus-jade" />
                  <div className="min-w-0">
                    <div className="text-white/80 truncate max-w-[160px]">{att.name}</div>
                    <div className="text-[9px] text-white/30">{formatSize(att.size)}</div>
                  </div>
                  <Download className="w-3.5 h-3.5 shrink-0 text-white/30 ml-auto" />
                </a>
              )
            ))}
          </div>
        )}

        {hasContent && (
          <div
            className={`px-4 py-2.5 text-sm font-ui leading-relaxed ${
              isOwn
                ? 'rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                : 'rounded-tr-xl rounded-tl-xl rounded-br-xl'
            }`}
            style={{
              backgroundColor: isOwn ? '#ffd700' : 'rgba(255,255,255,0.06)',
              color: isOwn ? '#050505' : '#ffffffcc',
            }}
          >
            {message.messageType === 'system' ? (
              <span className="italic text-white/40 text-xs">{message.content}</span>
            ) : (
              <span className="whitespace-pre-wrap break-words">{message.content}</span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-1.5 mt-0.5 ${isOwn ? 'justify-end mr-1' : 'justify-start ml-1'}`}>
          <span className="text-[9px] text-white/30 font-ui">{time}</span>
          {isOwn && (
            hasRead
              ? <CheckCheck className="w-3 h-3 text-nexus-jade" />
              : <Check className="w-3 h-3 text-white/30" />
          )}
        </div>

        {showActions && !isOwn && (
          <div className={`absolute ${isOwn ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'} top-0`}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-6 h-6 text-white/40 hover:text-white/80">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-nexus-carbon border-white/10 text-white text-xs min-w-[120px]">
                <DropdownMenuItem
                  className="focus:bg-destructive/20 focus:text-destructive"
                  onClick={() => onReport?.(message._id)}
                >
                  <Flag className="w-3.5 h-3.5 mr-2" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-xl font-headline"
            onClick={() => setPreviewUrl(null)}
          >
            ✕
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
