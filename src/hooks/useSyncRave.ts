import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  Participant,
  MediaItem,
  ChatMessage,
  FloatingReaction,
  WSServerMessage,
  WSClientMessage,
  AudioSettings,
} from '../types';
import { getDeviceType } from '../utils/device';
import { normalizeRoomId } from '../utils/share';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface SyncRaveHook {
  room: RoomState | null;
  currentUser: Participant | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  ping: number;
  qualityLevel: 'excelente' | 'boa' | 'instavel';
  // Video & Streaming controls
  syncPlayback: (currentTime: number, isPlaying: boolean, playbackRate?: number) => void;
  changeMedia: (media: MediaItem) => void;
  startDailyWatchParty: (media: MediaItem, countdownSeconds?: number) => void;
  reportBuffering: (isBuffering: boolean) => void;
  // Screen Share / Co-Stream
  isScreenSharing: boolean;
  screenShareStream: MediaStream | null;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  // Chat & reactions
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  floatingReactions: FloatingReaction[];
  typingUsers: Record<string, string>;
  sendTypingStatus: (isTyping: boolean) => void;
  // Voice & Audio controls
  isMicActive: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  anyoneSpeaking: boolean;
  audioSettings: AudioSettings;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  pushToTalkActive: boolean;
  toggleMic: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setPushToTalkActive: (active: boolean) => void;
  // Host settings
  updateRoomConfig: (
    allowGuestControl?: boolean,
    title?: string,
    adaptiveSyncMode?: 'ultra-baixa-latencia' | 'estavel-mobile'
  ) => void;
  // Reconnect
  reconnect: () => void;
}

