import http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type {
  RoomState,
  Participant,
  WSClientMessage,
  WSServerMessage,
  PlaybackState,
  MediaItem,
  ChatMessage,
  FloatingReaction,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// In-memory room store
const rooms = new Map<string, RoomState>();
const clientRooms = new Map<WebSocket, { roomId: string; participantId: string }>();
const socketByParticipantId = new Map<string, WebSocket>();

// Default initial media is the daily Top 10 discovery screen
const DEFAULT_MEDIA: MediaItem = {
  id: 'top10-daily',
  title: 'Top 10 Brasil • TV Comigo',
  url: '',
  type: 'video',
  service: 'netflix',
  duration: 0,
  poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
  category: 'Top 10',
  description: 'Top 10 filmes e séries mais assistidos do dia atualizado diariamente.',
};

function normalizeRoomId(rawId?: string): string {
  if (!rawId) return `rave-${Math.floor(Math.random() * 8999 + 1000)}`;
  const clean = rawId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return clean || `rave-${Math.floor(Math.random() * 8999 + 1000)}`;
}

function getOrCreateRoom(roomId: string, title?: string): RoomState {
  const cleanId = normalizeRoomId(roomId);
  let room = rooms.get(cleanId);
  if (!room) {
    room = {
      id: cleanId,
      title: title || `Sala Rave #${cleanId.slice(0, 4)}`,
      hostId: '',
      isPublic: true,
      allowGuestControl: true,
      adaptiveSyncMode: 'estavel-mobile',
      currentMedia: { ...DEFAULT_MEDIA },
      recentMedia: [],
      playback: {
        currentTime: 0,
        isPlaying: false,
        playbackRate: 1,
        lastUpdatedServerTime: Date.now(),
      },
      participants: {},
      chat: [
        {
          id: 'welcome-msg',
          senderId: 'system',
          senderName: 'TV Comigo Bot',
          senderAvatar: '🍿',
          senderColor: '#8b5cf6',
          text: 'Bem-vindo ao TV Comigo! Convide amigos pelo link para assistir juntos com áudio e chat em tempo real sem quedas.',
          timestamp: Date.now(),
          type: 'system',
        },
      ],
      createdAt: Date.now(),
    };
    rooms.set(cleanId, room);
  }
  return room;
}

// Compute accurate real-time playback position
function getProjectedPlayback(room: RoomState): PlaybackState {
  if (!room.playback.isPlaying) {
    return { ...room.playback };
  }
  const now = Date.now();
  const elapsedSec = (now - room.playback.lastUpdatedServerTime) / 1000;
  const projectedTime = Math.max(0, room.playback.currentTime + elapsedSec * room.playback.playbackRate);
  return {
    ...room.playback,
    currentTime: projectedTime,
    lastUpdatedServerTime: now,
  };
}

function broadcastToRoom(rawRoomId: string, message: WSServerMessage, excludeSocket?: WebSocket) {
  const targetRoomId = normalizeRoomId(rawRoomId);
  const json = JSON.stringify(message);
  for (const [ws, info] of clientRooms.entries()) {
    if (normalizeRoomId(info.roomId) === targetRoomId && ws !== excludeSocket && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), activeRooms: rooms.size });
});

app.get('/api/app-info', (req, res) => {
  const host = req.headers.host || '';
  const sharedHost = host.replace('-dev-', '-pre-');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  res.json({
    sharedUrl: `${proto}://${sharedHost}`,
    currentUrl: `${proto}://${host}`,
  });
});

app.get('/api/rooms', (_req, res) => {
  const list = Array.from(rooms.values())
    .filter((r) => r.isPublic)
    .map((r) => ({
      id: r.id,
      title: r.title,
      participantCount: Object.keys(r.participants).length,
      currentMedia: r.currentMedia,
      isPlaying: r.playback.isPlaying,
      createdAt: r.createdAt,
    }));
  res.json(list);
});

