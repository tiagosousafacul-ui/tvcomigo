import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Tv,
  Play,
  Monitor,
  Sparkles,
  Check,
  ShieldCheck,
  History,
  RotateCcw,
  Copy,
  ExternalLink,
  Trash2,
  Film,
} from 'lucide-react';
import { MediaItem, StreamingService, ConnectedStreamingAccount } from '../types';
import { STREAMING_PLATFORMS, POPULAR_STREAMING_TITLES } from '../data/mediaCatalog';
import { resolveStreamingMedia } from '../utils/streamingResolver';
import { StreamEntryPortal } from './StreamEntryPortal';

interface StreamingHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  onStartScreenShare: () => Promise<void>;
  currentMediaId?: string;
  onOpenDrmHelper?: () => void;
  onOpenStreamingAuth?: (service: StreamingService, title?: string) => void;
  recentMedia?: MediaItem[];
  roomId?: string;
  isHost?: boolean;
  allowGuestControl?: boolean;
  accounts?: Record<string, ConnectedStreamingAccount>;
  onConnectAccount?: (service: StreamingService, email: string, profile: string) => void;
  onDisconnectAccount?: (service: StreamingService) => void;
}

export const StreamingHubModal: React.FC<StreamingHubModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onStartScreenShare,
  currentMediaId,
  onOpenDrmHelper,
  onOpenStreamingAuth,
  recentMedia: serverRecentMedia = [],
  roomId = 'default',
  isHost = true,
  allowGuestControl = true,
  accounts = {},
  onConnectAccount,
  onDisconnectAccount,
}) => {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Custom link inputs
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [_customPlatform, _setCustomPlatform] = useState<StreamingService>('netflix');

  // Local storage recent list fallback & persistence (max 5 items)
  const storageKey = `syncrave_recent_media_${roomId}`;
  const [localRecentMedia, setLocalRecentMedia] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved).slice(0, 5);
      }
    } catch (_) {}
    return [];
  });

  // Sync with incoming server recentMedia
  useEffect(() => {
    if (serverRecentMedia && serverRecentMedia.length > 0) {
      setLocalRecentMedia((prev) => {
        const merged = [...serverRecentMedia];
        for (const item of prev) {
          if (!merged.some((m) => m.url === item.url || m.id === item.id)) {
            merged.push(item);
          }
        }
        const updated = merged.slice(0, 5);
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    }
  }, [serverRecentMedia, storageKey]);

  if (!isOpen) return null;

  // Deduplicated effective recent media list (limited to 5 items)
  const effectiveRecentMedia: MediaItem[] = (() => {
    const list: MediaItem[] = [];
    const seen = new Set<string>();

    for (const item of [...(serverRecentMedia || []), ...localRecentMedia]) {
      const key = item.url || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
      if (list.length >= 5) break;
    }

    return list;
  })();

  const saveToRecent = (item: MediaItem) => {
    setLocalRecentMedia((prev) => {
      const filtered = prev.filter((m) => m.url !== item.url && m.id !== item.id);
      const updated = [item, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const clearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalRecentMedia([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (_) {}
  };

  const handleCopyLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const hasPermission = isHost || allowGuestControl;

  const handleSelect = (item: MediaItem) => {
    if (!hasPermission) {
      setErrorNotice("Controle bloqueado: Somente o anfitrião pode alterar a mídia da sala no momento. Use o botão 'Original' para assistir sozinho!");
      setTimeout(() => setErrorNotice(null), 6000);
      return;
    }
    saveToRecent(item);
    onSelectMedia(item);
    if (item.serviceUrl && item.service !== 'youtube' && item.service !== 'direct') {
      window.open(item.serviceUrl, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const resolved = resolveStreamingMedia(customUrl.trim(), customTitle.trim());
    handleSelect(resolved);
  };

  const handleStartCoStream = async () => {
    await onStartScreenShare();
    onClose();
  };

  const filteredTitles = POPULAR_STREAMING_TITLES.filter((item) => {
    const matchesService =
      selectedService === 'all' ||
      item.service === selectedService ||
      (selectedService === 'direct' && item.service === 'direct');
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.service && item.service.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.kind && item.kind.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesService && matchesSearch;
  });

  const globalMatchesCount = searchQuery
    ? POPULAR_STREAMING_TITLES.filter((item) => {
        return (
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.service && item.service.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.kind && item.kind.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }).length
    : 0;

  const filteredRecentMedia = effectiveRecentMedia.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredTitleMovies = POPULAR_STREAMING_TITLES.filter(
    (item) =>
      (item.service === 'netflix' || item.service === 'disney') &&
      item.kind === 'filme' &&
      (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.service && item.service.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.kind && item.kind.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredTitleSeries = POPULAR_STREAMING_TITLES.filter(
    (item) =>
      (item.service === 'netflix' || item.service === 'disney') &&
      item.kind === 'serie' &&
      (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.service && item.service.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.kind && item.kind.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-4xl max-h-[90dvh] bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-tr from-violet-600 via-fuchsia-600 to-red-500 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-extrabold text-white tracking-tight">
                  Central de Streamings
                </h2>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  Rave Mode
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1">
                Netflix, Prime Video, Disney+, Max, YouTube e Recentes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Co-Stream Highlight Banner */}
        <div className="p-2.5 sm:px-6 sm:py-3.5 bg-linear-to-r from-violet-950/40 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                Transmitir Tela / Aba com Áudio
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-mono">
                  60 FPS HD
                </span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                Transmita sua Netflix logada com som estéreo direto para os celulares dos amigos!
              </p>
            </div>
          </div>
          <button
            onClick={handleStartCoStream}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Transmitir Tela</span>
          </button>
        </div>

        {/* Streaming Platforms Selector Tabs with Recentes Tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-2.5 sm:px-6 bg-zinc-950/60 border-b border-zinc-800 scrollbar-none shrink-0">
          <button
            onClick={() => setSelectedService('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedService === 'all'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-750'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Todos</span>
          </button>

          {/* New Recentes Tab */}
          <button
            onClick={() => setSelectedService('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedService === 'recent'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30 font-extrabold'
                : 'bg-zinc-800/80 text-amber-300 hover:bg-zinc-750 border border-amber-500/30'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Recentes</span>
            {effectiveRecentMedia.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedService === 'recent' ? 'bg-zinc-950/30 text-zinc-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {effectiveRecentMedia.length}
              </span>
            )}
          </button>

          {/* New Títulos Tab (Netflix & Disney+ combined catalog split by movies/series) */}
          <button
            onClick={() => setSelectedService('titles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedService === 'titles'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-extrabold'
                : 'bg-zinc-800/80 text-rose-300 hover:bg-zinc-750 border border-rose-500/20'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Títulos (Netflix & Disney+)</span>
          </button>

          {STREAMING_PLATFORMS.filter((p) => p.id !== 'screenshare').map((plat) => {
            const isConn = accounts && accounts[plat.id]?.isConnected;
            return (
              <button
                key={plat.id}
                onClick={() => setSelectedService(plat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                  selectedService === plat.id
                    ? 'border-violet-500 bg-violet-600/30 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <span>{plat.logo}</span>
                <span>{plat.name}</span>
                {isConn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" title="Conta Conectada" />
                )}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 flex flex-col gap-4">
          {/* Custom Link / Title Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar nos recentes ou catálogo (Netflix, YouTube, Prime...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          {errorNotice && (
            <div className="p-3 rounded-xl bg-red-600/20 border border-red-500/40 text-xs text-red-300 flex items-center gap-2 animate-fade-in shrink-0">
              <span className="text-base shrink-0">⚠️</span>
              <p className="font-semibold">{errorNotice}</p>
            </div>
          )}

          {!hasPermission && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2.5 animate-fade-in shrink-0">
              <span className="text-base shrink-0">🔒</span>
              <div className="text-left">
                <strong className="text-white">Controle de Mídia Bloqueado pelo Anfitrião:</strong>
                <p className="text-zinc-400 mt-0.5 leading-snug">
                  Somente o dono da sala pode trocar os filmes sincronizados da transmissão. Mas você ainda pode usar o botão <strong className="text-amber-300">"Original"</strong> em qualquer card para abrir e assistir sozinho no site oficial!
                </p>
              </div>
            </div>
          )}

          {/* Rescue banner when searching in a tab with 0 results but there are global catalog results */}
          {searchQuery && selectedService !== 'all' && filteredTitles.length === 0 && globalMatchesCount > 0 && (
            <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/30 text-xs text-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">🔍</span>
                <span>
                  Nenhum título encontrado em <strong>{selectedService}</strong>, mas encontramos <strong>{globalMatchesCount}</strong> correspondências no catálogo geral!
                </span>
              </div>
              <button
                onClick={() => setSelectedService('all')}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] whitespace-nowrap transition cursor-pointer"
              >
                Buscar Globalmente
              </button>
            </div>
          )}

          {/* DRM Notice & Solution Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-red-950/25 border border-red-800/40 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>Dificuldade para abrir Netflix por causa do DRM (tela preta)?</span>
            </div>
            {onOpenDrmHelper && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDrmHelper();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-sm active:scale-95 transition cursor-pointer shrink-0"
              >
                Ver Soluções de DRM →
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* SEÇÃO RECENTES (Últimos 5 vídeos compartilhados na sala) */}
          {/* ======================================================== */}
          {(selectedService === 'recent' || (selectedService === 'all' && !searchQuery)) && (
            <div className="bg-zinc-950/90 border border-amber-500/30 rounded-3xl p-3.5 sm:p-5 flex flex-col gap-3 shadow-lg shadow-amber-950/10">
              {/* Recentes Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-white">
                        Recentes na Sala
                      </h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Últimos {effectiveRecentMedia.length} de 5
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400">
                      Reassista vídeos compartilhados sem precisar buscar o link novamente
                    </p>
                  </div>
                </div>

                {effectiveRecentMedia.length > 0 && (
                  <button
                    onClick={clearRecent}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Limpar histórico recente desta sala"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Limpar</span>
                  </button>
                )}
              </div>

              {/* Recentes Cards */}
              {filteredRecentMedia.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredRecentMedia.map((item) => {
                    const isPlayingNow = item.id === currentMediaId;
                    return (
                      <div
                        key={item.id}
                        className={`group relative flex flex-col rounded-2xl overflow-hidden border p-2.5 sm:p-3 transition-all duration-200 bg-zinc-900/80 hover:bg-zinc-850 ${
                          isPlayingNow
                            ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Thumbnail / Poster */}
                          <div className="relative w-20 sm:w-24 aspect-video rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                            {item.poster ? (
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-linear-to-tr from-violet-900 to-zinc-900 text-xs font-bold text-white">
                                {item.service || 'Vídeo'}
                              </div>
                            )}

                            {/* Service Badge Overlay */}
                            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-black/80 backdrop-blur-xs text-white">
                              {item.service || 'HD'}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1">
                                {isPlayingNow && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                )}
                                <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">
                                  {item.title}
                                </h4>
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-mono">
                                {item.url}
                              </p>
                            </div>

                            {/* Status Pill */}
                            <div className="mt-1 flex items-center gap-1">
                              {isPlayingNow ? (
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Tocando Agora
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">
                                  Salvo no histórico
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                          <button
                            onClick={() => handleSelect(item)}
                            className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reassistir</span>
                          </button>

                          <button
                            onClick={(e) => handleCopyLink(item.url, e)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-[11px] flex items-center gap-1 border border-zinc-700 active:scale-95 transition cursor-pointer shrink-0"
                            title="Copiar link do vídeo"
                          >
                            {copiedUrl === item.url ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[10px]">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copiar</span>
                              </>
                            )}
                          </button>

                          {item.serviceUrl && (
                            <a
                              href={item.serviceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 active:scale-95 transition cursor-pointer"
                              title="Abrir no app oficial"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center flex flex-col items-center justify-center gap-1.5">
                  <History className="w-6 h-6 text-zinc-600" />
                  <p className="text-xs text-zinc-400">
                    Nenhum vídeo compartilhado recentemente nesta sala.
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    Cole um link de vídeo abaixo ou selecione um título para começar!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* NOVA ABA: TÍTULOS (Netflix & Disney+ combinados)         */}
          {/* ======================================================== */}
          {selectedService === 'titles' && (
            <div className="flex flex-col gap-6 bg-zinc-950/40 p-3 sm:p-5 rounded-3xl border border-zinc-850">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-500 animate-pulse" />
                  <span>Catálogos Combinados (Netflix & Disney+)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Títulos oficiais organizados em categorias para facilitar sua escolha na sala
                </p>
              </div>

              {/* Filmes Subsection */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span className="text-rose-400 text-sm">🎬</span> Filmes Disponíveis
                  </span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-mono">
                    {filteredTitleMovies.length} Filmes
                  </span>
                </div>
                {filteredTitleMovies.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTitleMovies.map((item) => {
                      const isSelected = item.id === currentMediaId;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`group relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 active:scale-98 ${
                            isSelected
                              ? 'border-violet-500 bg-violet-950/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                              : 'border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700'
                          }`}
                        >
                          <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                              {item.service === 'netflix' ? (
                                <span className="text-red-500 font-black">Netflix</span>
                              ) : (
                                <span className="text-sky-400 font-black">Disney+</span>
                              )}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col justify-between flex-1">
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition">
                                {item.title}
                              </h4>
                              <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                                {item.description}
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500 font-medium">Sincronizado</span>
                              <div className="flex items-center gap-1.5">
                                {item.serviceUrl && (
                                  <a
                                    href={item.serviceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700/60 active:scale-95 transition cursor-pointer flex items-center gap-0.5 text-[9px]"
                                    title="Assistir conteúdo original na plataforma oficial"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 text-rose-500" />
                                    <span>Original</span>
                                  </a>
                                )}
                                <span className="text-rose-400 font-bold flex items-center gap-1">
                                  Assistir Filme →
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 text-center">
                    <p className="text-xs text-zinc-500">Nenhum filme corresponde à sua pesquisa nesta categoria.</p>
                  </div>
                )}
              </div>

              {/* Séries Subsection */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/80">
                  <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                    <span className="text-cyan-400 text-sm">📺</span> Séries Disponíveis
                  </span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-mono">
                    {filteredTitleSeries.length} Séries
                  </span>
                </div>
                {filteredTitleSeries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTitleSeries.map((item) => {
                      const isSelected = item.id === currentMediaId;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`group relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 active:scale-98 ${
                            isSelected
                              ? 'border-violet-500 bg-violet-950/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                              : 'border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700'
                          }`}
                        >
                          <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                              {item.service === 'netflix' ? (
                                <span className="text-red-500 font-black">Netflix</span>
                              ) : (
                                <span className="text-sky-400 font-black">Disney+</span>
                              )}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3 flex flex-col justify-between flex-1">
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition">
                                {item.title}
                              </h4>
                              <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                                {item.description}
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500 font-medium">Sincronizado</span>
                              <div className="flex items-center gap-1.5">
                                {item.serviceUrl && (
                                  <a
                                    href={item.serviceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700/60 active:scale-95 transition cursor-pointer flex items-center gap-0.5 text-[9px]"
                                    title="Assistir conteúdo original na plataforma oficial"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>Original</span>
                                  </a>
                                )}
                                <span className="text-cyan-400 font-bold flex items-center gap-1">
                                  Assistir Série →
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-850 text-center">
                    <p className="text-xs text-zinc-500">Nenhuma série corresponde à sua pesquisa nesta categoria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stream Entry Portal for any specifically selected platform */}
          {selectedService !== 'recent' && selectedService !== 'titles' && selectedService !== 'all' && (
            <StreamEntryPortal
              service={selectedService as StreamingService}
              titles={filteredTitles}
              currentMediaId={currentMediaId}
              connectedAccount={accounts ? accounts[selectedService] : undefined}
              onSelectMedia={handleSelect}
              onOpenStreamingAuth={onOpenStreamingAuth || ((s) => {})}
              onConnectAccount={onConnectAccount}
              onDisconnectAccount={onDisconnectAccount}
              onStartScreenShare={handleStartCoStream}
              onOpenDrmHelper={() => {
                onClose();
                if (onOpenDrmHelper) onOpenDrmHelper();
              }}
              onBackToAll={() => setSelectedService('all')}
              hasPermission={hasPermission}
            />
          )}

          {/* Titles Grid & Rave.io Stream Entry Hub (When viewing 'all' tab) */}
          {selectedService === 'all' && (
            <div className="flex flex-col gap-4">
              {/* Central de Modelos de Entrada Rave.io */}
              {!searchQuery && (
                <div className="bg-zinc-950/80 border border-violet-500/30 rounded-3xl p-3.5 sm:p-5 flex flex-col gap-3 shadow-xl shadow-black/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-extrabold text-white">
                            Modelos de Entrada por Streaming (Estilo Rave.io)
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                            Netflix & Todos os Streams
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-zinc-400">
                          Toque em qualquer streaming para abrir o portal com login, perfis e filmes sincronizados
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {STREAMING_PLATFORMS.filter((p) => p.id !== 'screenshare').map((plat) => {
                      const isConnected = accounts && accounts[plat.id]?.isConnected;
                      const accountProfile = accounts ? accounts[plat.id]?.profileName : null;
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setSelectedService(plat.id)}
                          className="group relative flex flex-col items-start p-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-left cursor-pointer active:scale-98 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform">
                              {plat.logo}
                            </span>
                            {isConnected ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" title="Conta Conectada" />
                            ) : (
                              <span className="text-[9px] font-mono font-bold text-zinc-500 group-hover:text-zinc-400">
                                Rave Sync
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white group-hover:text-violet-400 transition truncate w-full">
                            {plat.name}
                          </span>
                          <span
                            className="text-[10px] mt-0.5 truncate w-full font-medium"
                            style={{ color: isConnected ? '#34D399' : '#A1A1AA' }}
                          >
                            {isConnected ? `✓ ${accountProfile || 'Conectado'}` : 'Entrar no Stream →'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-zinc-200">
                  {searchQuery ? `Resultados da busca: "${searchQuery}"` : 'Catálogo Geral de Streamings & Filmes'}
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {filteredTitles.length} títulos disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredTitles.map((item) => {
                  const isSelected = item.id === currentMediaId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`group relative flex flex-col rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 active:scale-98 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-950/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                          : 'border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700'
                      }`}
                    >
                      <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                        {/* Platform Badge */}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                          {item.service === 'netflix' && <span className="text-red-500 font-black">N</span>}
                          {item.service === 'prime' && <span className="text-sky-400 font-black">Prime</span>}
                          {item.service === 'disney' && <span className="text-blue-400 font-black">Disney</span>}
                          {item.service === 'max' && <span className="text-purple-400 font-black">Max</span>}
                          {item.service === 'crunchyroll' && <span className="text-amber-400 font-black">Anime</span>}
                          {item.service === 'youtube' && <span className="text-rose-500 font-black">YouTube</span>}
                          {item.service === 'twitch' && <span className="text-purple-300 font-black">Twitch</span>}
                          {item.service === 'drive' && <span className="text-amber-400 font-black">Drive</span>}
                          {item.service === 'direct' && <span className="text-violet-400 font-black">4K</span>}
                          <span>{item.category || item.service}</span>
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition">
                            {item.title}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {item.description}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 font-medium">Sincronizado</span>
                          <div className="flex items-center gap-1.5">
                            {item.serviceUrl && (
                              <a
                                href={item.serviceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700/60 active:scale-95 transition cursor-pointer flex items-center gap-0.5 text-[9px]"
                                title="Assistir conteúdo original na plataforma oficial"
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-violet-400" />
                                <span>Original</span>
                              </a>
                            )}
                            <span className="text-violet-400 font-bold flex items-center gap-1">
                              Assistir →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Link Integration Box */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
                Colar Link de Qualquer Vídeo ou Streaming
              </h3>
            </div>
            <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                required
                placeholder="Link do YouTube, Netflix, Prime ou arquivo .mp4..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
              />
              <input
                type="text"
                placeholder="Título (opcional)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full sm:w-44 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/30 transition active:scale-95 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Transmitir</span>
              </button>
            </form>
          </div>

          {/* DRM / Compatibility Information Card */}
          <div className="bg-violet-950/15 border border-violet-800/30 rounded-2xl p-3 sm:p-4 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white">Assistir Netflix no celular sem travamentos:</strong>
              <p className="text-zinc-400 mt-0.5">
                O anfitrião pode compartilhar a aba da Netflix com áudio estéreo nativo pelo modo <strong>Transmitir Minha Tela</strong>, e os convidados no iPhone ou Android recebem o áudio e o vídeo em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