export function useSyncRave(
  rawRoomId: string,
  initialUser: { name: string; avatar: string; color: string }
): SyncRaveHook {
  const roomId = normalizeRoomId(rawRoomId);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Network quality
  const [ping, setPing] = useState(25);
  const [qualityLevel, setQualityLevel] = useState<'excelente' | 'boa' | 'instavel'>('excelente');

  // Chat & reactions state
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  // Voice state
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);

  // Screen Share / Co-Stream
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);

  // Audio settings (Ducking, Noise suppression, High Fidelity)
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    duckingEnabled: true,
    duckingPercentage: 35,
    noiseSuppression: true,
    echoCancellation: true,
    highFidelity: true,
    voiceVolume: 1.1,
    movieVolume: 1.0,
  });

  // Refs for real-time synchronization & networking
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const remoteScreenStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingCheckIntervalRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Safe send over WebSocket
  const sendWS = useCallback((msg: WSClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // WebRTC Audio & Video Connection helper
  const createPeerConnection = useCallback(
    (targetId: string, isInitiator: boolean) => {
      if (peerConnectionsRef.current.has(targetId)) {
        return peerConnectionsRef.current.get(targetId)!;
      }
      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionsRef.current.set(targetId, pc);

        // Add local audio tracks if mic is active
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        // Add local screen share track if host is sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, screenStreamRef.current!);
          });
        }

        // Handle remote tracks (audio and screen share video)
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (!remoteStream) return;

          if (event.track.kind === 'audio') {
            let audio = remoteAudioElementsRef.current.get(targetId);
            if (!audio) {
              audio = new Audio();
              audio.autoplay = true;
              (audio as any).playsInline = true;
              remoteAudioElementsRef.current.set(targetId, audio);
            }
            audio.srcObject = remoteStream;
            audio.volume = isDeafened ? 0 : audioSettings.voiceVolume;
            audio.play().catch(() => {});
          } else if (event.track.kind === 'video') {
            remoteScreenStreamsRef.current.set(targetId, remoteStream);
            setScreenShareStream(remoteStream);
          }
        };

        // ICE candidate routing
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendWS({
              type: 'signal',
              targetId,
              data: { candidate: event.candidate },
            });
          }
        };

        // If initiator, create and send SDP offer with Opus high-bitrate optimization
        if (isInitiator) {
          pc.createOffer()
            .then((offer) => {
              // Enhance Opus audio bitrate in SDP for high fidelity
              let sdp = offer.sdp || '';
              if (audioSettings.highFidelity && sdp.includes('a=rtpmap:111 opus/48000/2')) {
                sdp = sdp.replace(
                  'a=rtpmap:111 opus/48000/2',
                  'a=rtpmap:111 opus/48000/2\r\na=fmtp:111 maxaveragebitrate=96000;stereo=1;useinbandfec=1'
                );
              }
              const desc = new RTCSessionDescription({ type: offer.type, sdp });
              return pc.setLocalDescription(desc);
            })
            .then(() => {
              sendWS({
                type: 'signal',
                targetId,
                data: { offer: pc.localDescription },
              });
            })
            .catch((err) => console.warn('WebRTC offer error:', err));
        }

        return pc;
      } catch (err) {
        console.warn('RTCPeerConnection failed:', err);
        return null;
      }
    },
    [sendWS, isDeafened, audioSettings.voiceVolume, audioSettings.highFidelity]
  );

  // Connect / Reconnect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
    }

    setIsConnecting(true);
    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);

      // Join Room
      const joinMsg: WSClientMessage = {
        type: 'join',
        roomId,
        user: {
          name: initialUser.name,
          avatar: initialUser.avatar,
          color: initialUser.color,
          device: getDeviceType(),
        },
      };
      ws.send(JSON.stringify(joinMsg));

      // Start ping heartbeat for network quality measurement
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'user:ping',
              roomId,
              clientTimestamp: Date.now(),
            })
          );
        }
      }, 3500);
    };

    ws.onmessage = async (event) => {
      try {
        const msg: WSServerMessage = JSON.parse(event.data);
        switch (msg.type) {
          case 'pong': {
            const rtt = Math.max(5, Date.now() - msg.clientTimestamp);
            setPing(rtt);
            setQualityLevel(rtt < 70 ? 'excelente' : rtt < 170 ? 'boa' : 'instavel');
            break;
          }
          case 'room:joined':
            setRoom(msg.room);
            setCurrentUserId(msg.yourId);
            // Initiate WebRTC mesh connections to existing participants
            Object.keys(msg.room.participants).forEach((pid) => {
              if (pid !== msg.yourId) {
                createPeerConnection(pid, true);
              }
            });
            break;
          case 'room:updated':
            setRoom(msg.room);
            break;
          case 'room:error':
            setError(msg.message);
            break;
          case 'playback:updated':
            setRoom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                playback: msg.playback,
                dailyWatchParty: msg.playback.isPlaying ? null : prev.dailyWatchParty,
              };
            });
            break;
          case 'watchparty:sync-started':
            setRoom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                currentMedia: msg.media,
                playback: {
                  currentTime: 0,
                  isPlaying: false,
                  playbackRate: 1,
                  lastUpdatedServerTime: Date.now(),
                },
                dailyWatchParty: {
                  mediaId: msg.media.id,
                  mediaTitle: msg.media.title,
                  syncStartTime: msg.syncStartTime,
                  initiatorName: msg.initiatorName,
                },
              };
            });
            break;
          case 'media:updated':
            setRoom((prev) => {
              if (!prev) return prev;
              const nextRecent = msg.recentMedia || [
                msg.media,
                ...(prev.recentMedia || []).filter((m) => m.url !== msg.media.url && m.id !== msg.media.id),
              ].slice(0, 10);
              return {
                ...prev,
                currentMedia: msg.media,
                recentMedia: nextRecent,
              };
            });
            break;
          case 'chat:new':
            setRoom((prev) => {
              if (!prev) return prev;
              if (prev.chat.some((c) => c.id === msg.message.id)) return prev;
              return {
                ...prev,
                chat: [...prev.chat, msg.message],
              };
            });
            // Also stop typing status once a message arrives for that sender
            if (msg.message.senderId) {
              setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[msg.message.senderId];
                return next;
              });
            }
            break;
          case 'user:typing':
            setTypingUsers((prev) => {
              const next = { ...prev };
              if (msg.isTyping) {
                next[msg.participantId] = msg.name;
              } else {
                delete next[msg.participantId];
              }
              return next;
            });
            break;
          case 'reaction:new':
            setFloatingReactions((prev) => [...prev, msg.reaction]);
            setTimeout(() => {
              setFloatingReactions((prev) => prev.filter((r) => r.id !== msg.reaction.id));
            }, 3500);
            break;
          case 'participant:joined':
            setRoom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                participants: {
                  ...prev.participants,
                  [msg.participant.id]: msg.participant,
                },
              };
            });
            break;
          case 'participant:left':
            setRoom((prev) => {
              if (!prev) return prev;
              const nextParticipants = { ...prev.participants };
              delete nextParticipants[msg.participantId];
              return { ...prev, participants: nextParticipants };
            });
            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[msg.participantId];
              return next;
            });
            // Cleanup WebRTC connection
            {
              const pc = peerConnectionsRef.current.get(msg.participantId);
              if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(msg.participantId);
              }
              const audioElement = remoteAudioElementsRef.current.get(msg.participantId);
              if (audioElement) {
                audioElement.srcObject = null;
                remoteAudioElementsRef.current.delete(msg.participantId);
              }
              remoteScreenStreamsRef.current.delete(msg.participantId);
            }
            break;
          case 'participant:updated':
            setRoom((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                participants: {
                  ...prev.participants,
                  [msg.participant.id]: msg.participant,
                },
              };
            });
            break;
          case 'signal': {
            const senderId = msg.senderId;
            const data = msg.data;
            let peer = peerConnectionsRef.current.get(senderId);
            if (!peer) {
              peer = createPeerConnection(senderId, false) || undefined;
            }
            if (!peer) return;

            if (data.offer) {
              await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              sendWS({
                type: 'signal',
                targetId: senderId,
                data: { answer },
              });
            } else if (data.answer) {
              await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else if (data.candidate) {
              await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            break;
          }
          default:
            break;
        }
      } catch (e) {
        console.error('Error processing WS message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectWebSocket();
        }, 2200);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [roomId, initialUser, createPeerConnection, sendWS]);

  // Initial connection lifecycle
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (_) {}
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteAudioElementsRef.current.forEach((el) => {
        el.srcObject = null;
      });
      remoteAudioElementsRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (speakingCheckIntervalRef.current) {
        clearInterval(speakingCheckIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [connectWebSocket]);

  // Setup Voice Audio Level Analyser with High Pass & Noise threshold
  const setupAudioAnalyser = useCallback(
    (stream: MediaStream) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        if (speakingCheckIntervalRef.current) {
          clearInterval(speakingCheckIntervalRef.current);
        }
        speakingCheckIntervalRef.current = window.setInterval(() => {
          if (!analyserRef.current || isMuted || !isMicActive) {
            if (isSpeaking) {
              setIsSpeaking(false);
              sendWS({
                type: 'voice:status',
                roomId,
                isMuted: true,
                isDeafened,
                isSpeaking: false,
              });
            }
            return;
          }
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const nowSpeaking = avg > 14;
          if (nowSpeaking !== isSpeaking) {
            setIsSpeaking(nowSpeaking);
            sendWS({
              type: 'voice:status',
              roomId,
              isMuted,
              isDeafened,
              isSpeaking: nowSpeaking,
            });
          }
        }, 160);
      } catch (err) {
        console.warn('AudioAnalyser setup skipped:', err);
      }
    },
    [roomId, isMuted, isDeafened, isMicActive, isSpeaking, sendWS]
  );

  // Toggle Microphone
  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setIsMicActive(false);
      setIsSpeaking(false);
      sendWS({
        type: 'voice:status',
        roomId,
        isMuted: true,
        isDeafened,
        isSpeaking: false,
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioSettings.echoCancellation,
          noiseSuppression: audioSettings.noiseSuppression,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      setIsMicActive(true);
      setIsMuted(false);

      // Attach track to all existing peers
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      });

      setupAudioAnalyser(stream);

      sendWS({
        type: 'voice:status',
        roomId,
        isMuted: false,
        isDeafened,
        isSpeaking: false,
      });
    } catch (err) {
      console.error('Failed to get microphone:', err);
      alert('Não foi possível acessar seu microfone. Verifique as permissões de áudio no seu navegador.');
    }
  }, [isMicActive, roomId, isDeafened, audioSettings, setupAudioAnalyser, sendWS]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) {
      toggleMic();
      return;
    }
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
    sendWS({
      type: 'voice:status',
      roomId,
      isMuted: nextMuted,
      isDeafened,
      isSpeaking: false,
    });
  }, [isMuted, isDeafened, roomId, toggleMic, sendWS]);

  // Toggle Deafen
  const toggleDeafen = useCallback(() => {
    const nextDeaf = !isDeafened;
    setIsDeafened(nextDeaf);
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.volume = nextDeaf ? 0 : audioSettings.voiceVolume;
    });
    sendWS({
      type: 'voice:status',
      roomId,
      isMuted,
      isDeafened: nextDeaf,
      isSpeaking: false,
    });
  }, [isDeafened, isMuted, roomId, audioSettings.voiceVolume, sendWS]);

  // Push-to-talk handler
  const handlePushToTalk = useCallback(
    (active: boolean) => {
      setPushToTalkActive(active);
      if (!localStreamRef.current) return;
      const enableMic = active && !isDeafened;
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = enableMic;
      });
      setIsMuted(!enableMic);
      sendWS({
        type: 'voice:status',
        roomId,
        isMuted: !enableMic,
        isDeafened,
        isSpeaking: enableMic,
      });
    },
    [isDeafened, roomId, sendWS]
  );

  // Start Screen Share with Audio (Host Co-Stream for Netflix / Prime / Browser)
  const startScreenShare = useCallback(async () => {
    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        alert('O compartilhamento de tela não é suportado pelo seu navegador neste dispositivo.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          frameRate: { ideal: 60, max: 60 },
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      } as any);

      screenStreamRef.current = stream;
      setScreenShareStream(stream);
      setIsScreenSharing(true);

      // Broadcast tracks to all peers with active WebRTC renegotiation
      for (const [peerId, pc] of peerConnectionsRef.current.entries()) {
        try {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendWS({
            type: 'signal',
            targetId: peerId,
            data: { offer: pc.localDescription },
          });
        } catch (err) {
          console.warn('Renegotiation failed for peer:', peerId, err);
        }
      }

      // Change media in room to screen share
      const screenMedia: MediaItem = {
        id: `screenshare_${Date.now()}`,
        title: `Transmissão de Tela / Streaming (${initialUser.name})`,
        url: 'screenshare',
        type: 'screenshare',
        service: 'screenshare',
        category: 'Transmissão Ao Vivo',
        description: 'Compartilhamento de tela em alta definição com áudio estéreo integrado.',
      };
      sendWS({
        type: 'media:change',
        roomId,
        media: screenMedia,
      });

      // Stop handling when user clicks browser stop sharing
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
    }
  }, [roomId, initialUser.name, sendWS]);

  // Stop Screen Share
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenShareStream(null);
    setIsScreenSharing(false);
  }, []);

  // Update Audio settings
  const handleUpdateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      remoteAudioElementsRef.current.forEach((audio) => {
        audio.volume = updated.voiceVolume;
      });
      return updated;
    });
  }, []);

  // Synchronize video playback
  const syncPlayback = useCallback(
    (currentTime: number, isPlaying: boolean, playbackRate = 1) => {
      sendWS({
        type: 'playback:sync',
        roomId,
        playback: { currentTime, isPlaying, playbackRate },
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              playback: {
                currentTime,
                isPlaying,
                playbackRate,
                lastUpdatedServerTime: Date.now(),
              },
            }
          : prev
      );
    },
    [roomId, sendWS]
  );

  // Change current media
  const changeMedia = useCallback(
    (media: MediaItem) => {
      sendWS({
        type: 'media:change',
        roomId,
        media,
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              currentMedia: media,
              playback: {
                currentTime: 0,
                isPlaying: true,
                playbackRate: 1,
                lastUpdatedServerTime: Date.now(),
              },
            }
          : prev
      );
    },
    [roomId, sendWS]
  );

  // Automatically initiates a group synchronization start time for a watch party
  const startDailyWatchParty = useCallback(
    (media: MediaItem, countdownSeconds: number = 5) => {
      const targetSyncTime = Date.now() + countdownSeconds * 1000;
      sendWS({
        type: 'watchparty:sync-start',
        roomId,
        media,
        syncStartTime: targetSyncTime,
      });
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              currentMedia: media,
              playback: {
                currentTime: 0,
                isPlaying: false,
                playbackRate: 1,
                lastUpdatedServerTime: Date.now(),
              },
              dailyWatchParty: {
                mediaId: media.id,
                mediaTitle: media.title,
                syncStartTime: targetSyncTime,
                initiatorName: initialUser.name,
              },
            }
          : prev
      );
    },
    [roomId, sendWS, initialUser.name]
  );

  // Buffering report
  const reportBuffering = useCallback(
    (isBuffering: boolean) => {
      sendWS({
        type: 'user:buffering',
        roomId,
        isBuffering,
      });
    },
    [roomId, sendWS]
  );

  // Send Chat message
  const sendMessage = useCallback(
    (text: string) => {
      sendWS({
        type: 'chat:send',
        roomId,
        text,
      });
    },
    [roomId, sendWS]
  );

  // Send Typing Status
  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      sendWS({
        type: 'user:typing',
        roomId,
        isTyping,
      });
    },
    [roomId, sendWS]
  );

  // Send Floating Reaction
  const sendReaction = useCallback(
    (emoji: string) => {
      sendWS({
        type: 'reaction:send',
        roomId,
        emoji,
      });
      const localReaction: FloatingReaction = {
        id: `local_rx_${Date.now()}_${Math.random()}`,
        emoji,
        senderName: initialUser.name,
        senderColor: initialUser.color,
        x: Math.floor(Math.random() * 70) + 15,
      };
      setFloatingReactions((prev) => [...prev, localReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== localReaction.id));
      }, 3500);
    },
    [roomId, initialUser, sendWS]
  );

  // Room config
  const updateRoomConfig = useCallback(
    (
      allowGuestControl?: boolean,
      title?: string,
      adaptiveSyncMode?: 'ultra-baixa-latencia' | 'estavel-mobile'
    ) => {
      sendWS({
        type: 'room:config',
        roomId,
        allowGuestControl,
        title,
        adaptiveSyncMode,
      });
    },
    [roomId, sendWS]
  );

  const currentUser = room && currentUserId ? room.participants[currentUserId] || null : null;

  // Calculate if anyone in room is speaking (for audio ducking of video)
  const anyoneSpeaking = room
    ? Object.values(room.participants).some((p) => (p.id === currentUserId ? isSpeaking : p.isSpeaking))
    : isSpeaking;

  return {
    room,
    currentUser,
    isConnected,
    isConnecting,
    error,
    ping,
    qualityLevel,
    syncPlayback,
    changeMedia,
    startDailyWatchParty,
    reportBuffering,
    isScreenSharing,
    screenShareStream,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    sendReaction,
    floatingReactions,
    typingUsers,
    sendTypingStatus,
    isMicActive,
    isMuted,
    isDeafened,
    isSpeaking,
    anyoneSpeaking,
    audioSettings,
    updateAudioSettings: handleUpdateAudioSettings,
    pushToTalkActive,
    toggleMic,
    toggleMute,
    toggleDeafen,
    setPushToTalkActive: handlePushToTalk,
    updateRoomConfig,
    reconnect: connectWebSocket,
  };
}
