'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from './socket';
import { useAuth } from './auth-context';

interface OnlineUser {
  userId: string;
  gamerTag: string;
  online: boolean;
  lastActive?: Date;
}

interface Notification {
  type: string;
  title: string;
  message: string;
  senderId?: string;
  clanId?: string;
  roomId?: string;
  createdAt: Date;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Map<string, OnlineUser>;
  notifications: Notification[];
  unreadCount: number;
  clearNotifications: () => void;
  markNotificationRead: (index: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    let sock: Socket;
    try {
      sock = connectSocket();
      setSocket(sock);
    } catch {
      return;
    }

    const requestPresence = () => sock.emit('request_presence');

    sock.on('connect', () => {
      setConnected(true);
      requestPresence();
    });
    sock.on('disconnect', () => setConnected(false));

    if (sock.connected) {
      setConnected(true);
      requestPresence();
    }

    sock.on('presence_state', (users: OnlineUser[]) => {
      setOnlineUsers(new Map(users.map((u) => [u.userId, { ...u, online: true }])));
    });

    sock.on('user_online', (data: OnlineUser) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, { ...data, online: true });
        return next;
      });
    });

    sock.on('user_offline', (data: OnlineUser) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, { ...data, online: false, lastActive: new Date() });
        return next;
      });
    });

    sock.on('new_notification', (data: Notification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
    });

    return () => {
      sock.off('connect');
      sock.off('disconnect');
      sock.off('presence_state');
      sock.off('user_online');
      sock.off('user_offline');
      sock.off('new_notification');
    };
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markNotificationRead = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        notifications,
        unreadCount: notifications.length,
        clearNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
