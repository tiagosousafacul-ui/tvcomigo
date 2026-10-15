import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  RotateCcw,
  Zap,
  Wifi,
  Film,
  CheckCircle2,
  ShieldCheck,
  FastForward,
  Sparkles,
  X,
  Monitor,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Flame,
} from 'lucide-react';
import Hls from 'hls.js';
import { MediaItem, PlaybackState, Participant, AudioSettings } from '../types';
import { formatTime, extractYouTubeId, extractTwitchChannel, isMobileDevice } from '../utils/device';
import { FloatingReactions } from './FloatingReactions';

const QUICK_VIDEO_REACTIONS = ['❤️', '🔥', '😂', '🍿', '👏', '😱', '🎉'];

interface VideoPlayerProps {
  media: MediaItem;
  playback: PlaybackState;
  currentUser: Participant | null;
  participants?: Record<string, Participant>;
  canControl: boolean;
  onSyncPlayback: (currentTime: number, isPlaying: boolean, playbackRate?: number) => void;
  onOpenMediaBrowser: () => void;
  floatingReactions: any[];
  onSendReaction?: (emoji: string) => void;
  onReportBuffering?: (isBuffering: boolean) => void;
  screenShareStream?: MediaStream | null;
  onStartScreenShare?: () => Promise<void>;
  anyoneSpeaking?: boolean;
  audioSettings?: AudioSettings;
  ping?: number;
  qualityLevel?: 'excelente' | 'boa' | 'instavel';
  adaptiveSyncMode?: 'ultra-baixa-latencia' | 'estavel-mobile';
  onOpenAudioOptimization?: () => void;
  onOpenStreamingAccounts?: () => void;
  isAccountConnected?: boolean;
  isFullscreenMode?: boolean;
  onToggleFullscreenMode?: () => void;
  onOpenDrmHelper?: () => void;
  connectedAccount?: { email?: string; profileName?: string; isConnected?: boolean };
  onOpenStreamingAuth?: () => void;
  onOpenTop10?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  playback,
  currentUser: _currentUser,
  participants = {},
  canControl,
  onSyncPlayback,
  onOpenMediaBrowser,
  onOpenTop10,
  floatingReactions,
  onSendReaction,
  onReportBuffering,
  screenShareStream,
  onStartScreenShare,
  anyoneSpeaking = false,
  audioSettings,
  ping = 25,
  qualityLevel = 'excelente',
  adaptiveSyncMode = 'estavel-mobile',
  onOpenAudioOptimization,
  onOpenStreamingAccounts,
  isAccountConnected: _isAccountConnected = false,
  isFullscreenMode = false,
  onToggleFullscreenMode,
  onOpenDrmHelper,
  connectedAccount,
  onOpenStreamingAuth,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'adjusting' | 'buffering'>('synced');
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [syncTestNotification, setSyncTestNotification] = useState<string | null>(null);
  const [joinToast, setJoinToast] = useState<{ name: string; avatar: string } | null>(null);
  const [seekFeedback, setSeekFeedback] = useState<{ side: 'left' | 'right'; text: string } | null>(null);
  const [showReactionsBar, setShowReactionsBar] = useState(true);
  const [lastClickedEmoji, setLastClickedEmoji] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Reset states on new media
  useEffect(() => {
    setVideoError(false);
    setIsLoadingMedia(true);
    setNeedsUserInteraction(false);
  }, [media.url, media.id]);

  const handleTriggerReaction = (emoji: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setLastClickedEmoji(emoji);
    setTimeout(() => setLastClickedEmoji(null), 350);
    onSendReaction?.(emoji);
  };

  const isInternalUpdateRef = useRef(false);
  const hideControlsTimerRef = useRef<number | null>(null);
  const prevParticipantIdsRef = useRef<string[]>([]);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Detect when a new participant enters the room and show visual on-video alert
  useEffect(() => {
    const currentIds = Object.keys(participants);
    if (prevParticipantIdsRef.current.length > 0) {
      const addedIds = currentIds.filter((id) => !prevParticipantIdsRef.current.includes(id));
      if (addedIds.length > 0) {
        const p = participants[addedIds[0]];
        if (p && p.id !== _currentUser?.id) {
          setJoinToast({ name: p.name, avatar: p.avatar });
          setTimeout(() => setJoinToast(null), 4000);
        }
      }
    }
    prevParticipantIdsRef.current = currentIds;
  }, [participants, _currentUser?.id]);

  // Streaming type detections
  const isScreenShare = media.type === 'screenshare';
  const twitchChannel = extractTwitchChannel(media.url);
  const isTwitch = !isScreenShare && !!twitchChannel;

  const isCommercialTitle =
    media.service === 'netflix' ||
    media.service === 'prime' ||
    media.service === 'disney' ||
    media.service === 'max' ||
    media.service === 'crunchyroll' ||
    (!!media.service && media.service !== 'youtube' && media.service !== 'twitch' && media.service !== 'direct' && media.service !== 'screenshare');

  const [isTrailerMode, setIsTrailerMode] = useState(false);
  const [_hasOpenedCompanionWindow, setHasOpenedCompanionWindow] = useState(false);

