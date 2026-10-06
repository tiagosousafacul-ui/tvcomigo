/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useSyncRave } from './hooks/useSyncRave';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { VoiceRoomBar } from './components/VoiceRoomBar';
import { ChatPanel } from './components/ChatPanel';
import { MembersPanel } from './components/MembersPanel';
import { StreamingHubModal } from './components/StreamingHubModal';
import { StreamingAccountsModal } from './components/StreamingAccountsModal';
import { AudioOptimizationModal } from './components/AudioOptimizationModal';
import { ShareModal } from './components/ShareModal';
import { SettingsModal } from './components/SettingsModal';
import { JoinModal } from './components/JoinModal';
import { DrmHelperModal } from './components/DrmHelperModal';
import { StreamingAuthModal } from './components/StreamingAuthModal';
import { DailyTop10View } from './components/DailyTop10View';
import { WatchPartyCountdownOverlay } from './components/WatchPartyCountdownOverlay';
import { ConnectedStreamingAccount, StreamingService } from './types';
import { extractRoomIdFromLocation, normalizeRoomId, getPublicShareUrl } from './utils/share';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Users,
  ExternalLink,
  Film,
  Maximize2,
  Minimize2,
  Flame,
} from 'lucide-react';

export default function App() {
  const [initialRoomId, setInitialRoomId] = useState<string>(() => extractRoomIdFromLocation());
  const [roomId, setRoomId] = useState<string>('');
  const [joinedUser, setJoinedUser] = useState<{
    name: string;
    avatar: string;
    color: string;
  } | null>(null);

  // Modals & configuration state
  const [isStreamingHubOpen, setIsStreamingHubOpen] = useState(false);
  const [isStreamingAccountsOpen, setIsStreamingAccountsOpen] = useState(false);
  const [isAudioOptimizationOpen, setIsAudioOptimizationOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Streaming Accounts Authentication State (starts unauthenticated so user puts their own email)
  const [connectedAccounts, setConnectedAccounts] = useState<
    Record<string, ConnectedStreamingAccount>
  >(() => {
    try {
      const saved = localStorage.getItem('syncrave_streaming_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any old placeholder dummy email
        if (parsed?.netflix?.email === 'souaistudio@gmail.com') {
          parsed.netflix = { service: 'netflix', isConnected: false };
        }
        if (parsed?.youtube?.email === 'souaistudio@gmail.com') {
          parsed.youtube = { service: 'youtube', isConnected: false };
        }
        return parsed;
      }
    } catch (_) {}
    return {
      netflix: { service: 'netflix', isConnected: false },
      prime: { service: 'prime', isConnected: false },
      disney: { service: 'disney', isConnected: false },
      max: { service: 'max', isConnected: false },
      youtube: { service: 'youtube', isConnected: false },
    };
  });

  const handleConnectAccount = (
    service: StreamingService,
    email: string,
    profileName: string
  ) => {
    setConnectedAccounts((prev) => {
      const next = {
        ...prev,
        [service]: {
          service,
          isConnected: true,
          email,
          profileName: profileName || 'Principal',
          connectedAt: Date.now(),
        },
      };
      try {
        localStorage.setItem('syncrave_streaming_accounts', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleDisconnectAccount = (
    service: StreamingService
  ) => {
    setConnectedAccounts((prev) => {
      const next = {
        ...prev,
        [service]: {
          service,
          isConnected: false,
        },
      };
      try {
        localStorage.setItem('syncrave_streaming_accounts', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Dynamic URL listener for navigation or clicking invite links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncRoomFromUrl = () => {
      const detectedRoom = extractRoomIdFromLocation();
      if (detectedRoom) {
        setInitialRoomId(detectedRoom);
        if (joinedUser && roomId !== detectedRoom) {
          setRoomId(detectedRoom);
        }
      }
    };
    window.addEventListener('popstate', syncRoomFromUrl);
    window.addEventListener('hashchange', syncRoomFromUrl);
    return () => {
      window.removeEventListener('popstate', syncRoomFromUrl);
      window.removeEventListener('hashchange', syncRoomFromUrl);
    };
  }, [joinedUser, roomId]);

  const handleJoin = (
    user: { name: string; avatar: string; color: string },
    selectedRoomId: string
  ) => {
    const cleanRoomId =
      normalizeRoomId(selectedRoomId) || `rave-${Math.floor(Math.random() * 8999 + 1000)}`;
    setJoinedUser(user);
    setRoomId(cleanRoomId);

    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', cleanRoomId);
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    }
  };

  if (!joinedUser || !roomId) {
    return <JoinModal initialRoomId={initialRoomId} onJoin={handleJoin} />;
  }

  return (
    <RoomSession
      roomId={roomId}
      user={joinedUser}
      isStreamingHubOpen={isStreamingHubOpen}
      setIsStreamingHubOpen={setIsStreamingHubOpen}
      isStreamingAccountsOpen={isStreamingAccountsOpen}
      setIsStreamingAccountsOpen={setIsStreamingAccountsOpen}
      isAudioOptimizationOpen={isAudioOptimizationOpen}
      setIsAudioOptimizationOpen={setIsAudioOptimizationOpen}
      isShareOpen={isShareOpen}
      setIsShareOpen={setIsShareOpen}
      isSettingsOpen={isSettingsOpen}
      setIsSettingsOpen={setIsSettingsOpen}
      connectedAccounts={connectedAccounts}
      onConnectAccount={handleConnectAccount}
      onDisconnectAccount={handleDisconnectAccount}
    />
  );
}

interface RoomSessionProps {
  roomId: string;
  user: { name: string; avatar: string; color: string };
  isStreamingHubOpen: boolean;
  setIsStreamingHubOpen: (open: boolean) => void;
  isStreamingAccountsOpen: boolean;
  setIsStreamingAccountsOpen: (open: boolean) => void;
  isAudioOptimizationOpen: boolean;
  setIsAudioOptimizationOpen: (open: boolean) => void;
  isShareOpen: boolean;
  setIsShareOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  connectedAccounts: Record<string, ConnectedStreamingAccount>;
  onConnectAccount: (
    service: StreamingService,
    email: string,
    profileName: string
  ) => void;
  onDisconnectAccount: (service: StreamingService) => void;
}

function RoomSession({
  roomId,
  user,
  isStreamingHubOpen,
  setIsStreamingHubOpen,
  isStreamingAccountsOpen,
  setIsStreamingAccountsOpen,
  isAudioOptimizationOpen,
  setIsAudioOptimizationOpen,
  isShareOpen,
  setIsShareOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  connectedAccounts,
  onConnectAccount,
  onDisconnectAccount,
}: RoomSessionProps) {
  const {
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
    isScreenSharing: _isScreenSharing,
    screenShareStream,
    startScreenShare,
    stopScreenShare: _stopScreenShare,
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
    updateAudioSettings,
    pushToTalkActive,
    toggleMic,
    toggleMute,
    toggleDeafen,
    setPushToTalkActive,
    updateRoomConfig,
    reconnect,
  } = useSyncRave(roomId, user);

  // Mobile layout state
  const [mobileTab, setMobileTab] = useState<'chat' | 'members'>('chat');
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [desktopSidebarTab, setDesktopSidebarTab] = useState<'chat' | 'members'>('chat');
  const [isDrmHelperOpen, setIsDrmHelperOpen] = useState(false);
  const [showTop10View, setShowTop10View] = useState(false);
  const [authModalTarget, setAuthModalTarget] = useState<{
    service: StreamingService;
    title: string;
  } | null>(null);
  const [dismissedAuthForMediaId, setDismissedAuthForMediaId] = useState<string | null>(null);

  const isWatchPartyCountingDown = Boolean(
    room?.dailyWatchParty && room.dailyWatchParty.syncStartTime > Date.now()
  );

  const isTop10Active =
    (room?.currentMedia?.id === 'top10-daily' || !room?.currentMedia?.url || showTop10View) &&
    !isWatchPartyCountingDown;

  // Auto-prompt account authentication when any streaming (Netflix, Prime, Disney, Max, Crunchyroll, YouTube, Twitch, etc.) opens without account
  useEffect(() => {
    if (!room?.currentMedia) return;
    const srv = room.currentMedia.service;
    if (
      srv &&
      ['netflix', 'prime', 'disney', 'max', 'crunchyroll', 'youtube', 'twitch', 'direct'].includes(srv) &&
      !connectedAccounts[srv]?.isConnected &&
      dismissedAuthForMediaId !== room.currentMedia.id &&
      room.currentMedia.id !== 'top10-daily' &&
      room.currentMedia.url
    ) {
      setAuthModalTarget({
        service: srv,
        title: room.currentMedia.title,
      });
    }
  }, [room?.currentMedia?.id, room?.currentMedia?.service, room?.currentMedia?.url, connectedAccounts, dismissedAuthForMediaId]);

  // Connecting screen
  if (isConnecting && !room) {
    return (
      <div className="h-[100dvh] w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold text-white">Sincronizando com a Sala...</h2>
          <p className="text-xs text-zinc-400">
            Conectando áudio WebRTC HD e streaming de baixa latência
          </p>
        </div>
      </div>
    );
  }

  // Error screen with retry
  if (error && !room) {
    return (
      <div className="h-[100dvh] w-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h2 className="text-base font-bold text-white">Erro de Conexão</h2>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
        <button
          onClick={reconnect}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  if (!room) return null;

  const isHost = currentUser?.isHost ?? false;
  const canControl = isHost || room.allowGuestControl;
  const participantsCount = Object.keys(room.participants).length;
  const isDevEnv = typeof window !== 'undefined' && window.location.origin.includes('-dev-');
  const publicShareUrl = getPublicShareUrl(roomId);

  return (
    <div className="h-[100dvh] w-screen max-w-[100vw] flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans pt-safe pb-safe select-none">
      {/* Dev preview alert for host */}
      {isDevEnv && (
        <div className="bg-linear-to-r from-violet-950 via-purple-950 to-indigo-950 border-b border-violet-500/40 px-2.5 py-1 text-xs flex items-center justify-between gap-2 text-violet-200 shrink-0 z-40">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate text-[10px] sm:text-xs">
              <strong>Convidados:</strong> Abra no link público para assistir e conversar junto.
            </span>
          </div>
          <a
            href={publicShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] sm:text-[11px] shrink-0 flex items-center gap-1 shadow-xs transition active:scale-95"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Link Público</span>
          </a>
        </div>
      )}

      {/* Top Header */}
      <Header
        roomTitle={room.title}
        roomId={room.id}
        currentUser={currentUser}
        participantsCount={participantsCount}
        participants={room.participants}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenMediaBrowser={() => setIsStreamingHubOpen(true)}
        onOpenTop10={() => setShowTop10View((prev) => !prev)}
        onOpenStreamingAccounts={() => setIsStreamingAccountsOpen(true)}
        onOpenDrmHelper={() => setIsDrmHelperOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAudioOptimization={() => setIsAudioOptimizationOpen(true)}
        ping={ping}
        isHost={isHost}
      />

      {/* Disconnection Warning Bar if socket temporarily reconnects */}
      {!isConnected && (
        <div className="bg-amber-500/90 text-zinc-950 px-3 py-1 text-xs font-semibold flex items-center justify-center gap-2 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Reconectando à sala sem pausar o streaming...</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ========================================================= */}
        {/* MAIN CINEMA & STREAMING AREA (Unified Single Player)      */}
        {/* ========================================================= */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          {/* Video Player or Daily Top 10 Container */}
          <div
            className={`w-full bg-black relative transition-all duration-300 ${
              isMobileFullscreen
                ? 'flex-1 h-full'
                : 'aspect-video lg:aspect-auto lg:flex-1 max-h-[42dvh] lg:max-h-none shrink-0 border-b lg:border-b-0 border-zinc-800'
            }`}
          >
            {isTop10Active ? (
              <DailyTop10View
                onSelectMedia={(media) => {
                  setShowTop10View(false);
                  changeMedia(media);
                }}
                onOpenMediaBrowser={() => setIsStreamingHubOpen(true)}
                canControl={canControl}
                currentMediaId={room.currentMedia.id}
                isHost={isHost}
                onCloseTop10={
                  room.currentMedia.url && room.currentMedia.id !== 'top10-daily'
                    ? () => setShowTop10View(false)
                    : undefined
                }
                hasActiveMedia={Boolean(room.currentMedia.url && room.currentMedia.id !== 'top10-daily')}
                onStartDailyWatchParty={(media, countdown) => {
                  setShowTop10View(false);
                  startDailyWatchParty(media, countdown);
                }}
                dailyWatchParty={room.dailyWatchParty}
              />
            ) : (
              <VideoPlayer
                media={room.currentMedia}
                playback={room.playback}
                currentUser={currentUser}
                participants={room.participants}
                canControl={canControl}
                onSyncPlayback={syncPlayback}
                onOpenMediaBrowser={() => setIsStreamingHubOpen(true)}
                floatingReactions={floatingReactions}
                onSendReaction={sendReaction}
                onReportBuffering={reportBuffering}
                screenShareStream={screenShareStream}
                onStartScreenShare={startScreenShare}
                anyoneSpeaking={anyoneSpeaking}
                audioSettings={audioSettings}
                ping={ping}
                qualityLevel={qualityLevel}
                adaptiveSyncMode={room.adaptiveSyncMode}
                onOpenAudioOptimization={() => setIsAudioOptimizationOpen(true)}
                onOpenStreamingAccounts={() => setIsStreamingAccountsOpen(true)}
                onOpenDrmHelper={() => setIsDrmHelperOpen(true)}
                isAccountConnected={!!connectedAccounts[room.currentMedia.service || '']?.isConnected}
                connectedAccount={connectedAccounts[room.currentMedia.service || '']}
                onOpenStreamingAuth={() =>
                  setAuthModalTarget({
                    service: (room.currentMedia.service || 'netflix') as StreamingService,
                    title: room.currentMedia.title,
                  })
                }
                onOpenTop10={() => setShowTop10View(true)}
                isFullscreenMode={isMobileFullscreen}
                onToggleFullscreenMode={() => setIsMobileFullscreen((prev) => !prev)}
              />
            )}

            {/* Synchronized Group Countdown Overlay for Daily Watch Party */}
            {isWatchPartyCountingDown && room.dailyWatchParty && (
              <WatchPartyCountdownOverlay
                party={room.dailyWatchParty}
                media={room.currentMedia}
                onFinish={() => setShowTop10View(false)}
              />
            )}

            {/* Quick Cinema Mode Toggle on Mobile */}
            <button
              onClick={() => setIsMobileFullscreen((prev) => !prev)}
              className="lg:hidden absolute top-2.5 right-2.5 z-30 p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs flex items-center gap-1 shadow-lg active:scale-95 cursor-pointer"
              title={isMobileFullscreen ? 'Modo Dividido (Assistir + Chat)' : 'Modo Cinema (Tela Cheia)'}
            >
              {isMobileFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-bold pr-1">Dividir Tela</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-bold pr-1">Modo Cinema</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Room Bar (Always beneath the video) */}
          <VoiceRoomBar
            participants={room.participants}
            currentUser={currentUser}
            isMicActive={isMicActive}
            isMuted={isMuted}
            isDeafened={isDeafened}
            isSpeaking={isSpeaking}
            voiceVolume={audioSettings.voiceVolume}
            pushToTalkActive={pushToTalkActive}
            onToggleMic={toggleMic}
            onToggleMute={toggleMute}
            onToggleDeafen={toggleDeafen}
            onSetVoiceVolume={(vol) => updateAudioSettings({ voiceVolume: vol })}
            onSetPushToTalk={setPushToTalkActive}
          />

          {/* Mobile Bottom Half: Tabs & Content (Only on mobile when not in fullscreen) */}
          {!isMobileFullscreen && (
            <div className="flex-1 min-h-0 flex flex-col bg-zinc-950 lg:hidden">
              {/* Mobile Segmented Tab Switcher */}
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-2 py-1.5 shrink-0">
                <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setMobileTab('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                      mobileTab === 'chat'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat ({room.chat.filter((c) => c.type === 'text').length})</span>
                  </button>

                  <button
                    onClick={() => setMobileTab('members')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                      mobileTab === 'members'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Membros ({participantsCount})</span>
                  </button>
                </div>

                {/* Quick shortcut to Top 10 and change media on mobile */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowTop10View((prev) => !prev)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-[11px] font-bold text-amber-300 hover:text-white transition active:scale-95 cursor-pointer"
                    title="Ver Top 10 de hoje"
                  >
                    <Flame className="w-3 h-3 text-rose-500 fill-current animate-pulse" />
                    <span>Top 10</span>
                  </button>

                  <button
                    onClick={() => setIsStreamingHubOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-violet-300 hover:text-white transition active:scale-95 cursor-pointer"
                  >
                    <Film className="w-3 h-3 text-violet-400" />
                    <span>Filmes</span>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 relative">
                {mobileTab === 'chat' ? (
                  <ChatPanel
                    chat={room.chat}
                    currentUser={currentUser}
                    onSendMessage={sendMessage}
                    onSendReaction={sendReaction}
                    typingUsers={typingUsers}
                    onSendTypingStatus={sendTypingStatus}
                  />
                ) : (
                  <MembersPanel
                    participants={room.participants}
                    currentUser={currentUser}
                    allowGuestControl={room.allowGuestControl}
                    onToggleGuestControl={() =>
                      updateRoomConfig(!room.allowGuestControl, room.title, room.adaptiveSyncMode)
                    }
                    isHost={isHost}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar: Chat & Members */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-zinc-800/80 bg-zinc-950/90 shrink-0">
          <div className="flex border-b border-zinc-800/80 bg-zinc-950/60 p-1.5 gap-1.5 shrink-0">
            <button
              onClick={() => setDesktopSidebarTab('chat')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                desktopSidebarTab === 'chat'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>Bate-Papo</span>
            </button>
            <button
              onClick={() => setDesktopSidebarTab('members')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                desktopSidebarTab === 'members'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Membros ({participantsCount})</span>
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {desktopSidebarTab === 'chat' ? (
              <ChatPanel
                chat={room.chat}
                currentUser={currentUser}
                onSendMessage={sendMessage}
                onSendReaction={sendReaction}
                typingUsers={typingUsers}
                onSendTypingStatus={sendTypingStatus}
              />
            ) : (
              <MembersPanel
                participants={room.participants}
                currentUser={currentUser}
                allowGuestControl={room.allowGuestControl}
                onToggleGuestControl={() =>
                  updateRoomConfig(!room.allowGuestControl, room.title, room.adaptiveSyncMode)
                }
                isHost={isHost}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Modals with Mobile-Optimized Bottom Sheet & Dialog Layouts */}
      <StreamingHubModal
        isOpen={isStreamingHubOpen}
        onClose={() => setIsStreamingHubOpen(false)}
        onSelectMedia={changeMedia}
        onStartScreenShare={startScreenShare}
        currentMediaId={room.currentMedia.id}
        recentMedia={room.recentMedia}
        roomId={room.id}
        onOpenDrmHelper={() => setIsDrmHelperOpen(true)}
        onOpenStreamingAuth={(srv, t) => setAuthModalTarget({ service: srv, title: t || '' })}
        isHost={isHost}
        allowGuestControl={room.allowGuestControl}
        accounts={connectedAccounts}
        onConnectAccount={onConnectAccount}
        onDisconnectAccount={onDisconnectAccount}
      />
      <DrmHelperModal
        isOpen={isDrmHelperOpen}
        onClose={() => setIsDrmHelperOpen(false)}
        room={room}
        onStartScreenShare={startScreenShare}
        netflixWatchUrl={room.currentMedia.serviceUrl || 'https://www.netflix.com'}
      />
      <StreamingAccountsModal
        isOpen={isStreamingAccountsOpen}
        onClose={() => setIsStreamingAccountsOpen(false)}
        accounts={connectedAccounts}
        onConnectAccount={onConnectAccount}
        onDisconnectAccount={onDisconnectAccount}
        onStartCoStream={startScreenShare}
      />
      {authModalTarget && (
        <StreamingAuthModal
          isOpen={!!authModalTarget}
          onClose={() => setAuthModalTarget(null)}
          service={authModalTarget.service}
          title={authModalTarget.title}
          onAuthenticate={onConnectAccount}
          onContinueAsGuest={() => {
            if (room?.currentMedia?.id) {
              setDismissedAuthForMediaId(room.currentMedia.id);
            }
          }}
        />
      )}
      <AudioOptimizationModal
        isOpen={isAudioOptimizationOpen}
        onClose={() => setIsAudioOptimizationOpen(false)}
        audioSettings={audioSettings}
        onUpdateAudioSettings={updateAudioSettings}
        ping={ping}
        qualityLevel={qualityLevel}
        room={room}
        onUpdateRoomConfig={updateRoomConfig}
        isHost={isHost}
      />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={room.id}
        roomTitle={room.title}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        room={room}
        currentUser={currentUser}
        onUpdateConfig={(guest, title) => updateRoomConfig(guest, title, room.adaptiveSyncMode)}
      />
    </div>
  );
}
