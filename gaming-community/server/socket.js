import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import Group from './models/Group.js';
import mongoose from 'mongoose';

const onlineUsers = new Map();
const typingUsers = new Map();

export function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  const authMiddleware = async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
      if (!user) return next(new Error('User not found'));
      if (user.isBanned) return next(new Error('User is banned'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  };

  io.use(authMiddleware);

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = String(user._id);

    onlineUsers.set(userId, { socketId: socket.id, gamerTag: user.gamerTag, lastActive: new Date() });

    socket.join(`user:${userId}`);

    const currentOnline = Array.from(onlineUsers.entries())
      .filter(([id]) => id !== userId)
      .map(([id, data]) => ({ userId: id, gamerTag: data.gamerTag, online: true }));
    socket.emit('presence_state', currentOnline);

    socket.broadcast.emit('user_online', { userId, gamerTag: user.gamerTag });

    socket.on('request_presence', () => {
      const allOnline = Array.from(onlineUsers.entries())
        .filter(([id]) => id !== userId)
        .map(([id, data]) => ({ userId: id, gamerTag: data.gamerTag, online: true }));
      socket.emit('presence_state', allOnline);
    });

    socket.on('join_clan_chat', async ({ clanId }, callback) => {
      try {
        if (!clanId) return callback?.({ error: 'Clan ID required' });

        const group = await Group.findById(clanId);
        if (!group) return callback?.({ error: 'Clan not found' });

        const isMember = group.members.some((m) => String(m) === userId);
        if (!isMember) return callback?.({ error: 'You are not a member of this clan' });

        const roomId = `clan_${clanId}`;
        socket.join(roomId);
        socket.data.clanRooms = socket.data.clanRooms || [];
        if (!socket.data.clanRooms.includes(roomId)) {
          socket.data.clanRooms.push(roomId);
        }

        const clanMembers = group.members
          .map((m) => {
            const uid = String(m);
            const online = onlineUsers.get(uid);
            return online ? { userId: uid, gamerTag: online.gamerTag, online: true, socketId: online.socketId } : null;
          })
          .filter(Boolean);

        socket.to(roomId).emit('clan_user_joined', { userId, gamerTag: user.gamerTag });
        callback?.({ success: true, roomId, onlineMembers: clanMembers });
      } catch (err) {
        callback?.({ error: 'Failed to join clan chat' });
      }
    });

    socket.on('leave_clan_chat', ({ clanId }, callback) => {
      const roomId = `clan_${clanId}`;
      socket.leave(roomId);
      socket.to(roomId).emit('clan_user_left', { userId, gamerTag: user.gamerTag });
      callback?.({ success: true });
    });

    socket.on('join_dm', async ({ targetUserId }, callback) => {
      try {
        if (!targetUserId) return callback?.({ error: 'Target user required' });
        if (targetUserId === userId) return callback?.({ error: 'Cannot DM yourself' });

        const targetUser = await User.findById(targetUserId).select('gamerTag');
        if (!targetUser) return callback?.({ error: 'User not found' });

        const participants = [userId, targetUserId].sort();
        const roomId = participants.join('_');

        socket.join(`dm:${roomId}`);

        const conversation = await Conversation.findOneAndUpdate(
          { roomId },
          { $set: { roomId, participants: participants.map((id) => new mongoose.Types.ObjectId(id)) }, $setOnInsert: { isActive: true } },
          { upsert: true, new: true }
        );

        callback?.({ success: true, roomId, conversationId: conversation._id, targetUser: { _id: targetUser._id, gamerTag: targetUser.gamerTag } });
      } catch (err) {
        callback?.({ error: 'Failed to start DM' });
      }
    });

    socket.on('send_message', async (data, callback) => {
      try {
        const { roomType, roomId, content, messageType, replyTo, attachments } = data;
        const hasAttachments = attachments && attachments.length > 0;

        if (!content?.trim() && !hasAttachments) return callback?.({ error: 'Message content or attachment required' });
        if (content && content.length > 5000) return callback?.({ error: 'Message too long' });

        if (roomType === 'clan') {
          const clanId = roomId.replace('clan_', '');
          const group = await Group.findById(clanId);
          if (!group) return callback?.({ error: 'Clan not found' });
          const isMember = group.members.some((m) => String(m) === userId);
          if (!isMember) return callback?.({ error: 'Not a clan member' });
        }

        if (roomType === 'dm') {
          const participants = roomId.split('_');
          if (!participants.includes(userId)) return callback?.({ error: 'Not a participant' });
        }

        const message = await Message.create({
          sender: user._id,
          content: content?.trim() || '',
          messageType: messageType || 'text',
          roomType,
          roomId,
          replyTo: replyTo || null,
          attachments: hasAttachments ? attachments : undefined,
          readBy: [{ user: user._id }],
        });

        await message.populate('sender', 'gamerTag avatarUrl rank');

        const emitRoom = roomType === 'dm' ? `dm:${roomId}` : roomId;
        io.to(emitRoom).emit('receive_message', message);

        const preview = hasAttachments ? `[${attachments[0].mimeType.startsWith('image/') ? 'Image' : 'File'}] ${content?.trim()?.substring(0, 80) || ''}` : content.trim().substring(0, 100);

        if (roomType === 'dm') {
          const participants = roomId.split('_');
          const otherUserId = participants.find((p) => p !== userId);
          await Conversation.findOneAndUpdate(
            { roomId },
            { lastMessage: { content: preview, sender: user._id, sentAt: new Date() } }
          );
          if (otherUserId) {
            io.to(`user:${otherUserId}`).emit('new_notification', {
              type: 'dm',
              title: `New message from ${user.gamerTag}`,
              message: preview,
              senderId: userId,
              roomId,
              createdAt: new Date(),
            });
          }
        }

        if (roomType === 'clan') {
          const clanId = roomId.replace('clan_', '');
          io.to(roomId).emit('new_notification', {
            type: 'clan_message',
            title: `New message in clan`,
            message: `${user.gamerTag}: ${preview}`,
            senderId: userId,
            clanId,
            roomId,
            createdAt: new Date(),
          });
        }

        callback?.({ success: true, message });
      } catch (err) {
        callback?.({ error: 'Failed to send message' });
      }
    });

    socket.on('typing_start', ({ roomType, roomId }) => {
      const emitRoom = roomType === 'dm' ? `dm:${roomId}` : roomId;
      socket.to(emitRoom).emit('typing_start', { userId, gamerTag: user.gamerTag, roomType, roomId });

      const key = `${roomType}:${roomId}`;
      if (!typingUsers.has(key)) typingUsers.set(key, new Map());
      typingUsers.get(key).set(userId, setTimeout(() => {
        socket.to(emitRoom).emit('typing_stop', { userId, roomType, roomId });
        typingUsers.get(key)?.delete(userId);
      }, 3000));
    });

    socket.on('typing_stop', ({ roomType, roomId }) => {
      const emitRoom = roomType === 'dm' ? `dm:${roomId}` : roomId;
      socket.to(emitRoom).emit('typing_stop', { userId, roomType, roomId });
      const key = `${roomType}:${roomId}`;
      clearTimeout(typingUsers.get(key)?.get(userId));
      typingUsers.get(key)?.delete(userId);
    });

    socket.on('mark_read', async ({ roomType, roomId, messageIds }) => {
      try {
        const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
        await Message.updateMany(
          { _id: { $in: ids }, 'readBy.user': { $ne: user._id } },
          { $push: { readBy: { user: user._id, readAt: new Date() } } }
        );
        const emitRoom = roomType === 'dm' ? `dm:${roomId}` : roomId;
        io.to(emitRoom).emit('messages_read', { userId, roomType, roomId, messageIds: ids });
      } catch {}
    });

    socket.on('report_message', async ({ messageId, reason }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return callback?.({ error: 'Message not found' });

        const Report = (await import('./models/Report.js')).default;
        const report = await Report.create({
          reporter: user._id,
          targetType: 'message',
          targetId: message._id,
          reason: reason || 'other',
          description: `Reported message in ${message.roomType} (${message.roomId}): ${message.content.substring(0, 200)}`,
          status: 'pending',
        });

        callback?.({ success: true, reportId: report._id });
      } catch (err) {
        callback?.({ error: 'Failed to report message' });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId, gamerTag: user.gamerTag });

      if (socket.data.clanRooms) {
        for (const roomId of socket.data.clanRooms) {
          socket.to(roomId).emit('clan_user_left', { userId });
        }
      }

      for (const [key, timers] of typingUsers) {
        if (timers.has(userId)) {
          clearTimeout(timers.get(userId));
          timers.delete(userId);
          const [roomType, roomId] = key.split(':');
          const emitRoom = roomType === 'dm' ? `dm:${roomId}` : roomId;
          io.to(emitRoom).emit('typing_stop', { userId, roomType, roomId });
        }
      }
    });
  });

  return io;
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
    userId,
    gamerTag: data.gamerTag,
    online: true,
    lastActive: data.lastActive,
  }));
}
