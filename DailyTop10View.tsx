import React, { useState, useMemo } from 'react';
import {
  Play,
  Film,
  Sparkles,
  Calendar,
  ExternalLink,
  Flame,
  Search,
  Tv,
  Layers,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { MediaItem, StreamingService } from '../types';
import { getDailyTop10, Top10Entry } from '../data/dailyTop10';

interface DailyTop10ViewProps {
  onSelectMedia: (media: MediaItem) => void;
  onOpenMediaBrowser: () => void;
  canControl: boolean;
  currentMediaId?: string;
  isHost?: boolean;
  onCloseTop10?: () => void;
  hasActiveMedia?: boolean;
  onStartDailyWatchParty?: (media: MediaItem, countdownSeconds?: number) => void;
  onOpenStreamingAuth?: (service: StreamingService, title?: string) => void;
  dailyWatchParty?: {
    mediaId: string;
    mediaTitle: string;
    syncStartTime: number;
    initiatorName: string;
  } | null;
}

export const DailyTop10View: React.FC<DailyTop10ViewProps> = ({
  onSelectMedia,
  onOpenMediaBrowser,
  canControl,
  currentMediaId,
  isHost = true,
  onCloseTop10,
  hasActiveMedia = false,
  onStartDailyWatchParty,
  onOpenStreamingAuth,
  dailyWatchParty,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'filme' | 'serie' | 'netflix' | 'disney' | 'prime'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<Top10Entry | null>(null);
  const [partyNotice, setPartyNotice] = useState<string | null>(null);

  // Compute daily top 10 for today
  const dailyData = useMemo(() => getDailyTop10(), []);
  const activeSpotlight = previewItem || dailyData.spotlight;

  // Find the most popular movie of the day (highest ranked movie in the Top 10)
  const mostPopularMovie = useMemo(() => {
    if (dailyData.spotlight.media.kind === 'filme') {
      return dailyData.spotlight.media;
    }
    const topMovie = dailyData.items.find((item) => item.media.kind === 'filme');
    return topMovie ? topMovie.media : dailyData.spotlight.media;
  }, [dailyData]);

  const handleStartDailyWatchParty = (media: MediaItem) => {
    if (!canControl && !isHost) {
      setPartyNotice('Apenas o anfitrião pode iniciar a Daily Watch Party para a sala.');
      setTimeout(() => setPartyNotice(null), 5000);
      return;
    }

    if (onStartDailyWatchParty) {
      onStartDailyWatchParty(media, 5);
    } else {
      onSelectMedia(media);
    }
    if (media.serviceUrl && media.service !== 'youtube' && media.service !== 'direct') {
      window.open(media.serviceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return dailyData.items.filter((entry) => {
      // Type/Service filter
      if (selectedFilter === 'filme' && entry.media.kind !== 'filme') return false;
      if (selectedFilter === 'serie' && entry.media.kind !== 'serie') return false;
      if (selectedFilter === 'netflix' && entry.media.service !== 'netflix') return false;
      if (selectedFilter === 'disney' && entry.media.service !== 'disney') return false;
      if (selectedFilter === 'prime' && entry.media.service !== 'prime') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.media.title.toLowerCase().includes(q);
        const matchesGenre = entry.genre.toLowerCase().includes(q);
        const matchesDesc = (entry.media.description || '').toLowerCase().includes(q);
        return matchesTitle || matchesGenre || matchesDesc;
      }
      return true;
    });
  }, [dailyData.items, selectedFilter, searchQuery]);

  const handlePlay = (media: MediaItem) => {
    onSelectMedia(media);
    if (media.serviceUrl && media.service !== 'youtube' && media.service !== 'direct') {
      window.open(media.serviceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getPlatformBadge = (service?: string) => {
    switch (service) {
      case 'netflix':
        return <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">NETFLIX</span>;
      case 'disney':
        return <span className="bg-blue-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">DISNEY+</span>;
      case 'prime':
        return <span className="bg-sky-500 text-white font-black px-1.5 py-0.5 rounded text-[10px]">PRIME</span>;
      case 'max':
        return <span className="bg-purple-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">MAX</span>;
      case 'crunchyroll':
        return <span className="bg-amber-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">CRUNCHYROLL</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded text-[10px]">CINEMA</span>;
    }
  };

  return (
    <div className="w-full h-full bg-zinc-950 text-white overflow-y-auto overflow-x-hidden flex flex-col scrollbar-thin scrollbar-thumb-zinc-800">
      {/* Top Banner Notice */}
      <div className="bg-linear-to-r from-violet-950 via-zinc-900 to-indigo-950 border-b border-violet-800/30 px-3 sm:px-6 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className="p-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300">
            <Flame className="w-3.5 h-3.5 fill-current text-rose-500 animate-pulse" />
          </span>
          <span className="font-extrabold tracking-wide text-zinc-100 text-[11px] sm:text-xs">
            Top 10 Brasil • Atualiza Diariamente
          </span>
          <span className="hidden md:inline text-zinc-500">•</span>
          <span className="hidden md:flex items-center gap-1 text-[11px] text-zinc-400">
            <Calendar className="w-3 h-3 text-violet-400" />
            {dailyData.dateFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveMedia && onCloseTop10 && (
            <button
              onClick={onCloseTop10}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              <span>Voltar ao Player ▶</span>
            </button>
          )}

          <button
            onClick={onOpenMediaBrowser}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 border border-zinc-700 text-[11px] font-bold text-violet-300 hover:text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Tv className="w-3 h-3 text-violet-400" />
            <span>Catálogo Completo</span>
          </button>
        </div>
      </div>

      {/* Permission alert notice if non-host clicks */}
      {partyNotice && (
        <div className="mx-3 sm:mx-6 mt-2.5 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2 animate-fade-in shrink-0">
          <span className="text-base shrink-0">🔒</span>
          <p className="font-semibold">{partyNotice}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* FEATURE: DAILY WATCH PARTY BANNER                         */}
      {/* Automatically initiates group sync start time for movie   */}
      {/* ======================================================== */}
      <div
        onClick={() => handleStartDailyWatchParty(mostPopularMovie)}
        className="relative mx-3 sm:mx-6 my-2.5 rounded-3xl overflow-hidden border border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-purple-950/70 to-zinc-950 shadow-xl shadow-amber-950/40 cursor-pointer transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20 active:scale-[0.99] group shrink-0"
        title="Clique para iniciar a Daily Watch Party com sincronização em grupo para todos na sala"
      >
        {/* Ambient Gradient Glows */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-500" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-rose-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-rose-600/25 transition-all duration-500" />

        <div className="relative p-3.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
            {/* Movie Thumbnail with Rank Badge */}
            <div className="relative w-16 h-22 sm:w-20 sm:h-26 rounded-2xl overflow-hidden shrink-0 border border-amber-500/40 shadow-lg bg-zinc-950">
              <img
                src={mostPopularMovie.poster}
                alt={mostPopularMovie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-[9px] shadow-sm">
                #1 FILME
              </div>
              <div className="absolute bottom-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white shadow-xs">
                <Play className="w-2.5 h-2.5 fill-current translate-x-0.2" />
              </div>
            </div>

            {/* Banner Information */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white font-extrabold text-[10px] sm:text-xs flex items-center gap-1 shadow-sm tracking-wide">
                  <Flame className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                  <span>DAILY WATCH PARTY DE HOJE</span>
                </span>
                {getPlatformBadge(mostPopularMovie.service)}
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full hidden sm:inline-flex">
                  ⏱️ Sincronização em Grupo Automática
                </span>
              </div>

              <h3 className="text-base sm:text-lg md:text-xl font-black text-white truncate drop-shadow-sm group-hover:text-amber-300 transition">
                {mostPopularMovie.title}
              </h3>

              <p className="text-[11px] sm:text-xs text-zinc-300 line-clamp-1 leading-snug">
                Filme mais popular do dia! Toque para iniciar a sincronização em grupo com contagem regressiva e som estéreo para todos na sala.
              </p>
            </div>
          </div>

          {/* Action Button & Live Status */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-1 md:pt-0">
            {dailyWatchParty && dailyWatchParty.syncStartTime > Date.now() ? (
              <div className="w-full md:w-auto px-5 py-3 rounded-2xl bg-amber-500 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 animate-pulse">
                <Flame className="w-4 h-4 fill-current text-rose-600" />
                <span>Watch Party Iniciando em Grupo...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartDailyWatchParty(mostPopularMovie);
                }}
                disabled={!canControl && !isHost}
                className={`w-full md:w-auto px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer ${
                  canControl || isHost
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 hover:from-amber-400 hover:via-rose-400 hover:to-violet-500 text-white shadow-amber-500/30 ring-1 ring-white/25'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                <span>Iniciar Daily Watch Party</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Spotlight: #1 Trending or Selected Preview */}
      <div className="relative w-full aspect-21/9 sm:aspect-16/7 md:aspect-21/8 min-h-[220px] sm:min-h-[280px] md:min-h-[320px] shrink-0 overflow-hidden bg-zinc-900 border-b border-zinc-800/80">
        {/* Background Image with Heavy Cinematic Gradient */}
        <img
          src={activeSpotlight.media.poster}
          alt={activeSpotlight.media.title}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-60 scale-102 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-zinc-950/60 to-transparent w-full md:w-3/4" />

        {/* Hero Content */}
        <div className="absolute inset-0 p-3.5 sm:p-6 md:p-8 flex flex-col justify-end gap-2 sm:gap-3 max-w-2xl z-10">
          {/* Rank Badge & Trend */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-linear-to-r from-amber-500 to-rose-600 text-white font-extrabold text-[10px] sm:text-xs shadow-lg shadow-rose-900/50">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{activeSpotlight.trendBadge}</span>
            </div>
            {getPlatformBadge(activeSpotlight.media.service)}
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {activeSpotlight.relevance}% Relevância
            </span>
            <span className="text-[10px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded border border-white/10">
              {activeSpotlight.ageRating}
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              {activeSpotlight.year}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md line-clamp-1">
            {activeSpotlight.media.title}
          </h2>

          {/* Genre / Details */}
          <p className="text-[11px] sm:text-xs font-medium text-violet-300/90 line-clamp-1">
            {activeSpotlight.genre}
          </p>

          {/* Description Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed max-w-xl hidden sm:block">
            {activeSpotlight.media.description}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
            <button
              onClick={() => handlePlay(activeSpotlight.media)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-violet-600/40 active:scale-95 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>Assistir Agora na Sala</span>
            </button>

            {activeSpotlight.media.serviceUrl && (
              <a
                href={activeSpotlight.media.serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm transition active:scale-95"
                title="Abrir no site ou app oficial da plataforma"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Link Original</span>
              </a>
            )}

            {onOpenStreamingAuth && activeSpotlight.media.service && (
              <button
                type="button"
                onClick={() => onOpenStreamingAuth(activeSpotlight.media.service as StreamingService, activeSpotlight.media.title)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                title={`Entrar com sua conta ${activeSpotlight.media.service}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Entrar na Conta</span>
              </button>
            )}

            {!canControl && !isHost && (
              <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                <span>🔒 Apenas o anfitrião pode iniciar vídeos na sala</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:px-6 bg-zinc-950/90 border-b border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🔥 Todos (Top 10)
          </button>
          <button
            onClick={() => setSelectedFilter('filme')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'filme'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            🎬 Filmes
          </button>
          <button
            onClick={() => setSelectedFilter('serie')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'serie'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            📺 Séries
          </button>
          <button
            onClick={() => setSelectedFilter('netflix')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'netflix'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Netflix
          </button>
          <button
            onClick={() => setSelectedFilter('disney')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'disney'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Disney+
          </button>
          <button
            onClick={() => setSelectedFilter('prime')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedFilter === 'prime'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Prime Video
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar no Top 10..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
          />
        </div>
      </div>

      {/* Top 10 Ranked List */}
      <div className="flex-1 p-3.5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Ranking Oficial de Hoje</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Escolha qualquer filme ou série para iniciar a transmissão sincronizada com seus amigos
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {filteredItems.length} títulos listados
          </span>
        </div>

        {/* Grid with Big Ranking Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredItems.map((entry) => {
            const isCurrentPlaying = currentMediaId === entry.media.id;
            return (
              <div
                key={entry.media.id}
                onClick={() => setPreviewItem(entry)}
                className={`group relative flex flex-col rounded-2xl bg-zinc-900/80 border overflow-hidden transition-all duration-200 cursor-pointer active:scale-98 ${
                  isCurrentPlaying
                    ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-violet-500'
                    : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                }`}
              >
                {/* Poster Container with Giant Number */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={entry.media.poster}
                    alt={entry.media.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Giant Netflix-style Rank Number */}
                  <span
                    className="absolute -bottom-2 -left-1 font-black text-6xl sm:text-7xl leading-none select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] opacity-95"
                    style={{
                      WebkitTextStroke: '2px rgba(255,255,255,0.7)',
                      color: entry.rank === 1 ? '#e11d48' : entry.rank <= 3 ? '#a855f7' : '#18181b',
                    }}
                  >
                    {entry.rank}
                  </span>

                  {/* Platform Badge Top-Right */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {getPlatformBadge(entry.media.service)}
                  </div>

                  {/* Trend Indicator Top-Left */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-extrabold bg-black/70 backdrop-blur-xs text-white border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>{entry.movementText}</span>
                    </span>
                  </div>

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(entry.media);
                      }}
                      className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition cursor-pointer"
                      title="Assistir agora na sala"
                    >
                      <Play className="w-5 h-5 fill-current translate-x-0.5" />
                    </button>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition">
                      {entry.media.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                      {entry.genre}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(entry.media);
                      }}
                      className="text-violet-400 font-bold hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Assistir</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {onOpenStreamingAuth && entry.media.service && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStreamingAuth(entry.media.service as StreamingService, entry.media.title);
                          }}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700 active:scale-95 transition cursor-pointer flex items-center gap-0.5 text-[9px]"
                          title="Entrar com sua conta deste streaming"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-violet-400" />
                          <span>Entrar</span>
                        </button>
                      )}

                      {entry.media.serviceUrl && (
                        <a
                          href={entry.media.serviceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border border-zinc-700 active:scale-95 transition cursor-pointer flex items-center gap-0.5 text-[9px]"
                          title="Ver no site oficial"
                        >
                          <ExternalLink className="w-2.5 h-2.5 text-rose-500" />
                          <span>Original</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Catalog Discovery Card */}
        <div className="mt-4 p-4 sm:p-6 rounded-3xl bg-linear-to-r from-violet-950/40 via-zinc-900 to-indigo-950/40 border border-violet-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-white">
                Procurando outro filme ou série?
              </h4>
              <p className="text-xs text-zinc-400">
                Acesse o catálogo completo com mais de 25 títulos das principais plataformas ou cole o link de qualquer vídeo da web.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenMediaBrowser}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 whitespace-nowrap active:scale-95 transition cursor-pointer shrink-0"
          >
            Abrir Catálogo Completo →
          </button>
        </div>
      </div>
    </div>
  );
};
