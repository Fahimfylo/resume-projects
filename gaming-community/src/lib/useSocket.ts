'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useSocketContext } from './SocketProvider';
import { api } from './api';

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

interface Message {
  _id: string;
  sender: { _id: string; gamerTag: string; avatarUrl?: string; rank?: string };
  content: string;
  messageType: string;
  roomType: string;
  roomId: string;
  readBy: { user: string; readAt: Date }[];
  replyTo?: string;
  createdAt: string;
}

interface OnlineMember {
  userId: string;
  gamerTag: string;
  online: boolean;
  socketId?: string;
}

function filterMessages(messages: Message[], showHistory: boolean, historyCutoff: number) {
  if (showHistory) return messages;
  const cutoff = Date.now() - historyCutoff;
  return messages.filter((m) => new Date(m.createdAt).getTime() >= cutoff);
}

function getHistoryMessages(messages: Message[], historyCutoff: number) {
  const now = Date.now();
  return messages.filter((m) => new Date(m.createdAt).getTime() < now - historyCutoff);
}

export function useClanChat(clanId: string | null) {
  const { socket, connected } = useSocketContext();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!clanId) return;

    api.get<{ success: boolean; messages: Message[] }>(`/chat/clan/${clanId}?limit=100`)
      .then((res) => setAllMessages(res.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clanId]);

  useEffect(() => {
    if (!socket || !connected || !clanId) return;

    socket.emit('join_clan_chat', { clanId }, (res: any) => {
      if (res?.success) {
        setJoined(true);
        if (res.onlineMembers) setOnlineMembers(res.onlineMembers);
      }
    });

    const handleMessage = (msg: Message) => {
      setAllMessages((prev) => [...prev, msg]);
    };

    const handleTypingStart = (data: { userId: string; gamerTag: string }) => {
      setTypingUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
    };

    const handleTypingStop = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    const handleMemberJoin = (data: { userId: string; gamerTag: string }) => {
      setOnlineMembers((prev) => [...prev, { userId: data.userId, gamerTag: data.gamerTag, online: true }]);
    };

    const handleMemberLeave = (data: { userId: string }) => {
      setOnlineMembers((prev) => prev.filter((m) => m.userId !== data.userId));
    };

    socket.on('receive_message', handleMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('clan_user_joined', handleMemberJoin);
    socket.on('clan_user_left', handleMemberLeave);

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineMembers((prev) => prev.filter((m) => m.userId !== data.userId));
    };
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.emit('leave_clan_chat', { clanId });
      socket.off('receive_message', handleMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('clan_user_joined', handleMemberJoin);
      socket.off('clan_user_left', handleMemberLeave);
      socket.off('user_offline', handleUserOffline);
      setTypingUsers([]);
    };
  }, [socket, connected, clanId]);

  const messages = useMemo(
    () => filterMessages(allMessages, showHistory, ONE_HOUR_MS),
    [allMessages, showHistory]
  );

  const historyMessages = useMemo(
    () => getHistoryMessages(allMessages, ONE_HOUR_MS),
    [allMessages]
  );

  const hasHistory = historyMessages.length > 0;
  const historyCount = historyMessages.length;

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const sendMessage = useCallback((content: string, attachments?: { url: string; name: string; mimeType: string; size: number }[]) => {
    if (!socket || !clanId) return;
    const hasAttachments = attachments && attachments.length > 0;
    const messageType = hasAttachments
      ? (attachments![0].mimeType.startsWith('image/') ? 'image' : 'file')
      : 'text';
    const roomId = `clan_${clanId}`;
    socket.emit('send_message', { roomType: 'clan', roomId, content, messageType, attachments }, (res: any) => {
      if (res?.message) {
        setAllMessages((prev) => {
          const exists = prev.some((m) => m._id === res.message._id);
          return exists ? prev : [...prev, res.message];
        });
      }
    });
  }, [socket, clanId]);

  const startTyping = useCallback(() => {
    if (!socket || !clanId) return;
    socket.emit('typing_start', { roomType: 'clan', roomId: `clan_${clanId}` });
  }, [socket, clanId]);

  const stopTyping = useCallback(() => {
    if (!socket || !clanId) return;
    socket.emit('typing_stop', { roomType: 'clan', roomId: `clan_${clanId}` });
  }, [socket, clanId]);

  const reportMessage = useCallback((messageId: string, reason: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socket) return reject(new Error('Not connected'));
      socket.emit('report_message', { messageId, reason }, (res: any) => {
        if (res?.success) resolve();
        else reject(new Error(res?.error || 'Failed to report'));
      });
    });
  }, [socket]);

  return {
    messages, onlineMembers, typingUsers, joined, loading,
    sendMessage, startTyping, stopTyping, reportMessage,
    hasHistory, historyCount, showHistory, toggleHistory,
  };
}

export function useDM(targetUserId: string | null) {
  const { socket, connected } = useSocketContext();
  const currentUser = useAuth().user;
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!targetUserId || !currentUser?._id) return;
    setLoading(true);
    const participants = [currentUser._id, targetUserId].sort();
    const rId = participants.join('_');
    setRoomId(rId);

    api.get<{ success: boolean; messages: Message[] }>(`/chat/dm/${rId}?limit=100`)
      .then((res) => setAllMessages(res.messages))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetUserId]);

  useEffect(() => {
    if (!socket || !connected || !targetUserId) return;

    socket.emit('join_dm', { targetUserId }, (res: any) => {
      if (res?.success) {
        setConversationId(res.conversationId);
        setRoomId(res.roomId);
      }
    });

    const handleMessage = (msg: Message) => {
      setAllMessages((prev) => [...prev, msg]);
    };

    const handleTypingStart = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
    };

    const handleTypingStop = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    socket.on('receive_message', handleMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      setTypingUsers([]);
    };
  }, [socket, connected, targetUserId]);

  const messages = useMemo(
    () => filterMessages(allMessages, showHistory, ONE_HOUR_MS),
    [allMessages, showHistory]
  );

  const historyMessages = useMemo(
    () => getHistoryMessages(allMessages, ONE_HOUR_MS),
    [allMessages]
  );

  const hasHistory = historyMessages.length > 0;
  const historyCount = historyMessages.length;

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => !prev);
  }, []);

  const sendMessage = useCallback((content: string, attachments?: { url: string; name: string; mimeType: string; size: number }[]) => {
    if (!socket || !roomId) return;
    const hasAttachments = attachments && attachments.length > 0;
    const messageType = hasAttachments
      ? (attachments![0].mimeType.startsWith('image/') ? 'image' : 'file')
      : 'text';
    socket.emit('send_message', { roomType: 'dm', roomId, content, messageType, attachments }, (res: any) => {
      if (res?.message) {
        setAllMessages((prev) => {
          const exists = prev.some((m) => m._id === res.message._id);
          return exists ? prev : [...prev, res.message];
        });
      }
    });
  }, [socket, roomId]);

  const startTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('typing_start', { roomType: 'dm', roomId });
  }, [socket, roomId]);

  const stopTyping = useCallback(() => {
    if (!socket || !roomId) return;
    socket.emit('typing_stop', { roomType: 'dm', roomId });
  }, [socket, roomId]);

  return {
    messages, conversationId, roomId, typingUsers, loading,
    sendMessage, startTyping, stopTyping,
    hasHistory, historyCount, showHistory, toggleHistory,
  };
}

export function useOnlineStatus(userId: string) {
  const { onlineUsers } = useSocketContext();
  const user = onlineUsers.get(userId);
  return user?.online || false;
}

export function usePresence() {
  const { onlineUsers } = useSocketContext();
  return onlineUsers;
}