  const SERVICE_THEMES: Record<string, { name: string; color: string; logo: string }> = {
    netflix: { name: 'Netflix', color: '#E50914', logo: '🍿' },
    prime: { name: 'Prime Video', color: '#00A8E1', logo: '📦' },
    disney: { name: 'Disney+', color: '#113CCF', logo: '🏰' },
    max: { name: 'Max (HBO)', color: '#5822B4', logo: '🐉' },
    crunchyroll: { name: 'Crunchyroll', color: '#FF6400', logo: '🍙' },
  };

  const serviceTheme = media.service && SERVICE_THEMES[media.service]
    ? SERVICE_THEMES[media.service]
    : { name: media.service || 'Streaming', color: '#8B5CF6', logo: '🎬' };

  // When media changes, reset trailer mode so user sees their chosen video!
  useEffect(() => {
    setIsTrailerMode(false);
    setHasOpenedCompanionWindow(false);
  }, [media.id, media.url]);

  const handleOpenOfficialVideo = useCallback(() => {
    const targetUrl = media.serviceUrl || media.url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setHasOpenedCompanionWindow(true);
      if (!playback.isPlaying && canControl) {
        onSyncPlayback(currentTime, true, playback.playbackRate);
      }
      setSyncTestNotification(`▶ Vídeo aberto diretamente na ${serviceTheme.name}!`);
      setTimeout(() => setSyncTestNotification(null), 4000);
    }
  }, [media.serviceUrl, media.url, playback.isPlaying, canControl, onSyncPlayback, currentTime, playback.playbackRate, serviceTheme.name]);

  const isYouTube =
    !isScreenShare &&
    !isTwitch &&
    ((!isCommercialTitle && (media.type === 'youtube' || !!extractYouTubeId(media.url))) ||
      (isCommercialTitle && isTrailerMode && !!(media.trailerUrl || extractYouTubeId(media.url))));

  const effectiveYoutubeUrl =
    isCommercialTitle && isTrailerMode && media.trailerUrl ? media.trailerUrl : media.url;
  const youtubeVideoId = isYouTube ? extractYouTubeId(effectiveYoutubeUrl) : null;
  const isHls =
    !isScreenShare &&
    !isTwitch &&
    !isYouTube &&
    !isCommercialTitle &&
    (media.url.includes('.m3u8') || media.type === 'stream');

  // Handle Screen Share stream binding
  useEffect(() => {
    if (isScreenShare && screenVideoRef.current) {
      if (screenShareStream) {
        screenVideoRef.current.srcObject = screenShareStream;
        screenVideoRef.current.play().catch(() => {});
        setIsLocalPlaying(true);
        setIsLoadingMedia(false);
      }
    }
  }, [isScreenShare, screenShareStream]);

  // Audio Ducking calculation
  useEffect(() => {
    const baseVolume = (audioSettings?.movieVolume ?? 1) * volume;
    const duckingFactor =
      audioSettings?.duckingEnabled && anyoneSpeaking
        ? 1 - (audioSettings.duckingPercentage || 35) / 100
        : 1;
    const targetVolume = isMuted ? 0 : Math.max(0, Math.min(1, baseVolume * duckingFactor));

    if (!isYouTube && videoRef.current) {
      videoRef.current.volume = targetVolume;
    } else if (isYouTube && ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(targetVolume * 100);
    }
  }, [audioSettings, anyoneSpeaking, volume, isMuted, isYouTube]);

  // Calculate target playback time from server authoritative clock
  const getCalculatedServerTime = useCallback(() => {
    if (!playback.isPlaying) {
      return playback.currentTime;
    }
    const elapsedSeconds = (Date.now() - playback.lastUpdatedServerTime) / 1000;
    return Math.max(0, playback.currentTime + elapsedSeconds * playback.playbackRate);
  }, [playback]);

  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  const getCalculatedServerTimeRef = useRef(getCalculatedServerTime);
  useEffect(() => {
    getCalculatedServerTimeRef.current = getCalculatedServerTime;
  }, [getCalculatedServerTime]);

  // Controls Visibility
  const handleUserActivity = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    if (playback.isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 4000);
    }
  };

  // HTML5 & HLS Video Player Engine (No Black Screens!)
  useEffect(() => {
    if (isYouTube || isScreenShare || isTwitch || (isCommercialTitle && !isTrailerMode)) return;
    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const startPlay = () => {
      if (isCancelled || !video) return;
      const targetTime = getCalculatedServerTimeRef.current();
      if (Math.abs(video.currentTime - targetTime) > 1.2) {
        try {
          video.currentTime = targetTime;
        } catch (_) {}
      }

      if (playbackRef.current.isPlaying) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (isCancelled) return;
              setIsLocalPlaying(true);
              setIsLoadingMedia(false);
              setNeedsUserInteraction(false);
            })
            .catch(() => {
              if (isCancelled) return;
              // Autoplay with audio was blocked: mute and play so video NEVER stays black!
              video.muted = true;
              setIsMuted(true);
              video
                .play()
                .then(() => {
                  if (isCancelled) return;
                  setIsLocalPlaying(true);
                  setIsLoadingMedia(false);
                  setNeedsUserInteraction(true); // Prompts user to unmute
                })
                .catch((err) => {
                  console.warn('Playback requires manual user tap:', err);
                  setIsLocalPlaying(false);
                  setIsLoadingMedia(false);
                  setNeedsUserInteraction(true);
                });
            });
        }
      } else {
        video.pause();
        setIsLocalPlaying(false);
        setIsLoadingMedia(false);
      }
    };

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(media.url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startPlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setVideoError(true);
              break;
          }
        }
      });
    } else {
      // Direct MP4 / WebM or Apple Native HLS in Safari
      video.src = media.url;
      video.load();

      const onCanPlay = () => {
        startPlay();
      };

      if (video.readyState >= 2) {
        startPlay();
      } else {
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('loadeddata', onCanPlay, { once: true });
      }
    }

    // Safety timeout: never let spinner hang for more than 1.5s
    const safetyTimeout = setTimeout(() => {
      if (!isCancelled) {
        setIsLoadingMedia(false);
        startPlay();
      }
    }, 1500);

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimeout);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [media.url, media.id, isYouTube, isScreenShare, isTwitch, isHls]);

  // Synchronize play/pause and drift for HTML5 video
  useEffect(() => {
    if (isYouTube || isScreenShare || isTwitch) return;
    const video = videoRef.current;
    if (!video) return;

    const targetTime = getCalculatedServerTime();
    const diff = Math.abs(video.currentTime - targetTime);

    isInternalUpdateRef.current = true;

    if (playback.isPlaying && video.paused) {
      video.play().then(() => {
        setIsLocalPlaying(true);
      }).catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().then(() => setIsLocalPlaying(true)).catch(() => {});
      });
    } else if (!playback.isPlaying && !video.paused) {
      video.pause();
      setIsLocalPlaying(false);
    }

    // Adaptive drift correction
    const maxDriftTolerance = adaptiveSyncMode === 'estavel-mobile' ? 2.2 : 0.9;
    const microDriftThreshold = adaptiveSyncMode === 'estavel-mobile' ? 0.35 : 0.15;

    if (diff > maxDriftTolerance) {
      setSyncStatus('adjusting');
      try {
        video.currentTime = targetTime;
      } catch (_) {}
      setTimeout(() => setSyncStatus('synced'), 500);
    } else if (diff > microDriftThreshold) {
      setSyncStatus('adjusting');
      video.playbackRate = video.currentTime < targetTime ? 1.05 : 0.95;
    } else {
      video.playbackRate = playback.playbackRate || 1;
      setSyncStatus('synced');
    }

    const timer = setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 150);
    return () => clearTimeout(timer);
  }, [playback, isYouTube, isScreenShare, isTwitch, adaptiveSyncMode, getCalculatedServerTime]);

  // YouTube Player Synchronization - Initialize once per video
  useEffect(() => {
    if (!isYouTube || !youtubeVideoId || isScreenShare) return;
    let destroyed = false;
    setIsLoadingMedia(true);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(youtubeVideoId);
        setIsLoadingMedia(false);
        return;
      } catch (_) {}
    }

    const initYouTube = () => {
      if (!window.YT || !window.YT.Player) return;
      if (!ytContainerRef.current) return;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        } catch (_) {}
      }

      const isMobile = isMobileDevice();
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: playbackRef.current.isPlaying ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          mute: isMobile ? 1 : 0,
          disablekb: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            if (destroyed) return;
            setIsLoadingMedia(false);
            const targetTime = getCalculatedServerTimeRef.current();
            event.target.seekTo(targetTime, true);
            if (playbackRef.current.isPlaying) {
              try {
                if (isMobile) {
                  event.target.mute();
                  setIsMuted(true);
                }
                event.target.playVideo();
                setIsLocalPlaying(true);
              } catch (_) {
                setIsLocalPlaying(false);
                setNeedsUserInteraction(true);
              }
            } else {
              event.target.pauseVideo();
              setIsLocalPlaying(false);
            }
            setDuration(event.target.getDuration() || media.duration || 0);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsLocalPlaying(true);
              setIsLoadingMedia(false);
              setSyncStatus('synced');
              onReportBuffering?.(false);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsLocalPlaying(false);
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setSyncStatus('buffering');
              onReportBuffering?.(true);
            }
          },
          onError: () => {
            setIsLocalPlaying(false);
            setIsLoadingMedia(false);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initYouTube();
    } else {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYouTube();
      };
    }

    // Polling interval in case window.YT is ready or script was already cached
    const pollInterval = setInterval(() => {
      if (destroyed) {
        clearInterval(pollInterval);
        return;
      }
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        clearInterval(pollInterval);
        initYouTube();
      }
    }, 100);

    // Hard fallback timeout: never let loading spinner block for more than 1.5s
    const fallbackTimeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (!destroyed) {
        setIsLoadingMedia(false);
      }
    }, 1500);

    return () => {
      destroyed = true;
      clearInterval(pollInterval);
      clearTimeout(fallbackTimeout);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        } catch (_) {}
      }
    };
  }, [isYouTube, youtubeVideoId, isScreenShare, onReportBuffering, media.duration]);

  // Sync YouTube state
  useEffect(() => {
    if (!isYouTube || !ytPlayerRef.current || !ytPlayerRef.current.getPlayerState || isScreenShare) return;
    try {
      const targetTime = getCalculatedServerTime();
      const currentYtTime = ytPlayerRef.current.getCurrentTime?.() || 0;
      const diff = Math.abs(currentYtTime - targetTime);

      if (playback.isPlaying) {
        ytPlayerRef.current.playVideo?.();
      } else {
        ytPlayerRef.current.pauseVideo?.();
      }

      if (diff > 2.0) {
        ytPlayerRef.current.seekTo?.(targetTime, true);
      }
    } catch (_) {}
  }, [playback, isYouTube, isScreenShare, getCalculatedServerTime]);

  // Continuous time tracking for timeline update
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSeeking) return;
      if (isCommercialTitle && !isTrailerMode) {
        const serverTime = getCalculatedServerTime();
        setCurrentTime(serverTime);
        if (media.duration) {
          setDuration(media.duration);
        }
      } else if (!isYouTube && !isScreenShare && !isTwitch && videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        if (videoRef.current.duration) {
          setDuration(videoRef.current.duration);
        }
      } else if (isYouTube && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        try {
          const t = ytPlayerRef.current.getCurrentTime() || 0;
          setCurrentTime(t);
          const d = ytPlayerRef.current.getDuration() || 0;
          if (d > 0) setDuration(d);
        } catch (_) {}
      }
    }, 350);
    return () => clearInterval(interval);
  }, [isYouTube, isScreenShare, isTwitch, isSeeking, isCommercialTitle, isTrailerMode, getCalculatedServerTime, media.duration]);

  // Video UI Actions: User Tap Catch-Up & Unmute
  const handleStartLocalPlayback = () => {
    setIsMuted(false);
    setNeedsUserInteraction(false);
    setIsLocalPlaying(true);
    const targetTime = getCalculatedServerTime();

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.unMute?.();
        ytPlayerRef.current.setVolume?.((audioSettings?.movieVolume ?? 1) * 100);
        ytPlayerRef.current.seekTo?.(targetTime, true);
        ytPlayerRef.current.playVideo?.();
      } catch (err) {
        console.warn('YouTube play attempt:', err);
      }
    } else if (videoRef.current) {
      const v = videoRef.current;
      v.muted = false;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLocalPlaying(true);
            if (Math.abs(v.currentTime - targetTime) > 1.2) {
              v.currentTime = targetTime;
            }
          })
          .catch(() => {
            v.muted = true;
            setIsMuted(true);
            v.play().catch(() => {});
          });
      }
    }
  };

  const handleTogglePlay = () => {
    if (needsUserInteraction || (playback.isPlaying && !isLocalPlaying)) {
      handleStartLocalPlayback();
      return;
    }
    if (!canControl) {
      setSyncTestNotification('Apenas o anfitrião tem permissão para pausar a sala.');
      setTimeout(() => setSyncTestNotification(null), 3000);
      return;
    }
    const nextState = !playback.isPlaying;
    const timeNow = currentTime;
    onSyncPlayback(timeNow, nextState, playback.playbackRate);
  };

  // Mobile Double-Tap gesture detector
  const handleContainerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    handleUserActivity();
    const touch = e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const width = rect.width;
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;
    const xDiff = Math.abs(touchX - lastTapRef.current.x);

    if (timeDiff < 320 && xDiff < 80) {
      if (touchX < width * 0.38) {
        if (canControl && !isScreenShare) {
          const newTime = Math.max(0, currentTime - 10);
          if (!isYouTube && videoRef.current) videoRef.current.currentTime = newTime;
          else if (isYouTube && ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(newTime, true);
          onSyncPlayback(newTime, playback.isPlaying, playback.playbackRate);
          setSeekFeedback({ side: 'left', text: '-10s' });
          setTimeout(() => setSeekFeedback(null), 800);
        }
      } else if (touchX > width * 0.62) {
        if (canControl && !isScreenShare) {
          const newTime = Math.min(duration || 300, currentTime + 10);
          if (!isYouTube && videoRef.current) videoRef.current.currentTime = newTime;
          else if (isYouTube && ytPlayerRef.current?.seekTo) ytPlayerRef.current.seekTo(newTime, true);
          onSyncPlayback(newTime, playback.isPlaying, playback.playbackRate);
          setSeekFeedback({ side: 'right', text: '+10s' });
          setTimeout(() => setSeekFeedback(null), 800);
        }
      } else {
        handleTogglePlay();
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: touchX };
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekCommit = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const target = e.currentTarget as HTMLInputElement;
    const newTime = parseFloat(target.value);
    if (!canControl) {
      setSyncTestNotification('Apenas o anfitrião tem permissão para avançar/retroceder.');
      setTimeout(() => setSyncTestNotification(null), 3000);
      return;
    }
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    }
    onSyncPlayback(newTime, playback.isPlaying, playback.playbackRate);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (!isYouTube && videoRef.current) {
      videoRef.current.muted = nextMuted;
    } else if (isYouTube && ytPlayerRef.current) {
      if (nextMuted) ytPlayerRef.current.mute?.();
      else ytPlayerRef.current.unMute?.();
    }
  };

  const toggleFullscreen = () => {
    if (onToggleFullscreenMode) {
      onToggleFullscreenMode();
      return;
    }
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSkipBack = () => {
    if (!canControl) return;
    const newTime = Math.max(0, currentTime - 10);
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    }
    onSyncPlayback(newTime, playback.isPlaying, playback.playbackRate);
  };

  const handleTestSyncJump = () => {
    if (!canControl) return;
    const newTime = Math.min(duration || 300, currentTime + 15);
    if (!isYouTube && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(newTime, true);
    }
    onSyncPlayback(newTime, true, playback.playbackRate);
    setSyncTestNotification('⚡ Sincronizado! O vídeo pulou 15s para todos na sala.');
    setTimeout(() => setSyncTestNotification(null), 3000);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onTouchEnd={handleContainerTouchEnd}
      className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden group select-none touch-manipulation"
    >
      {/* 1. Co-Stream Screen Share Mode (WebRTC Host Stream with Audio) */}
      {isScreenShare ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {screenShareStream ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain pointer-events-auto"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-zinc-300">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-semibold">Conectando à transmissão de tela ao vivo...</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                O áudio estéreo e o vídeo HD do anfitrião estão sendo transmitidos sem intermediários.
              </p>
            </div>
          )}
        </div>
      ) : isTwitch ? (
        /* 2. Official Twitch TV Embed Player with Fallback */
        <div className="w-full h-full flex items-center justify-center bg-black">
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${
              typeof window !== 'undefined' ? window.location.hostname : 'localhost'
            }&parent=localhost&autoplay=true&muted=true`}
            className="w-full h-full border-0 pointer-events-auto"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media"
          />
        </div>
      ) : isYouTube ? (
        /* 3. YouTube Synchronized Player */
        <div className="w-full h-full flex items-center justify-center pointer-events-auto bg-black relative">
          <div ref={ytContainerRef} className="w-full h-full aspect-video max-h-full" />
          {isCommercialTitle && isTrailerMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-zinc-950/90 border border-amber-500/50 text-white shadow-2xl backdrop-blur-md animate-fade-in max-w-[95%]">
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-200 truncate">
                Assistindo prévia: <strong className="text-white">{media.title}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsTrailerMode(false);
                  handleOpenOfficialVideo();
                }}
                className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 shadow-md transition active:scale-95 cursor-pointer shrink-0 ml-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Abrir Vídeo Oficial</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTrailerMode(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
                title="Voltar para a tela do filme"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : isCommercialTitle && !isTrailerMode ? (
        /* 4. RAVE COMMERCIAL STREAMING WATCH PLAYER & DIRECT LAUNCHER */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 overflow-hidden select-none">
          {/* Backdrop with Dynamic Gradient Glow */}
          {media.poster && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={media.poster}
                alt=""
                className="w-full h-full object-cover filter brightness-[0.25] blur-md scale-105 transition-transform duration-1000"
              />
              <div
                className="absolute inset-0 opacity-40 mix-blend-color-dodge pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${serviceTheme.color}66 0%, transparent 75%)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/80" />
            </div>
          )}

          {/* Central Interactive Watch Card */}
          <div className="relative z-10 max-w-xl w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center text-center gap-3.5 sm:gap-4 animate-fade-in">
            {/* Service Logo & Brand Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-2xl sm:text-3xl shadow-2xl relative"
                style={{ boxShadow: `0 0 30px ${serviceTheme.color}40` }}
              >
                <span>{serviceTheme.logo}</span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full border text-white shadow-sm"
                    style={{
                      backgroundColor: `${serviceTheme.color}33`,
                      borderColor: `${serviceTheme.color}66`,
                    }}
                  >
                    {serviceTheme.name} Oficial
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Rave Sync Ativo
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Reprodução Sincronizada na Sala
                </div>
              </div>
            </div>

            {/* Video Title & Synopsis */}
            <div className="max-w-md">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
                {media.title}
              </h2>
              {media.description && (
                <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-2 mt-1 leading-snug">
                  {media.description}
                </p>
              )}
            </div>

            {/* Synced Profile Pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs shadow-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-[11px] text-zinc-300 font-medium">
                {connectedAccount?.isConnected
                  ? `Perfil Sincronizado: ${connectedAccount.profileName || 'Principal'}`
                  : `Perfil ${serviceTheme.name} sincronizado na sala`}
              </span>
              {onOpenStreamingAuth && (
                <button
                  type="button"
                  onClick={onOpenStreamingAuth}
                  className="text-[10px] text-violet-400 hover:text-violet-300 underline font-bold pl-1 cursor-pointer"
                >
                  {connectedAccount?.isConnected ? 'Trocar' : 'Conectar'}
                </button>
              )}
            </div>

            {/* PRIMARY ACTIONS: Direct Video Launcher & Co-Stream */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={handleOpenOfficialVideo}
                className="px-5 py-3 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${serviceTheme.color}, ${serviceTheme.color}cc)`,
                  boxShadow: `0 0 25px ${serviceTheme.color}55`,
                }}
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Abrir Vídeo Escolhido no {serviceTheme.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => onStartScreenShare?.()}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 active:scale-95 transition cursor-pointer"
                title="Transmitir a aba aberta com áudio estéreo nativo para que todos assistam juntos sem tela preta"
              >
                <Monitor className="w-4 h-4" />
                <span>Transmitir Aba c/ Áudio (Rave)</span>
              </button>
            </div>

            {/* Secondary actions: Preview Trailer & Anti-DRM */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              {media.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setIsTrailerMode(true)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-[11px]"
                >
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Trailer de Prévia</span>
                </button>
              )}

              {onOpenDrmHelper && (
                <button
                  type="button"
                  onClick={onOpenDrmHelper}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-[11px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dicas Anti-Tela Preta (DRM)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenMediaBrowser}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer text-[11px]"
              >
                <Tv className="w-3.5 h-3.5 text-violet-400" />
                <span>Trocar Streaming</span>
              </button>
            </div>
          </div>
        </div>
      ) : videoError ? (
        /* 5. Fallback Resolution Card if Direct MP4 Fails */
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-zinc-950 text-zinc-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Vídeo direto protegido ou formato incompatível
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Para assistir com seus amigos sem tela preta, você pode transmitir sua aba com áudio (modo Rave) ou selecionar um filme do catálogo.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onStartScreenShare?.()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Transmitir Minha Tela</span>
            </button>
            {onOpenDrmHelper && (
              <button
                onClick={onOpenDrmHelper}
                className="px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 font-bold text-xs flex items-center gap-1.5 border border-violet-500/40 active:scale-95 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                <span>Guia Anti-DRM</span>
              </button>
            )}
            <button
              onClick={onOpenMediaBrowser}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 border border-zinc-700 active:scale-95 transition cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-violet-400" />
              <span>Trocar Mídia</span>
            </button>
          </div>
        </div>
      ) : (
        /* 5. Native HTML5 & HLS Video Stream Player */
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {media.poster && (
            <img
              src={media.poster}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 pointer-events-none ${
                isLocalPlaying ? 'opacity-0' : 'opacity-40 blur-xs'
              }`}
            />
          )}
          <video
            ref={videoRef}
            poster={media.poster}
            playsInline
            muted={isMuted}
            autoPlay={playback.isPlaying}
            preload="auto"
            className="w-full h-full object-contain pointer-events-auto z-10"
            onError={() => {
              console.warn('Video failed to decode directly:', media.url);
              setVideoError(true);
              setIsLoadingMedia(false);
            }}
            onWaiting={() => {
              setSyncStatus('buffering');
              onReportBuffering?.(true);
            }}
            onPlaying={() => {
              setSyncStatus('synced');
              setIsLocalPlaying(true);
              setIsLoadingMedia(false);
              onReportBuffering?.(false);
            }}
            onPause={() => {
              setIsLocalPlaying(false);
            }}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration || media.duration || 46);
              setIsLoadingMedia(false);
            }}
            onClick={handleTogglePlay}
          />
        </div>
      )}

      {/* Non-blocking loading indicator pill - never blacks out or blocks player */}
      {isLoadingMedia && !videoError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-25 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/85 backdrop-blur-md border border-violet-500/40 text-white text-[11px] font-semibold shadow-xl animate-fade-in">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
            <span>Sincronizando streaming...</span>
            <button
              onClick={() => {
                setIsLoadingMedia(false);
                handleTogglePlay();
              }}
              className="text-[10px] text-violet-300 hover:text-white underline font-bold pl-1 cursor-pointer"
            >
              Iniciar
            </button>
          </div>
        </div>
      )}

      {/* Autoplay unblock button for browsers requiring initial user interaction */}
      {needsUserInteraction && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in pointer-events-auto">
          <button
            onClick={() => {
              setNeedsUserInteraction(false);
              setIsMuted(false);
              if (videoRef.current) {
                videoRef.current.muted = false;
                videoRef.current.play().catch(() => {});
              }
              if (ytPlayerRef.current?.unMute) {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.playVideo();
              }
              setIsLocalPlaying(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xl shadow-violet-600/50 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Toque para Iniciar c/ Som</span>
          </button>
        </div>
      )}

      {/* Commercial Streaming Live Hub Banner (Netflix, Prime, Disney, Max) */}
      {isCommercialTitle && (
        <div className="absolute top-12 sm:top-14 left-2 right-2 sm:left-4 sm:right-auto z-25 max-w-sm sm:max-w-md p-2 sm:p-2.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-600/20 text-red-400 border border-red-500/30 shrink-0">
                {media.service}
              </span>
              <p className="text-[11px] text-zinc-300 font-medium truncate">
                {connectedAccount?.isConnected
                  ? `Conectado: ${connectedAccount.email}`
                  : 'Sua conta não autenticada'}
              </p>
            </div>

            {/* Quick auth trigger */}
            {onOpenStreamingAuth && (
              <button
                onClick={onOpenStreamingAuth}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer shrink-0 ${
                  connectedAccount?.isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                }`}
              >
                {connectedAccount?.isConnected ? 'Trocar Conta' : 'Conectar E-mail'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onStartScreenShare?.()}
                className="px-2 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-[10px] flex items-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
                title="Transmitir a aba aberta com áudio (Modo Rave)"
              >
                <Monitor className="w-3 h-3" />
                <span>Aba c/ Som</span>
              </button>
              {onOpenDrmHelper && (
                <button
                  onClick={onOpenDrmHelper}
                  className="px-2 py-1 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 font-bold text-[10px] flex items-center gap-1 border border-violet-500/40 active:scale-95 transition cursor-pointer"
                  title="Como resolver tela preta de DRM na Netflix"
                >
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  <span>Guia DRM</span>
                </button>
              )}
            </div>

            {media.serviceUrl && (
              <a
                href={media.serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] flex items-center gap-1 border border-zinc-700 active:scale-95 transition cursor-pointer shrink-0"
                title={`Abrir ${media.title} no ${media.service}`}
              >
                <ExternalLink className="w-3 h-3 text-red-400" />
                <span>Abrir no App</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Double Tap Seek Feedback Ripple */}
      {seekFeedback && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-30 px-5 py-3 rounded-full bg-violet-600/90 text-white font-extrabold text-sm sm:text-base shadow-2xl flex items-center gap-1.5 animate-ping duration-300 pointer-events-none ${
            seekFeedback.side === 'left' ? 'left-8 sm:left-16' : 'right-8 sm:right-16'
          }`}
        >
          <span>{seekFeedback.text}</span>
        </div>
      )}

      {/* Floating Reactions Layer */}
      <FloatingReactions reactions={floatingReactions} />

      {/* Sync Test Flash Banner */}
      {syncTestNotification && (
        <div className="absolute top-12 sm:top-16 z-40 px-3.5 py-1.5 rounded-2xl bg-violet-600 text-white text-[11px] sm:text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>{syncTestNotification}</span>
        </div>
      )}

      {/* Top Overlay Badge & Title Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-2 sm:p-4 bg-linear-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between gap-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-400 shadow-md">
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-white text-xs sm:text-sm font-semibold truncate drop-shadow-md">
                {media.title}
              </h2>
              {media.service && media.service !== 'direct' && (
                <button
                  onClick={onOpenStreamingAccounts}
                  className="hidden xs:flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border items-center gap-0.5 bg-red-600/20 text-red-300 border-red-500/40 shrink-0"
                >
                  <ShieldCheck className="w-2.5 h-2.5 text-red-400" />
                  <span className="capitalize">{media.service}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400">
              <span className="capitalize truncate max-w-[70px] sm:max-w-none">
                {media.category || media.service || 'Streaming'}
              </span>
              <span>•</span>
              <span className="font-mono text-zinc-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Sync & Network Status Badges */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={handleTestSyncJump}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 transition active:scale-95 cursor-pointer"
            title="Avançar 15s para testar a sincronização entre todos"
          >
            <FastForward className="w-3 h-3" />
            <span>Testar Sync (+15s)</span>
          </button>

          <button
            onClick={onOpenAudioOptimization}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition cursor-pointer"
            title="Otimizações de Áudio e Rede"
          >
            <Wifi
              className={`w-2.5 h-2.5 ${
                qualityLevel === 'excelente'
                  ? 'text-emerald-400'
                  : qualityLevel === 'boa'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            />
            <span>{ping}ms</span>
          </button>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
              syncStatus === 'synced'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : syncStatus === 'adjusting'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 animate-pulse'
            }`}
          >
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span className="hidden sm:inline">
              {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'adjusting' ? 'Ajustando' : 'Carregando'}
            </span>
          </div>

          {onOpenTop10 && (
            <button
              onClick={onOpenTop10}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Ver Top 10 Diário de Filmes e Séries"
            >
              <Flame className="w-3 h-3 text-rose-500 fill-current animate-pulse" />
              <span className="hidden xs:inline text-[11px]">Top 10</span>
            </button>
          )}

          <button
            onClick={onOpenMediaBrowser}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-200 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title="Escolher outro filme ou streaming"
          >
            <Film className="w-3 h-3 text-violet-400" />
            <span className="hidden xs:inline text-[11px]">Trocar</span>
          </button>
        </div>
      </div>

      {/* Prominent Tap-to-Watch / Autoplay Unblock Overlay */}
      {playback.isPlaying && (!isLocalPlaying || needsUserInteraction) && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleStartLocalPlayback();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleStartLocalPlayback();
          }}
          className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 gap-3 text-center cursor-pointer select-none"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStartLocalPlayback();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              handleStartLocalPlayback();
            }}
            className="px-6 py-3.5 sm:px-9 sm:py-5 rounded-2xl bg-linear-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-lg flex items-center gap-2.5 shadow-2xl shadow-violet-600/60 animate-pulse active:scale-95 border-2 border-white/30 cursor-pointer pointer-events-auto"
          >
            <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-current" />
            <span>Toque para Assistir com Áudio</span>
          </button>
          <p className="text-[11px] sm:text-xs text-zinc-300 font-medium max-w-xs drop-shadow-md">
            O streaming está em reprodução sincronizada! Toque para ativar o som estéreo.
          </p>
        </div>
      )}

      {/* Floating Unmute Button on mobile when playing muted */}
      {isMuted && isLocalPlaying && (
        <button
          onClick={() => {
            setIsMuted(false);
            if (isYouTube && ytPlayerRef.current) {
              try {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume((audioSettings?.movieVolume ?? 1) * 100);
              } catch (_) {}
            } else if (videoRef.current) {
              videoRef.current.muted = false;
            }
          }}
          className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 z-30 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-xl animate-bounce active:scale-95 cursor-pointer"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Ativar Som!</span>
        </button>
      )}

      {/* Real-time Join Notification Toast */}
      {joinToast && (
        <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-2xl bg-violet-950/90 border border-violet-500/50 text-white shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span className="text-base">{joinToast.avatar}</span>
          <span className="text-[11px] font-bold text-violet-200">
            <strong className="text-white">{joinToast.name}</strong> entrou!
          </span>
        </div>
      )}

      {/* Central Big Play indicator when paused by host */}
      {!playback.isPlaying && (
        <button
          onClick={handleTogglePlay}
          className="absolute z-10 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white flex items-center justify-center shadow-2xl shadow-violet-500/50 backdrop-blur-md transform transition active:scale-90 border border-white/20 hover:scale-105 cursor-pointer"
        >
          <Play className="w-7 h-7 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
        </button>
      )}

      {/* Floating Reactions Quick Bar on Video Player */}
      <div className="absolute bottom-16 right-2 sm:bottom-20 sm:right-4 z-35 flex items-center gap-1 pointer-events-auto">
        {showReactionsBar ? (
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full bg-zinc-950/85 hover:bg-zinc-950/95 border border-white/20 backdrop-blur-md shadow-2xl shadow-black/80 transition-all">
            <span className="text-[10px] font-bold text-violet-400 hidden sm:inline mr-0.5 select-none">
              Reagir:
            </span>
            {QUICK_VIDEO_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => handleTriggerReaction(emoji, e)}
                onTouchEnd={(e) => handleTriggerReaction(emoji, e)}
                className={`text-lg sm:text-2xl p-1 rounded-full hover:scale-135 active:scale-160 transition-transform cursor-pointer touch-manipulation select-none ${
                  lastClickedEmoji === emoji
                    ? 'scale-150 rotate-12 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]'
                    : ''
                }`}
                title={`Reagir com ${emoji} (todos na sala vão ver!)`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReactionsBar(false);
              }}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-xs ml-0.5 cursor-pointer"
              title="Ocultar barra de reações"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionsBar(true);
            }}
            className="p-2 sm:p-2.5 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white shadow-xl shadow-violet-600/40 border border-white/25 backdrop-blur-md transition active:scale-90 flex items-center justify-center cursor-pointer group"
            title="Abrir reações rápidas na tela"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform text-amber-300 fill-current" />
          </button>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-linear-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-1.5 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Scrubber */}
        <div className="relative w-full h-5 flex items-center group/scrubber cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onMouseDown={() => setIsSeeking(true)}
            onTouchStart={() => setIsSeeking(true)}
            onChange={handleSeek}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            disabled={!canControl || isScreenShare}
            className="w-full h-full opacity-0 z-10 cursor-pointer"
          />
          <div className="absolute left-0 right-0 h-1.5 group-hover/scrubber:h-2 bg-zinc-800/80 rounded-full overflow-hidden pointer-events-none">
            <div
              className="h-full bg-linear-to-r from-violet-600 via-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div
            className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md pointer-events-none -translate-x-1/2 opacity-0 group-hover/scrubber:opacity-100 transition-opacity"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-1 pt-0.5 text-white">
          <div className="flex items-center gap-1 sm:gap-2.5">
            <button
              onClick={handleTogglePlay}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 active:scale-95 transition text-white cursor-pointer"
              title={playback.isPlaying ? 'Pausar para todos' : 'Reproduzir para todos'}
            >
              {playback.isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              )}
            </button>
            <button
              onClick={handleSkipBack}
              disabled={!canControl || isScreenShare}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Voltar 10s"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={handleToggleMute}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                title={isMuted ? 'Desmutar vídeo' : 'Mutar vídeo'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500 hidden xs:inline-block"
              />
            </div>

            <div className="text-[10px] sm:text-xs text-zinc-400 font-mono ml-1">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Screen share host trigger shortcut */}
            {canControl && (
              <button
                onClick={() => onStartScreenShare?.()}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition active:scale-95 cursor-pointer"
                title="Transmitir aba do navegador com áudio estéreo nativo"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Transmitir Aba</span>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
              title={isFullscreen || isFullscreenMode ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen || isFullscreenMode ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
