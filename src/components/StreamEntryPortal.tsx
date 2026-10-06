import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  ExternalLink,
  ShieldCheck,
  Check,
  User,
  ArrowRight,
  Monitor,
  Flame,
  Film,
  Tv,
  LogOut,
  ChevronLeft,
  Copy,
} from 'lucide-react';
import { MediaItem, StreamingService, ConnectedStreamingAccount } from '../types';
import { resolveStreamingMedia } from '../utils/streamingResolver';

export interface StreamPortalConfig {
  id: StreamingService;
  name: string;
  tagline: string;
  logo: string;
  brandTitle: string;
  officialUrl: string;
  color: string;
  badge: string;
  border: string;
  bgGradient: string;
  buttonGradient: string;
  inputPlaceholder: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  profilePresets: string[];
  avatars: string[];
  description: string;
  antiDrmTip: string;
}

export const STREAM_PORTAL_CONFIGS: Record<string, StreamPortalConfig> = {
  netflix: {
    id: 'netflix',
    name: 'Netflix',
    tagline: 'Sessão Oficial Netflix Watch Party',
    logo: '🍿',
    brandTitle: 'Netflix Oficial',
    officialUrl: 'https://www.netflix.com',
    color: '#E50914',
    badge: 'border-red-500/50 bg-red-600/20 text-red-400',
    border: 'border-red-500/40',
    bgGradient: 'from-red-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500',
    inputPlaceholder: 'https://www.netflix.com/watch/... ou nome do filme',
    identifierLabel: 'Seu E-mail da Netflix',
    identifierPlaceholder: 'exemplo@netflix.com',
    profilePresets: ['Principal', 'Família', 'Cinema VIP', 'Convidado'],
    avatars: ['🍿', '😎', '🐱', '👾', '👑'],
    description: 'Stranger Things, Round 6, Wandinha e filmes em 4K sincronizados com chat de voz em tempo real.',
    antiDrmTip: 'Para celulares: o anfitrião pode transmitir a aba da Netflix logada pelo botão "Transmitir Tela" com som estéreo do sistema sem tela preta.',
  },
  prime: {
    id: 'prime',
    name: 'Prime Video',
    tagline: 'Amazon Prime Watch Party Oficial',
    logo: '📦',
    brandTitle: 'Amazon Prime Video',
    officialUrl: 'https://www.primevideo.com',
    color: '#00A8E1',
    badge: 'border-sky-500/50 bg-sky-600/20 text-sky-400',
    border: 'border-sky-500/40',
    bgGradient: 'from-sky-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-sky-500 via-blue-600 to-indigo-700 hover:from-sky-400 hover:to-blue-500',
    inputPlaceholder: 'https://www.primevideo.com/detail/... ou pesquise',
    identifierLabel: 'Seu E-mail da Amazon Prime',
    identifierPlaceholder: 'seuemail@amazon.com',
    profilePresets: ['Principal', 'Prime VIP', 'Casa', 'Cinema Club'],
    avatars: ['📦', '⚡', '🛡️', '🎬', '🚀'],
    description: 'The Boys, Fallout, O Senhor dos Anéis, Invencível e Reacher sincronizados com voz estéreo.',
    antiDrmTip: 'Catálogo Prime sincronizado mutuamente entre os membros com chat e companion sync estilo Rave.',
  },
  disney: {
    id: 'disney',
    name: 'Disney+',
    tagline: 'Disney+ GroupWatch Oficial',
    logo: '🏰',
    brandTitle: 'Disney+ Stream',
    officialUrl: 'https://www.disneyplus.com',
    color: '#113CCF',
    badge: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
    border: 'border-blue-500/40',
    bgGradient: 'from-blue-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-500 hover:to-indigo-500',
    inputPlaceholder: 'https://www.disneyplus.com/movies/... ou /series/...',
    identifierLabel: 'Seu E-mail Disney+',
    identifierPlaceholder: 'seuemail@disneyplus.com',
    profilePresets: ['Marvel Fan', 'Star Wars', 'Disney Club', 'Principal'],
    avatars: ['🏰', '🦸‍♂️', '🚀', '🦁', '⭐'],
    description: 'Deadpool & Wolverine, Avatar 2, Divertida Mente 2, The Mandalorian e clássicos Disney sincronizados.',
    antiDrmTip: 'Filmes Marvel, Pixar e Star Wars com sincronização instantânea de reprodução e microfones abertos.',
  },
  max: {
    id: 'max',
    name: 'Max (HBO)',
    tagline: 'Max HBO Watch Party Oficial',
    logo: '🐉',
    brandTitle: 'Max (HBO Oficial)',
    officialUrl: 'https://www.max.com',
    color: '#5822B4',
    badge: 'border-purple-500/50 bg-purple-600/20 text-purple-400',
    border: 'border-purple-500/40',
    bgGradient: 'from-purple-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-purple-600 via-violet-600 to-indigo-700 hover:from-purple-500 hover:to-violet-500',
    inputPlaceholder: 'https://www.max.com/shows/... ou /movies/...',
    identifierLabel: 'Seu E-mail Max HBO',
    identifierPlaceholder: 'seuemail@max.com',
    profilePresets: ['Westeros', 'HBO Family', 'Cinema VIP', 'Principal'],
    avatars: ['🐉', '👑', '🛡️', '🍿', '🔥'],
    description: 'The Last of Us, A Casa do Dragão, Duna: Parte 2 e Batman em alta definição sincronizados.',
    antiDrmTip: 'Sincronização de produções HBO com equalização de som surround e reprodução coletiva contínua.',
  },
  crunchyroll: {
    id: 'crunchyroll',
    name: 'Crunchyroll Anime',
    tagline: 'Crunchyroll Anime Rave Oficial',
    logo: '🍙',
    brandTitle: 'Crunchyroll Anime',
    officialUrl: 'https://www.crunchyroll.com',
    color: '#FF6400',
    badge: 'border-amber-500/50 bg-amber-600/20 text-amber-400',
    border: 'border-amber-500/40',
    bgGradient: 'from-amber-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-orange-500',
    inputPlaceholder: 'https://www.crunchyroll.com/series/... ou nome do anime',
    identifierLabel: 'Usuário ou E-mail Crunchyroll',
    identifierPlaceholder: 'otaku_user@crunchyroll.com',
    profilePresets: ['Mugiwara', 'Otaku Club', 'Anime VIP', 'Principal'],
    avatars: ['🍙', '🍥', '⚔️', '🍜', '🦊'],
    description: 'One Piece (Gear 5), Jujutsu Kaisen, Demon Slayer e Solo Leveling com legendas e voz sincronizadas.',
    antiDrmTip: 'Episódios em simulcast com sincronização rápida de legendas e sem delay no bate-papo de voz.',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'YouTube Party & Music Live',
    logo: '▶️',
    brandTitle: 'YouTube Oficial',
    officialUrl: 'https://www.youtube.com',
    color: '#FF0000',
    badge: 'border-rose-500/50 bg-rose-600/20 text-rose-400',
    border: 'border-rose-500/40',
    bgGradient: 'from-rose-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500',
    inputPlaceholder: 'https://www.youtube.com/watch?v=... ou pesquise clipes/lives',
    identifierLabel: 'Sua Conta Google / Canal YouTube',
    identifierPlaceholder: 'seuemail@gmail.com',
    profilePresets: ['Meu Canal', 'YouTube Music', 'Lives', 'Principal'],
    avatars: ['▶️', '🎧', '🔥', '👾', '🚀'],
    description: 'Trailers em 4K, clipes musicais, podcasts e transmissões ao vivo sincronizados sem anúncios.',
    antiDrmTip: 'Sincronização direta por ID de vídeo com compensação de drift em milissegundos para todos na sala.',
  },
  twitch: {
    id: 'twitch',
    name: 'Twitch TV',
    tagline: 'Twitch Live Stream Rave',
    logo: '👾',
    brandTitle: 'Twitch TV',
    officialUrl: 'https://www.twitch.tv',
    color: '#9146FF',
    badge: 'border-purple-500/50 bg-purple-600/20 text-purple-300',
    border: 'border-purple-500/40',
    bgGradient: 'from-purple-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500',
    inputPlaceholder: 'https://www.twitch.tv/nomedocanal ou canal',
    identifierLabel: 'Seu Nome de Usuário Twitch',
    identifierPlaceholder: 'twitch_viewer',
    profilePresets: ['GamerPro', 'Twitch Viewer', 'Tribo Gaules', 'Chatter VIP'],
    avatars: ['👾', '🎮', '🎧', '💜', '🔥'],
    description: 'Transmissões de games, campeonatos de CS2 e lives ao vivo com latência ultra-baixa.',
    antiDrmTip: 'Streams ao vivo com chat de voz Rave integrado para vibrar e torcer juntos com os streamers.',
  },
  drive: {
    id: 'drive',
    name: 'Google Drive',
    tagline: 'Google Drive Cloud Watch Party',
    logo: '📁',
    brandTitle: 'Google Drive / Nuvem',
    officialUrl: 'https://drive.google.com',
    color: '#F4B400',
    badge: 'border-amber-500/50 bg-amber-600/20 text-amber-400',
    border: 'border-amber-500/40',
    bgGradient: 'from-amber-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-amber-500 via-yellow-600 to-amber-700 hover:from-amber-400 hover:to-yellow-500',
    inputPlaceholder: 'Link de arquivo MP4 no Google Drive ou Google Cloud',
    identifierLabel: 'Sua Conta Google / Gmail',
    identifierPlaceholder: 'seuemail@gmail.com',
    profilePresets: ['Meu Drive', 'Nuvem Compartilhada', 'VIP Cloud', 'Principal'],
    avatars: ['📁', '☁️', '⚡', '🎬', '🌟'],
    description: 'Vídeos pessoais, curtas e filmes salvos no Google Drive transmitidos em alta velocidade.',
    antiDrmTip: 'Carregamento veloz na nuvem com buffer de alta taxa de bits e decodificação acelerada por hardware.',
  },
  direct: {
    id: 'direct',
    name: 'Cinema 4K / Web Stream',
    tagline: 'Direct HLS & 4K Cinema',
    logo: '⚡',
    brandTitle: 'Cinema 4K Direct',
    officialUrl: 'https://commondatastorage.googleapis.com',
    color: '#10B981',
    badge: 'border-emerald-500/50 bg-emerald-600/20 text-emerald-400',
    border: 'border-emerald-500/40',
    bgGradient: 'from-emerald-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500',
    inputPlaceholder: 'Link .m3u8 HLS ou arquivo de vídeo .mp4',
    identifierLabel: 'Identificação da Sessão',
    identifierPlaceholder: 'cinema_4k_user@rave',
    profilePresets: ['Cinema 4K', 'Sala de Estreia', 'VIP Direct'],
    avatars: ['⚡', '🎬', '🍿', '🎧', '🌟'],
    description: 'Filmes completos em 4K e transmissões adaptativas HLS multibitrate com som surround.',
    antiDrmTip: 'Streams abertos sem DRM com compatibilidade total em todos os navegadores, iPhones e Androids.',
  },
};

