import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Tv,
  ExternalLink,
  Flame,
  Radio,
  Film,
  Zap,
} from 'lucide-react';
import { StreamingService } from '../types';

interface StreamingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: StreamingService;
  title?: string;
  onAuthenticate: (service: StreamingService, email: string, profile: string) => void;
  onContinueAsGuest?: () => void;
  directUrl?: string;
}

interface ServiceConfig {
  name: string;
  tagline: string;
  logo: string;
  brandTitle: string;
  officialUrl: string;
  color: string;
  badge: string;
  border: string;
  bg: string;
  buttonGradient: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  identifierType: 'email' | 'text' | 'url';
  identifierIcon: 'mail' | 'user' | 'zap';
  profileLabel: string;
  profilePlaceholder: string;
  syncFeature: string;
  description: string;
  avatars: string[];
  presetProfiles: string[];
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  netflix: {
    name: 'Netflix',
    tagline: 'Sessão Netflix Watch Party',
    logo: '🍿',
    brandTitle: 'Netflix Oficial',
    officialUrl: 'https://www.netflix.com',
    color: '#E50914',
    badge: 'border-red-500/50 bg-red-600/20 text-red-400',
    border: 'border-red-500/40',
    bg: 'from-red-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500',
    identifierLabel: 'Seu E-mail da Netflix',
    identifierPlaceholder: 'exemplo@netflix.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Nome do seu Perfil Netflix',
    profilePlaceholder: 'Ex: Tiago, Filmes, Principal...',
    syncFeature: 'Sincronização mútua da assinatura Netflix & Companion Sync',
    description: 'Stranger Things, Round 6, Wandinha e filmes em 4K sincronizados com chat de voz.',
    avatars: ['🍿', '😎', '🐱', '👾', '👑'],
    presetProfiles: ['Principal', 'Família', 'Cinema VIP', 'Convidado'],
  },
  prime: {
    name: 'Prime Video',
    tagline: 'Amazon Prime Watch Party',
    logo: '📦',
    brandTitle: 'Amazon Prime Video',
    officialUrl: 'https://www.primevideo.com',
    color: '#00A8E1',
    badge: 'border-sky-500/50 bg-sky-600/20 text-sky-400',
    border: 'border-sky-500/40',
    bg: 'from-sky-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-sky-500 via-blue-600 to-indigo-700 hover:from-sky-400 hover:to-blue-500',
    identifierLabel: 'Seu E-mail da Amazon Prime',
    identifierPlaceholder: 'seuemail@amazon.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Perfil do Prime Video',
    profilePlaceholder: 'Ex: Meu Perfil, Casa, Sala...',
    syncFeature: 'Sincronização de catálogo Prime Video com chat e áudio ao vivo',
    description: 'The Boys, Fallout, O Senhor dos Anéis e sucessos Prime sincronizados sem quedas.',
    avatars: ['📦', '⚡', '🛡️', '🎬', '🚀'],
    presetProfiles: ['Principal', 'Prime Club', 'Amigos'],
  },
  disney: {
    name: 'Disney+',
    tagline: 'Disney+ GroupWatch Oficial',
    logo: '🏰',
    brandTitle: 'Disney+ Stream',
    officialUrl: 'https://www.disneyplus.com',
    color: '#113CCF',
    badge: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
    border: 'border-blue-500/40',
    bg: 'from-blue-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-blue-600 via-indigo-600 to-violet-700 hover:from-blue-500 hover:to-indigo-500',
    identifierLabel: 'Seu E-mail do Disney+',
    identifierPlaceholder: 'seuemail@disneyplus.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Nome do seu Perfil Disney+',
    profilePlaceholder: 'Ex: Marvel Fan, Star Wars, Tiago...',
    syncFeature: 'Marvel, Star Wars, Pixar e clássicos Disney com áudio HD sincronizado',
    description: 'Deadpool & Wolverine, Loki, Avatar e sucessos do cinema com chamadas de voz estéreo.',
    avatars: ['🏰', '🦸‍♂️', '🚀', '🦁', '⭐'],
    presetProfiles: ['Perfil Principal', 'Marvel Squad', 'Star Wars Team'],
  },
  max: {
    name: 'Max (HBO)',
    tagline: 'Max HBO Watch Party',
    logo: '🐉',
    brandTitle: 'Max (HBO)',
    officialUrl: 'https://www.max.com',
    color: '#5822B4',
    badge: 'border-purple-500/50 bg-purple-600/20 text-purple-400',
    border: 'border-purple-500/40',
    bg: 'from-purple-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-purple-600 via-violet-600 to-indigo-700 hover:from-purple-500 hover:to-violet-500',
    identifierLabel: 'Seu E-mail de Assinante Max',
    identifierPlaceholder: 'seuemail@max.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Perfil Max / HBO',
    profilePlaceholder: 'Ex: Tiago HBO, Westeros, Principal...',
    syncFeature: 'Sincronia de episódios HBO, Warner e DC com áudio estéreo nativo',
    description: 'The Last of Us, House of the Dragon e sucessos da HBO sincronizados com a galera.',
    avatars: ['🐉', '👑', '🛡️', '🍿', '🔥'],
    presetProfiles: ['Perfil Principal', 'Casa', 'HBO Cinema'],
  },
  crunchyroll: {
    name: 'Crunchyroll Anime',
    tagline: 'Crunchyroll Anime Rave',
    logo: '🍙',
    brandTitle: 'Crunchyroll Oficial',
    officialUrl: 'https://www.crunchyroll.com',
    color: '#FF6400',
    badge: 'border-amber-500/50 bg-amber-600/20 text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-orange-500',
    identifierLabel: 'Usuário ou E-mail Crunchyroll',
    identifierPlaceholder: 'otaku_user@crunchyroll.com',
    identifierType: 'text',
    identifierIcon: 'user',
    profileLabel: 'Nome do Perfil Otaku',
    profilePlaceholder: 'Ex: Nakama, Mugiwara, Tiago...',
    syncFeature: 'Sincronização de legendas, episódios em simulcast e voz simultânea',
    description: 'One Piece, Jujutsu Kaisen, Demon Slayer e centenas de animes sincronizados sem delay.',
    avatars: ['🍙', '🍥', '⚔️', '🍜', '🦊'],
    presetProfiles: ['Mugiwara', 'Otaku Principal', 'Anime Club'],
  },
  youtube: {
    name: 'YouTube',
    tagline: 'YouTube Party & Music',
    logo: '▶️',
    brandTitle: 'YouTube Oficial',
    officialUrl: 'https://www.youtube.com',
    color: '#FF0000',
    badge: 'border-rose-500/50 bg-rose-600/20 text-rose-400',
    border: 'border-rose-500/40',
    bg: 'from-rose-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-rose-500',
    identifierLabel: 'Sua Conta Google / YouTube',
    identifierPlaceholder: 'seuemail@gmail.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Nome de Exibição / Canal',
    profilePlaceholder: 'Ex: Meu Canal, Música, Tiago...',
    syncFeature: 'Qualquer vídeo, clipe ou live do YouTube reproduzido e sincronizado sem anúncios',
    description: 'Assista a trailers, clipes musicais, podcasts e transmissões ao vivo do YouTube.',
    avatars: ['▶️', '🎧', '🔥', '👾', '🚀'],
    presetProfiles: ['Meu Canal', 'YouTube Music', 'Lives'],
  },
  twitch: {
    name: 'Twitch TV',
    tagline: 'Twitch Live Stream Rave',
    logo: '👾',
    brandTitle: 'Twitch TV',
    officialUrl: 'https://www.twitch.tv',
    color: '#9146FF',
    badge: 'border-purple-500/50 bg-purple-600/20 text-purple-300',
    border: 'border-purple-500/40',
    bg: 'from-purple-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500',
    identifierLabel: 'Seu Nome de Usuário Twitch',
    identifierPlaceholder: 'twitch_viewer',
    identifierType: 'text',
    identifierIcon: 'user',
    profileLabel: 'Apelido no Chat Twitch',
    profilePlaceholder: 'Ex: GamerPro, TiagoTV...',
    syncFeature: 'Transmissões ao vivo sincronizadas com latência ultra-baixa e bate-papo de voz',
    description: 'Acompanhe seus streamers e campeonatos favoritos de games juntos sem atraso.',
    avatars: ['👾', '🎮', '🎧', '💜', '🔥'],
    presetProfiles: ['Gamer', 'Twitch Viewer', 'Chat VIP'],
  },
  drive: {
    name: 'Google Drive',
    tagline: 'Google Drive Cloud Watch Party',
    logo: '📁',
    brandTitle: 'Google Drive / Nuvem',
    officialUrl: 'https://drive.google.com',
    color: '#F4B400',
    badge: 'border-amber-500/50 bg-amber-600/20 text-amber-400',
    border: 'border-amber-500/40',
    bg: 'from-amber-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-amber-500 via-yellow-600 to-amber-700 hover:from-amber-400 hover:to-yellow-500',
    identifierLabel: 'Sua Conta Google / Gmail',
    identifierPlaceholder: 'seuemail@gmail.com',
    identifierType: 'email',
    identifierIcon: 'mail',
    profileLabel: 'Nome do Usuário Google Drive',
    profilePlaceholder: 'Ex: Meu Drive, Cinema Cloud, Tiago...',
    syncFeature: 'Arquivos de vídeo MP4 e MKV salvos no Google Drive transmitidos em alta velocidade',
    description: 'Assista a vídeos pessoais, filmes e séries armazenados na nuvem sincronizados com som estéreo.',
    avatars: ['📁', '☁️', '⚡', '🎬', '🌟'],
    presetProfiles: ['Meu Drive', 'Nuvem Compartilhada', 'VIP Cloud'],
  },
  direct: {
    name: 'Cinema 4K / Web Stream',
    tagline: 'Direct HLS & 4K Cinema',
    logo: '⚡',
    brandTitle: 'Cinema 4K Direct',
    officialUrl: 'https://commondatastorage.googleapis.com',
    color: '#10B981',
    badge: 'border-emerald-500/50 bg-emerald-600/20 text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500',
    identifierLabel: 'Nome de Identificação da Sessão',
    identifierPlaceholder: 'cinema_4k_user@rave',
    identifierType: 'text',
    identifierIcon: 'zap',
    profileLabel: 'Nome do Espectador',
    profilePlaceholder: 'Ex: Cinema 4K, Sala Principal...',
    syncFeature: 'Vídeos abertos em alta definição, streams HLS .m3u8 e som surround estéreo nativo',
    description: 'Filmes em 4K e transmissões abertas de alta fidelidade sem necessidade de login pago.',
    avatars: ['⚡', '🎬', '🍿', '🎧', '🌟'],
    presetProfiles: ['Cinema 4K', 'Sala de Estreia', 'VIP'],
  },
  screenshare: {
    name: 'Transmitir Aba (Rave Co-Stream)',
    tagline: 'Rave Co-Stream Oficial',
    logo: '🖥️',
    brandTitle: 'Co-Stream Rave',
    officialUrl: 'https://www.netflix.com',
    color: '#8B5CF6',
    badge: 'border-violet-500/50 bg-violet-600/20 text-violet-300',
    border: 'border-violet-500/40',
    bg: 'from-violet-950/80 via-zinc-900 to-zinc-950',
    buttonGradient: 'from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-purple-500',
    identifierLabel: 'Identificação do Transmissor',
    identifierPlaceholder: 'anfitriao_rave',
    identifierType: 'text',
    identifierIcon: 'zap',
    profileLabel: 'Dispositivo / Navegador',
    profilePlaceholder: 'Ex: Chrome PC, Mac, Navegador...',
    syncFeature: 'Transmita a aba do seu navegador com áudio do sistema direto para o celular dos convidados',
    description: 'Espelhamento direto de streamings protegidos com som HD sem tela preta.',
    avatars: ['🖥️', '🔊', '⚡', '🍿', '🚀'],
    presetProfiles: ['PC Principal', 'Transmissor 60FPS'],
  },
};

