'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Paperclip, X, Loader2, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface Attachment {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

interface MessageInputProps {
  onSend: (content: string, attachments?: Attachment[]) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  typingUsers?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  typingUsers,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    onTypingStart?.();
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
    }, 2000);
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if ((!trimmed && attachments.length === 0) || disabled || uploading) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);
    onTypingStop?.();
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFilePick = () => fileRef.current?.click();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<{ success: boolean; file: Attachment }>('/upload/chat', fd as any);
      setAttachments((prev) => [...prev, res.file]);
    } catch {
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const canSend = content.trim().length > 0 || attachments.length > 0;

  return (
    <div className="border-t border-white/10 p-4">
      {typingUsers && typingUsers.length > 0 && (
        <div className="text-[10px] font-ui text-white/40 mb-2 animate-pulse">
          {typingUsers.join(', ')} typing...
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-sm text-[10px] font-ui">
              {att.mimeType.startsWith('image/') ? (
                <Image className="w-3 h-3 shrink-0" style={{ color: '#ffd700' }} />
              ) : (
                <File className="w-3 h-3 shrink-0 text-nexus-jade" />
              )}
              <span className="text-white/70 truncate max-w-[120px]">{att.name}</span>
              <span className="text-white/30 shrink-0">{formatSize(att.size)}</span>
              <button onClick={() => removeAttachment(i)} className="text-white/30 hover:text-destructive ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-black/40 border border-white/10 px-4 py-2.5 text-sm font-ui text-white placeholder:text-white/30 resize-none outline-none focus:border-[#ffd700]/50 transition-colors min-h-[42px] max-h-[120px]"
        />
        <input ref={fileRef} type="file" onChange={handleFileChange} className="hidden" />
        <Button
          onClick={handleFilePick}
          disabled={disabled || uploading}
          variant="ghost"
          className="h-[42px] w-[42px] p-0 flex-shrink-0 text-white/40 hover:text-[#ffd700]"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <Button
          onClick={handleSend}
          disabled={!canSend || disabled || uploading}
          className="h-[42px] w-[42px] p-0 flex-shrink-0"
          style={{ backgroundColor: '#ffd700', color: '#050505' }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
