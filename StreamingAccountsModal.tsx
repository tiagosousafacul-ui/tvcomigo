import React, { useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  Monitor,
  ExternalLink,
  UserCheck,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { ConnectedStreamingAccount, StreamingService } from '../types';
import { StreamingAuthModal } from './StreamingAuthModal';

interface StreamingAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Record<string, ConnectedStreamingAccount>;
  onConnectAccount: (service: StreamingService, email: string, profile: string) => void;
  onDisconnectAccount: (service: StreamingService) => void;
  onStartCoStream: () => Promise<void>;
}

export const StreamingAccountsModal: React.FC<StreamingAccountsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onConnectAccount,
  onDisconnectAccount,
  onStartCoStream,
}) => {
  const [authServiceTarget, setAuthServiceTarget] = useState<StreamingService | null>(null);

  if (!isOpen) return null;

  const servicesList: Array<{
    id: StreamingService;
    name: string;
    logo: string;
    color: string;
    badgeColor: string;
    url: string;
    category: string;
    description: string;
  }> = [
    {
      id: 'netflix',
      name: 'Netflix',
      logo: '🍿',
      color: '#E50914',
      badgeColor: 'border-red-500/40 bg-red-600/20 text-red-400',
      url: 'https://www.netflix.com',
      category: 'Filmes & Séries',
      description: 'Stranger Things, Round 6, Wandinha e filmes em 4K',
    },
    {
      id: 'prime',
      name: 'Prime Video',
      logo: '📦',
      color: '#00A8E1',
      badgeColor: 'border-sky-500/40 bg-sky-600/20 text-sky-400',
      url: 'https://www.primevideo.com',
      category: 'Amazon Originals',
      description: 'The Boys, Fallout, O Senhor dos Anéis e sucessos Prime',
    },
    {
      id: 'disney',
      name: 'Disney+',
      logo: '🏰',
      color: '#113CCF',
      badgeColor: 'border-blue-500/40 bg-blue-600/20 text-blue-400',
      url: 'https://www.disneyplus.com',
      category: 'Marvel & Star Wars',
      description: 'Deadpool & Wolverine, Loki, Avatar e clássicos Disney',
    },
    {
      id: 'max',
      name: 'Max (HBO)',
      logo: '🐉',
      color: '#5822B4',
      badgeColor: 'border-purple-500/40 bg-purple-600/20 text-purple-400',
      url: 'https://www.max.com',
      category: 'HBO & Warner',
      description: 'The Last of Us, House of the Dragon e sucessos da HBO',
    },
    {
      id: 'crunchyroll',
      name: 'Crunchyroll Anime',
      logo: '🍙',
      color: '#FF6400',
      badgeColor: 'border-amber-500/40 bg-amber-600/20 text-amber-400',
      url: 'https://www.crunchyroll.com',
      category: 'Anime Simulcast',
      description: 'One Piece, Jujutsu Kaisen e animes com legendas sincronizadas',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      logo: '▶️',
      color: '#FF0000',
      badgeColor: 'border-rose-500/40 bg-rose-600/20 text-rose-400',
      url: 'https://www.youtube.com',
      category: 'Vídeos & Músicas',
      description: 'Vídeos, clipes musicais e podcasts sincronizados',
    },
    {
      id: 'twitch',
      name: 'Twitch TV',
      logo: '👾',
      color: '#9146FF',
      badgeColor: 'border-purple-500/40 bg-purple-600/20 text-purple-300',
      url: 'https://www.twitch.tv',
      category: 'Lives & Games',
      description: 'Transmissões ao vivo sincronizadas com delay ultra-baixo',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      logo: '📁',
      color: '#F4B400',
      badgeColor: 'border-amber-500/40 bg-amber-600/20 text-amber-400',
      url: 'https://drive.google.com',
      category: 'Nuvem & Vídeos MP4',
      description: 'Vídeos e filmes salvos no Google Drive em alta velocidade',
    },
    {
      id: 'direct',
      name: 'Cinema 4K / Web Stream',
      logo: '⚡',
      color: '#10B981',
      badgeColor: 'border-emerald-500/40 bg-emerald-600/20 text-emerald-400',
      url: 'https://commondatastorage.googleapis.com',
      category: 'Direct HLS 4K',
      description: 'Filmes em 4K e transmissões abertas com som surround estéreo',
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
        <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90dvh] pb-safe">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-violet-600 to-cyan-500 p-0.5 shadow-lg shadow-red-600/30 flex items-center justify-center">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-lg font-bold text-white">
                    Modelos de Entrada de Streaming
                  </h2>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Estilo Rave.io
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-400">
                  Autenticação personalizada para cada streaming com sincronização simultânea
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 overflow-y-auto space-y-3.5">
            {/* How it works info banner */}
            <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3 sm:p-4 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-violet-400 font-bold text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Como funciona o modelo de entrada estilo Rave.io:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5" /> 1. Entrada Direta de Conta
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Cada serviço possui sua tela exclusiva com cores oficiais, identificação de perfil e acesso sem necessidade de expor senha.
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-1">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> 2. Modo Convidado Grátis
                  </span>
                  <span className="text-[11px] text-zinc-400 leading-snug">
                    Seus amigos no celular ou PC podem entrar como convidados e assistir juntos em sincronia perfeita sem assinatura!
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action: Start Co-Stream */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/30 to-zinc-950 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white">
                    Transmitir Aba / Tela com Som Estéreo
                  </span>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">
                    Transmita qualquer streaming logado direto para celulares sem tela preta
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  await onStartCoStream();
                  onClose();
                }}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Transmitir Agora</span>
              </button>
            </div>

            {/* Accounts List for Every Stream */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Serviços de Streaming Disponíveis ({servicesList.length})</span>
              </h3>
              {servicesList.map((srv) => {
                const account = accounts[srv.id];
                const isConnected = !!account?.isConnected;
                return (
                  <div
                    key={srv.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 transition gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md border border-white/5"
                        style={{ backgroundColor: `${srv.color}20` }}
                      >
                        {srv.logo}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white">{srv.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${srv.badgeColor}`}>
                            {srv.category}
                          </span>
                          {isConnected ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Conectado
                            </span>
                          ) : (
                            <span className="text-[9px] text-zinc-500 font-medium">
                              Disponível
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5">
                          {isConnected
                            ? `Conectado como: ${account.profileName || 'Principal'} (${account.email})`
                            : srv.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0">
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => setAuthServiceTarget(srv.id)}
                            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
                          >
                            Trocar
                          </button>
                          <a
                            href={srv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir</span>
                          </a>
                          <button
                            onClick={() => onDisconnectAccount(srv.id)}
                            className="px-2.5 py-1 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition cursor-pointer"
                          >
                            Desconectar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setAuthServiceTarget(srv.id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: srv.color }}
                        >
                          <span>Entrar no {srv.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Autenticação individual para cada participante</span>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition active:scale-95 cursor-pointer text-center"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modal: Dedicated Rave.io entry model for the chosen stream */}
      {authServiceTarget && (
        <StreamingAuthModal
          isOpen={!!authServiceTarget}
          onClose={() => setAuthServiceTarget(null)}
          service={authServiceTarget}
          onAuthenticate={(srv, email, profile) => {
            onConnectAccount(srv, email, profile);
            setAuthServiceTarget(null);
          }}
          onContinueAsGuest={() => {
            setAuthServiceTarget(null);
          }}
        />
      )}
    </>
  );
};