// WebSocket Handling
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (rawData: string) => {
    try {
      const data: WSClientMessage = JSON.parse(rawData.toString());
      switch (data.type) {
        case 'join': {
          const { roomId, user } = data;
          const cleanRoomId = normalizeRoomId(roomId);
          const room = getOrCreateRoom(cleanRoomId);

          const participantId = `user_${Math.random().toString(36).substring(2, 9)}`;
          const isFirstUser = Object.keys(room.participants).length === 0;
          if (isFirstUser || !room.hostId) {
            room.hostId = participantId;
          }

          const participant: Participant = {
            id: participantId,
            name: user.name || 'Convidado Rave',
            avatar: user.avatar || '🍿',
            color: user.color || '#a855f7',
            isHost: room.hostId === participantId,
            isMuted: false,
            isDeafened: false,
            isSpeaking: false,
            isBuffering: false,
            device: user.device || 'desktop',
            ping: 28,
            qualityLevel: 'excelente',
            joinedAt: Date.now(),
          };

          room.participants[participantId] = participant;
          clientRooms.set(ws, { roomId: cleanRoomId, participantId });
          socketByParticipantId.set(participantId, ws);

          // Get projected sync position
          room.playback = getProjectedPlayback(room);

          // Reply to joined user with full room state
          const joinReply: WSServerMessage = {
            type: 'room:joined',
            room,
            yourId: participantId,
          };
          ws.send(JSON.stringify(joinReply));

          // Notify other participants
          const joinedNotification: WSServerMessage = {
            type: 'participant:joined',
            participant,
          };
          broadcastToRoom(cleanRoomId, joinedNotification, ws);

          // Chat announcement
          const systemMsg: ChatMessage = {
            id: `sys_${Date.now()}_${Math.random()}`,
            senderId: 'system',
            senderName: 'Sistema',
            senderAvatar: '📢',
            senderColor: '#10b981',
            text: `${participant.name} entrou na sala.`,
            timestamp: Date.now(),
            type: 'system',
          };
          room.chat.push(systemMsg);
          broadcastToRoom(cleanRoomId, { type: 'chat:new', message: systemMsg });
          break;
        }

        case 'playback:sync': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          // Check permissions (host or allowGuestControl)
          if (!room.allowGuestControl && !participant.isHost) {
            return;
          }

          room.playback = {
            currentTime: Math.max(0, data.playback.currentTime),
            isPlaying: data.playback.isPlaying,
            playbackRate: data.playback.playbackRate || 1,
            lastUpdatedServerTime: Date.now(),
          };

          // Broadcast playback update to everyone else
          broadcastToRoom(
            room.id,
            {
              type: 'playback:updated',
              playback: room.playback,
              initiatorId: clientInfo.participantId,
            },
            ws
          );
          break;
        }

        case 'media:change': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          if (!room.allowGuestControl && !participant.isHost) {
            return;
          }

          room.currentMedia = data.media;
          room.recentMedia = [
            data.media,
            ...(room.recentMedia || []).filter((m) => m.url !== data.media.url && m.id !== data.media.id),
          ].slice(0, 10);

          room.playback = {
            currentTime: 0,
            isPlaying: true,
            playbackRate: 1,
            lastUpdatedServerTime: Date.now(),
          };

          const sysMsg: ChatMessage = {
            id: `sys_media_${Date.now()}`,
            senderId: 'system',
            senderName: 'Mídia',
            senderAvatar: '🎬',
            senderColor: '#ec4899',
            text: `${participant.name} colocou "${data.media.title}"`,
            timestamp: Date.now(),
            type: 'system',
          };
          room.chat.push(sysMsg);

          broadcastToRoom(room.id, {
            type: 'media:updated',
            media: data.media,
            initiatorName: participant.name,
            recentMedia: room.recentMedia,
          });
          broadcastToRoom(room.id, {
            type: 'playback:updated',
            playback: room.playback,
          });
          broadcastToRoom(room.id, { type: 'chat:new', message: sysMsg });
          break;
        }

        case 'watchparty:sync-start': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          if (!room.allowGuestControl && !participant.isHost) {
            return;
          }

          const syncStart = Number(data.syncStartTime) || (Date.now() + 5000);
          const delayMs = Math.max(1000, Math.min(30000, syncStart - Date.now()));
          const actualSyncStartTime = Date.now() + delayMs;

          room.currentMedia = data.media;
          room.recentMedia = [
            data.media,
            ...(room.recentMedia || []).filter((m) => m.url !== data.media.url && m.id !== data.media.id),
          ].slice(0, 10);

          room.playback = {
            currentTime: 0,
            isPlaying: false,
            playbackRate: 1,
            lastUpdatedServerTime: Date.now(),
          };

          room.dailyWatchParty = {
            mediaId: data.media.id,
            mediaTitle: data.media.title,
            syncStartTime: actualSyncStartTime,
            initiatorName: participant.name,
          };

          const sysMsg: ChatMessage = {
            id: `sys_watchparty_${Date.now()}`,
            senderId: 'system',
            senderName: 'Watch Party',
            senderAvatar: '🍿',
            senderColor: '#f59e0b',
            text: `🍿 ${participant.name} iniciou a Daily Watch Party para "${data.media.title}"! Sincronização em grupo iniciando em 5 segundos...`,
            timestamp: Date.now(),
            type: 'system',
          };
          room.chat.push(sysMsg);

          broadcastToRoom(room.id, {
            type: 'media:updated',
            media: data.media,
            initiatorName: participant.name,
            recentMedia: room.recentMedia,
          });
          broadcastToRoom(room.id, {
            type: 'playback:updated',
            playback: room.playback,
          });
          broadcastToRoom(room.id, {
            type: 'watchparty:sync-started',
            media: data.media,
            syncStartTime: actualSyncStartTime,
            initiatorName: participant.name,
          });
          broadcastToRoom(room.id, { type: 'chat:new', message: sysMsg });

          // Schedule group start simultaneously across all clients
          setTimeout(() => {
            const currentRoom = rooms.get(room.id);
            if (
              currentRoom &&
              currentRoom.currentMedia.id === data.media.id &&
              currentRoom.dailyWatchParty?.syncStartTime === actualSyncStartTime
            ) {
              currentRoom.playback = {
                currentTime: 0,
                isPlaying: true,
                playbackRate: 1,
                lastUpdatedServerTime: Date.now(),
              };
              currentRoom.dailyWatchParty = null;

              const startMsg: ChatMessage = {
                id: `sys_wp_play_${Date.now()}`,
                senderId: 'system',
                senderName: 'Watch Party',
                senderAvatar: '🎬',
                senderColor: '#10b981',
                text: `🎬 Daily Watch Party iniciada! Vídeo sincronizado em tempo real para todos na sala.`,
                timestamp: Date.now(),
                type: 'system',
              };
              currentRoom.chat.push(startMsg);

              broadcastToRoom(currentRoom.id, {
                type: 'playback:updated',
                playback: currentRoom.playback,
              });
              broadcastToRoom(currentRoom.id, { type: 'chat:new', message: startMsg });
            }
          }, delayMs);

          break;
        }

        case 'chat:send': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const sender = room.participants[clientInfo.participantId];
          if (!sender) return;

          const cleanText = data.text.trim();
          if (!cleanText) return;

          const msg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            senderId: sender.id,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            senderColor: sender.color,
            text: cleanText,
            timestamp: Date.now(),
            type: 'text',
          };
          room.chat.push(msg);

          // Keep chat buffer bounded
          if (room.chat.length > 250) {
            room.chat.shift();
          }

          broadcastToRoom(room.id, { type: 'chat:new', message: msg });
          break;
        }

        case 'user:typing': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          broadcastToRoom(room.id, {
            type: 'user:typing',
            participantId: participant.id,
            name: participant.name,
            isTyping: data.isTyping,
          }, ws);
          break;
        }

        case 'reaction:send': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const sender = room.participants[clientInfo.participantId];

          const reaction: FloatingReaction = {
            id: `rx_${Date.now()}_${Math.random()}`,
            emoji: data.emoji,
            senderName: sender ? sender.name : 'Amigo',
            senderColor: sender ? sender.color : '#a855f7',
            x: Math.floor(Math.random() * 70) + 15, // between 15% and 85% width
          };

          broadcastToRoom(room.id, { type: 'reaction:new', reaction });
          break;
        }

        case 'voice:status': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          participant.isMuted = data.isMuted;
          participant.isDeafened = data.isDeafened;
          participant.isSpeaking = data.isSpeaking;

          broadcastToRoom(room.id, {
            type: 'participant:updated',
            participant,
          });
          break;
        }

        case 'user:buffering': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant) return;

          participant.isBuffering = data.isBuffering;

          broadcastToRoom(room.id, {
            type: 'participant:updated',
            participant,
          });
          break;
        }

        case 'user:ping': {
          const clientInfo = clientRooms.get(ws);
          ws.send(
            JSON.stringify({
              type: 'pong',
              clientTimestamp: data.clientTimestamp,
              serverTimestamp: Date.now(),
            })
          );
          if (clientInfo) {
            const room = rooms.get(clientInfo.roomId);
            if (room) {
              const p = room.participants[clientInfo.participantId];
              if (p) {
                const rtt = Math.max(5, Date.now() - data.clientTimestamp);
                p.ping = rtt;
                p.qualityLevel = rtt < 70 ? 'excelente' : rtt < 170 ? 'boa' : 'instavel';
              }
            }
          }
          break;
        }

        case 'room:config': {
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;
          const room = rooms.get(clientInfo.roomId);
          if (!room) return;
          const participant = room.participants[clientInfo.participantId];
          if (!participant || !participant.isHost) return;

          if (typeof data.allowGuestControl === 'boolean') {
            room.allowGuestControl = data.allowGuestControl;
          }
          if (data.title) {
            room.title = data.title;
          }
          if (data.adaptiveSyncMode) {
            room.adaptiveSyncMode = data.adaptiveSyncMode;
          }

          broadcastToRoom(room.id, { type: 'room:updated', room });
          break;
        }

        case 'signal': {
          // WebRTC mesh signaling
          const clientInfo = clientRooms.get(ws);
          if (!clientInfo) return;

          const targetWs = socketByParticipantId.get(data.targetId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            const signalMsg: WSServerMessage = {
              type: 'signal',
              senderId: clientInfo.participantId,
              data: data.data,
            };
            targetWs.send(JSON.stringify(signalMsg));
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    const clientInfo = clientRooms.get(ws);
    if (!clientInfo) return;
    const { roomId, participantId } = clientInfo;

    clientRooms.delete(ws);
    socketByParticipantId.delete(participantId);

    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants[participantId];
    const participantName = participant ? participant.name : 'Alguém';

    delete room.participants[participantId];

    // If host left, elect new host if any participants remain
    const remainingIds = Object.keys(room.participants);
    if (remainingIds.length === 0) {
      // room empty, preserve for a short while then cleanup
      setTimeout(() => {
        if (room && Object.keys(room.participants).length === 0) {
          rooms.delete(roomId);
        }
      }, 1000 * 60 * 30);
    } else if (room.hostId === participantId) {
      room.hostId = remainingIds[0];
      room.participants[remainingIds[0]].isHost = true;
      broadcastToRoom(roomId, {
        type: 'participant:updated',
        participant: room.participants[remainingIds[0]],
      });
    }

    broadcastToRoom(roomId, {
      type: 'participant:left',
      participantId,
      name: participantName,
    });

    const leaveMsg: ChatMessage = {
      id: `sys_leave_${Date.now()}`,
      senderId: 'system',
      senderName: 'Sistema',
      senderAvatar: '🚪',
      senderColor: '#6b7280',
      text: `${participantName} saiu da sala.`,
      timestamp: Date.now(),
      type: 'system',
    };
    room.chat.push(leaveMsg);
    broadcastToRoom(roomId, { type: 'chat:new', message: leaveMsg });
  });
});

// Full-stack Vite dev middleware vs production static files
async function startServer() {
  const hasDist = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE) || hasDist;

  if (isProd && hasDist) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server failed to start, falling back to static:', err);
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
      }
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncRave server listening on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