export const StreamingAuthModal: React.FC<StreamingAuthModalProps> = ({
  isOpen,
  onClose,
  service,
  title,
  onAuthenticate,
  onContinueAsGuest,
  directUrl,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [profileName, setProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🍿');
  const [pin, setPin] = useState('');
  const [rememberAccount, setRememberAccount] = useState(true);

  if (!isOpen) return null;

  const validKey = (service && SERVICE_CONFIGS[service]) ? service : 'netflix';
  const config = SERVICE_CONFIGS[validKey];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalIdentifier = identifier.trim() || `${validKey}_user@rave.sync`;
    const finalProfile = profileName.trim() || 'Principal';

    onAuthenticate(
      validKey as StreamingService,
      finalIdentifier,
      `${selectedAvatar} ${finalProfile}`
    );
    onClose();
  };

  const handleApplyPreset = (preset: string) => {
    setProfileName(preset);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden pb-safe animate-scale-up max-h-[92dvh] overflow-y-auto">
        {/* Ambient Top Glow with Official Service Gradient */}
        <div className={`p-5 sm:p-6 bg-gradient-to-b ${config.bg} border-b border-zinc-800 flex flex-col items-center text-center gap-2 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl shadow-xl shadow-black/60 relative">
            <span>{config.logo}</span>
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900"
              style={{ backgroundColor: config.color }}
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${config.badge}`}>
                {config.brandTitle}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Rave Sync
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1.5 tracking-tight">
              Conectar sua conta {config.name}
            </h3>
            {title ? (
              <p className="text-xs text-zinc-300 font-medium line-clamp-1 mt-0.5">
                Para assistir &ldquo;<strong className="text-white">{title}</strong>&rdquo; sincronizado
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {config.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Feature Banner Info */}
        <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{config.syncFeature}</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-3.5 text-zinc-200">
          {/* Main Identifier Input (Email / Username) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {config.identifierIcon === 'mail' ? (
                  <Mail className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{config.identifierLabel}</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Identificação na sala</span>
            </label>
            <input
              type={config.identifierType}
              required
              autoFocus
              placeholder={config.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
            />
            <span className="text-[10px] text-zinc-400">
              Insira seus dados para sincronizar a reprodução com áudio e chat em tempo real.
            </span>
          </div>

          {/* Profile Name & Avatar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{config.profileLabel}</span>
            </label>
            <input
              type="text"
              placeholder={config.profilePlaceholder}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 transition"
            />

            {/* Quick Profile Chips */}
            {config.presetProfiles && config.presetProfiles.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
                <span className="text-[10px] text-zinc-500 font-medium shrink-0">Atalhos:</span>
                {config.presetProfiles.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer shrink-0"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Avatar Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-zinc-400">Avatar do Perfil</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {config.avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-all active:scale-95 cursor-pointer ${
                    selectedAvatar === av
                      ? 'border-violet-500 bg-violet-600/30 scale-105 shadow-md shadow-violet-500/30 ring-1 ring-violet-500'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Optional PIN / Security */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>PIN / Senha de Perfil (Opcional)</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Apenas local</span>
            </label>
            <input
              type="password"
              maxLength={8}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 tracking-widest"
            />
          </div>

          {/* Remember Account Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 pt-0.5">
            <input
              type="checkbox"
              checked={rememberAccount}
              onChange={(e) => setRememberAccount(e.target.checked)}
              className="w-4 h-4 rounded-md accent-violet-600 bg-zinc-950 border-zinc-700"
            />
            <span>Lembrar minha conta {config.name} neste aparelho</span>
          </label>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className={`w-full py-3 rounded-2xl bg-gradient-to-r ${config.buttonGradient} text-white font-extrabold text-sm shadow-xl active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer`}
            >
              <span>Autenticar & Entrar na Sessão</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Official App / Website Link */}
            {config.officialUrl && (
              <a
                href={directUrl || config.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Abrir no site ou app oficial da {config.name}</span>
              </a>
            )}

            {onContinueAsGuest && (
              <button
                type="button"
                onClick={() => {
                  onContinueAsGuest();
                  onClose();
                }}
                className="w-full py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Continuar sem conta (Assistir como Convidado)
              </button>
            )}
          </div>
        </form>

        {/* Security Footer Notice */}
        <div className="p-3 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sincronia estilo Rave: Dados protegidos no seu navegador</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">SyncRave v2.5</span>
        </div>
      </div>
    </div>
  );
};
