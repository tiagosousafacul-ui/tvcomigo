export type StreamingService =
  | 'netflix'
  | 'prime'
  | 'disney'
  | 'max'
  | 'crunchyroll'
  | 'twitch'
  | 'youtube'
  | 'drive'
  | 'screenshare'
  | 'direct'
  | 'video';

export type MediaType = 'video' | 'youtube' | 'stream' | 'screenshare';

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: MediaType;
  service?: StreamingService;
  duration?: number;
  poster?: string;
  category?: string;
  description?: string;
  kind?: 'filme' | 'serie';
  streamingId?: string; // e.g. Netflix video ID
  serviceUrl?: string; // Direct link to streaming web or app
  trailerUrl?: string; // Preview trailer URL
}

export interface ConnectedStreamingAccount {
  service: StreamingService;
  isConnected: boolean;
  email?: string;
  profileName?: string;
  connectedAt?: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isBuffering: boolean;
  device: 'iphone' | 'android' | 'desktop';
  ping: number;
  qualityLevel: 'excelente' | 'boa' | 'instavel';
  connectedAccounts?: Partial<Record<StreamingService, boolean>>;
  joinedAt: number;
}

export interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  lastUpdatedServerTime: number; // ms timestamp for accurate drift compensation
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: number;
  type: 'text' | 'system' | 'reaction';
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  x: number;
}

export interface RoomState {
  id: string;
  title: string;
  hostId: string;
  isPublic: boolean;
  allowGuestControl: boolean;
  adaptiveSyncMode: 'ultra-baixa-latencia' | 'estavel-mobile';
  currentMedia: MediaItem;
  recentMedia?: MediaItem[];
  playback: PlaybackState;
  participants: Record<string, Participant>;
  chat: ChatMessage[];
  createdAt: number;
  dailyWatchParty?: {
    mediaId: string;
    mediaTitle: string;
    syncStartTime: number;
    initiatorName: string;
  } | null;
}

export interface AudioSettings {
  duckingEnabled: boolean;
  duckingPercentage: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  highFidelity: boolean;
  voiceVolume: number;
  movieVolume: number;
}

export type WSClientMessage =
  | { type: 'join'; roomId: string; user: { name: string; avatar: string; color: string; device: 'iphone' | 'android' | 'desktop' } }
  | { type: 'leave'; roomId: string }
  | { type: 'playback:sync'; roomId: string; playback: { currentTime: number; isPlaying: boolean; playbackRate: number } }
  | { type: 'media:change'; roomId: string; media: MediaItem }
  | { type: 'watchparty:sync-start'; roomId: string; media: MediaItem; syncStartTime: number }
  | { type: 'chat:send'; roomId: string; text: string }
  | { type: 'reaction:send'; roomId: string; emoji: string }
  | { type: 'voice:status'; roomId: string; isMuted: boolean; isDeafened: boolean; isSpeaking: boolean }
  | { type: 'user:buffering'; roomId: string; isBuffering: boolean }
  | { type: 'user:ping'; roomId: string; clientTimestamp: number }
  | { type: 'room:config'; roomId: string; allowGuestControl?: boolean; title?: string; adaptiveSyncMode?: 'ultra-baixa-latencia' | 'estavel-mobile' }
  | { type: 'user:typing'; roomId: string; isTyping: boolean }
  | { type: 'signal'; targetId: string; senderId?: string; data: any };

export type WSServerMessage =
  | { type: 'room:joined'; room: RoomState; yourId: string }
  | { type: 'room:error'; message: string }
  | { type: 'room:updated'; room: RoomState }
  | { type: 'playback:updated'; playback: PlaybackState; initiatorId?: string }
  | { type: 'media:updated'; media: MediaItem; initiatorName: string; recentMedia?: MediaItem[] }
  | { type: 'watchparty:sync-started'; media: MediaItem; syncStartTime: number; initiatorName: string }
  | { type: 'chat:new'; message: ChatMessage }
  | { type: 'reaction:new'; reaction: FloatingReaction }
  | { type: 'user:typing'; participantId: string; name: string; isTyping: boolean }
  | { type: 'participant:joined'; participant: Participant }
  | { type: 'participant:left'; participantId: string; name: string }
  | { type: 'participant:updated'; participant: Participant }
  | { type: 'pong'; clientTimestamp: number; serverTimestamp: number }
  | { type: 'signal'; senderId: string; data: any };
