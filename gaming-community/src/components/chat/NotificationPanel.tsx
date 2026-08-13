'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, Swords, X, Shield, Trophy } from 'lucide-react';
import { useSocketContext } from '@/lib/SocketProvider';
import { Button } from '@/components/ui/button';

const NOTIFICATION_ICONS: Record<string, any> = {
  dm: MessageCircle,
  clan_message: Swords,
  clan_approval: Shield,
  tournament: Trophy,
  moderation: Shield,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  dm: '#ffd700',
  clan_message: '#76ff03',
  clan_approval: '#00e5cc',
  tournament: '#ffb300',
  moderation: '#9933ff',
};

export function NotificationDropdown() {
  const { notifications, unreadCount, clearNotifications, markNotificationRead } = useSocketContext();

  return (
    <div className="relative">
      <div className="text-[10px] font-ui text-white/40 uppercase tracking-widest mb-3 flex items-center justify-between">
        <span>Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-[#ffd700] font-headline">{unreadCount} new</span>
          )}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[9px] text-white/30 hover:text-white font-ui"
              onClick={clearNotifications}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-hide">
        {notifications.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 mx-auto mb-2 text-white/10" />
            <p className="text-[10px] font-ui text-white/20">No notifications</p>
          </div>
        )}

        <AnimatePresence>
          {notifications.map((notif, i) => {
            const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
            const color = NOTIFICATION_COLORS[notif.type] || '#ffffff';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-3 p-3 rounded-sm hover:bg-white/5 transition-colors group"
              >
                <div className="mt-0.5 shrink-0">
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-headline text-white truncate">{notif.title}</div>
                  <div className="text-[10px] font-ui text-white/40 truncate mt-0.5">{notif.message}</div>
                  <div className="text-[8px] font-ui text-white/20 mt-1">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => markNotificationRead(i)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