interface StreamEntryPortalProps {
  service: StreamingService;
  titles: MediaItem[];
  currentMediaId?: string;
  connectedAccount?: ConnectedStreamingAccount;
  onSelectMedia: (media: MediaItem) => void;
  onOpenStreamingAuth: (service: StreamingService, title?: string) => void;
  onConnectAccount?: (service: StreamingService, email: string, profile: string) => void;
  onDisconnectAccount?: (service: StreamingService) => void;
  onStartScreenShare: () => Promise<void>;
  onOpenDrmHelper?: () => void;
  onBackToAll?: () => void;
  hasPermission?: boolean;
}

export const StreamEntryPortal: React.FC<StreamEntryPortalProps> = ({
  service,
  titles,
  currentMediaId,
  connectedAccount,
  onSelectMedia,
  onOpenStreamingAuth,
  onConnectAccount,
  onDisconnectAccount,
  onStartScreenShare,
  onOpenDrmHelper,
  onBackToAll,
  hasPermission = true,
}) => {
  const config = STREAM_PORTAL_CONFIGS[service] || STREAM_PORTAL_CONFIGS['netflix'];

  // Quick URL Input
  const [streamUrl, setStreamUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [autoOpenOfficial, setAutoOpenOfficial] = useState(true);

  // Quick In-Portal Profile Connect State
  const [quickProfileName, setQuickProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(config.avatars[0] || '🍿');
  const [isQuickConnecting, setIsQuickConnecting] = useState(false);

  // Filter movies and series for this service
  const movies = titles.filter(
    (t) => t.service === service && (t.kind === 'filme' || !t.kind)
  );
  const series = titles.filter(
    (t) => t.service === service && t.kind === 'serie'
  );

  const handleChooseTitle = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectMedia(item);
    if (autoOpenOfficial && item.serviceUrl && item.service !== 'youtube' && item.service !== 'direct') {
      window.open(item.serviceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLaunchCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;
    const resolved = resolveStreamingMedia(streamUrl.trim(), customTitle.trim());
    if (resolved.service !== service) {
      resolved.service = service;
    }
    onSelectMedia(resolved);
    const linkToOpen = resolved.serviceUrl || resolved.url;
    if (autoOpenOfficial && linkToOpen && resolved.service !== 'youtube' && resolved.service !== 'direct') {
      window.open(linkToOpen, '_blank', 'noopener,noreferrer');
    }
  };

  const handleQuickConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile = quickProfileName.trim() || config.profilePresets[0] || 'Principal';
    const fakeEmail = `${config.id}_user@rave.sync`;
    if (onConnectAccount) {
      onConnectAccount(service, fakeEmail, `${selectedAvatar} ${finalProfile}`);
      setIsQuickConnecting(false);
    } else {
      onOpenStreamingAuth(service);
    }
  };

  const handleCopy = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in text-zinc-100">
      {/* ======================================================== */}
      {/* 1. HERO BANNER: BRAND IDENTITY & RAVE ENTRY PORTAL       */}
      {/* ======================================================== */}
      <div
        className={`relative rounded-3xl p-4 sm:p-6 bg-gradient-to-b ${config.bgGradient} border ${config.border} shadow-2xl overflow-hidden`}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: config.color }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Back to all streams button if provided */}
            {onBackToAll && (
              <button
                type="button"
                onClick={onBackToAll}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60 transition active:scale-95 cursor-pointer shrink-0"
                title="Voltar a todos os streams"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Glowing Brand Logo */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shrink-0 relative"
              style={{ boxShadow: `0 0 25px ${config.color}33` }}
            >
              <span>{config.logo}</span>
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 animate-pulse"
                style={{ backgroundColor: config.color }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                  {config.brandTitle}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Rave Sync
                </span>
                <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                  Modelo Rave.io
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white mt-1 tracking-tight">
                Modelo de Entrada {config.name}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium line-clamp-1 mt-0.5">
                {config.tagline}
              </p>
            </div>
          </div>

          {/* Account Status / Auth Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {connectedAccount?.isConnected ? (
              <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-zinc-950/90 border border-emerald-500/40 shadow-lg">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 font-black" />
                </div>
                <div className="text-left min-w-0 pr-1">
                  <div className="text-[11px] font-extrabold text-white truncate">
                    {connectedAccount.profileName || 'Perfil Conectado'}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono truncate">
                    Conta Ativa & Sincronizada
                  </div>
                </div>
                {onDisconnectAccount && (
                  <button
                    type="button"
                    onClick={() => onDisconnectAccount(service)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                    title="Desconectar conta deste aparelho"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenStreamingAuth(service)}
                className={`px-4 py-2.5 rounded-2xl bg-gradient-to-r ${config.buttonGradient} text-white font-extrabold text-xs shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Conectar Conta {config.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Official External Link */}
            {config.officialUrl && (
              <a
                href={config.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                title={`Abrir site oficial da ${config.name}`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Site Oficial</span>
              </a>
            )}
          </div>
        </div>

        {/* Feature description & Anti-DRM pill */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="line-clamp-2">{config.description}</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="line-clamp-2 text-[11px]">{config.antiDrmTip}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ENTRADA RÁPIDA DE PERFIL / CONTA (O modelo que deu certo)*/}
      {/* ======================================================== */}
      {!connectedAccount?.isConnected && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Identificação do Perfil {config.name} na Sala
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">
              Igual ao Netflix Rave
            </span>
          </div>

          <form onSubmit={handleQuickConnect} className="flex flex-col sm:flex-row items-center gap-2">
            {/* Avatar Selector */}
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
              {config.avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? 'border-violet-500 bg-violet-600/30 scale-105 ring-1 ring-violet-500'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            {/* Profile Input */}
            <input
              type="text"
              placeholder={`Nome do seu Perfil (Ex: ${config.profilePresets[0] || 'Principal'})`}
              value={quickProfileName}
              onChange={(e) => setQuickProfileName(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 w-full"
            />

            {/* Preset chips */}
            <div className="hidden lg:flex items-center gap-1 shrink-0">
              {config.profilePresets.slice(0, 3).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuickProfileName(preset)}
                  className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Submit quick profile */}
            <button
              type="submit"
              className={`w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r ${config.buttonGradient} text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0`}
            >
              Salvar Perfil {config.name}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BARRA DE ENTRADA DE LINK / URL ESPECÍFICA DO STREAM   */}
      {/* ======================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4" style={{ color: config.color }} />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Colar Link de Vídeo da {config.name}
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {config.officialUrl}
          </span>
        </div>

        <form onSubmit={handleLaunchCustomUrl} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder={config.inputPlaceholder}
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
          />
          <input
            type="text"
            placeholder="Título personalizado (opcional)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="w-full sm:w-44 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
          />
          <button
            type="submit"
            className={`w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r ${config.buttonGradient} text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Transmitir no Cinema</span>
          </button>
        </form>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={autoOpenOfficial}
              onChange={(e) => setAutoOpenOfficial(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium">
              Abrir o vídeo escolhido diretamente na <strong className="text-white">{config.name}</strong> ao selecionar (Modo Rave)
            </span>
          </label>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SUBSEÇÕES DE CATÁLOGO OFICIAL: FILMES & SÉRIES       */}
      {/* ======================================================== */}
      {/* Filmes da Plataforma */}
      {movies.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4" style={{ color: config.color }} />
              <span>Filmes em Alta na {config.name}</span>
            </span>
            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-mono">
              {movies.length} Filmes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {movies.map((item) => {
              const isSelected = item.id === currentMediaId;
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleChooseTitle(item, e)}
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
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                      <span style={{ color: config.color }} className="font-black">
                        {config.name}
                      </span>
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition"
                        style={{ backgroundColor: config.color }}
                      >
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
                            title={`Assistir original na ${config.name}`}
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                            <span>Original</span>
                          </a>
                        )}
                        <span
                          className="font-bold flex items-center gap-0.5 text-xs"
                          style={{ color: config.color }}
                        >
                          Assistir Filme →
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

      {/* Séries & Episódios da Plataforma */}
      {series.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
            <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <Tv className="w-4 h-4" style={{ color: config.color }} />
              <span>Séries & Episódios na {config.name}</span>
            </span>
            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-mono">
              {series.length} Séries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {series.map((item) => {
              const isSelected = item.id === currentMediaId;
              return (
                <div
                  key={item.id}
                  onClick={(e) => handleChooseTitle(item, e)}
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
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                      <span style={{ color: config.color }} className="font-black">
                        {config.name}
                      </span>
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition"
                        style={{ backgroundColor: config.color }}
                      >
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
                            title={`Assistir original na ${config.name}`}
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                            <span>Original</span>
                          </a>
                        )}
                        <span
                          className="font-bold flex items-center gap-0.5 text-xs"
                          style={{ color: config.color }}
                        >
                          Assistir Série →
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

      {/* ======================================================== */}
      {/* 5. CO-STREAM & ANTI-DRM ACTION CALLOUT                   */}
      {/* ======================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Transmitir {config.name} com Áudio do Computador</span>
              <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-mono">
                60 FPS
              </span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">
              Compartilhe a aba da {config.name} com os amigos no celular ouvindo e assistindo em tempo real sem bloqueios DRM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenDrmHelper && (
            <button
              type="button"
              onClick={onOpenDrmHelper}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold text-xs transition cursor-pointer"
            >
              Ajuda DRM
            </button>
          )}
          <button
            type="button"
            onClick={onStartScreenShare}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Transmitir Aba</span>
          </button>
        </div>
      </div>
    </div>
  );
};
