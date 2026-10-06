import React, { useState } from 'react';
import {
  Zap,
  Share2,
  Settings,
  Film,
  Crown,
  Sliders,
  ShieldCheck,
  MoreVertical,
  X,
  Radio,
  Wifi,
  Flame,
} from 'lucide-react';
import { Participant } from '../types';

interface HeaderProps {
  roomTitle: string;
  roomId: string;
  currentUser: Participant | null;
  participantsCount: number;
  participants?: Record<string, Participant>;
  onOpenShare: () => void;
  onOpenMediaBrowser: () => void;
  onOpenTop10?: () => void;
  onOpenSettings: () => void;
  onOpenAudioOptimization?: () => void;
  onOpenStreamingAccounts?: () => void;
  onOpenDrmHelper?: () => void;
  ping?: number;
  isHost: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roomTitle,
  roomId,
  currentUser,
  participantsCount,
  participants = {},
  onOpenShare,
  onOpenMediaBrowser,
  onOpenTop10,
  onOpenSettings,
  onOpenAudioOptimization,
  onOpenStreamingAccounts,
  onOpenDrmHelper,
  ping = 25,
  isHost,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const participantList = Object.values(participants);

  return (
    <>
      <header className="h-13 sm:h-15 bg-zinc-950/95 border-b border-zinc-800/80 px-2.5 sm:px-5 flex items-center justify-between gap-2 shrink-0 backdrop-blur-md z-30 select-none">
        {/* Left: Brand & Room Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-linear-to-tr from-violet-600 via-purple-500 to-cyan-400 p-0.5 shadow-md shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400 fill-current" />
              </div>
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-linear-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
              TV Comigo
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Room Pill & Participant Count */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-300 truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[180px]">
              {roomTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
              #{roomId.slice(0, 5)}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Avatars Pill (Compact on mobile) */}
          <div className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-bold text-violet-300">
            <div className="flex items-center -space-x-1.5">
              {participantList.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-1 ring-zinc-900 ${
                    p.isSpeaking ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                  }`}
                  style={{ backgroundColor: p.color || '#a855f7' }}
                  title={p.name}
                >
                  <span className="scale-75 select-none">{p.avatar}</span>
                </div>
              ))}
            </div>
            <span>{participantsCount}</span>
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="hidden md:flex items-center gap-1.5">
            {onOpenTop10 && (
              <button
                onClick={onOpenTop10}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-linear-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                title="Ver Top 10 Diário de Filmes e Séries"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-current animate-pulse" />
                <span>Top 10 Hoje</span>
              </button>
            )}

            <button
              onClick={onOpenMediaBrowser}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
              title="Escolher filme ou vídeo"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Mídia</span>
            </button>

            <button
              onClick={onOpenStreamingAccounts}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
              title="Contas de Streaming (Netflix, Prime, Disney)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Contas</span>
            </button>

            {onOpenDrmHelper && (
              <button
                onClick={onOpenDrmHelper}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
                title="Como resolver tela preta de DRM na Netflix"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Anti-DRM</span>
              </button>
            )}

            <button
              onClick={onOpenAudioOptimization}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition cursor-pointer"
              title="Otimizações de Áudio HD & Rede"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition cursor-pointer"
              title="Configurações da Sala"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action: Convidar (Always visible, responsive size) */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 transition active:scale-95 cursor-pointer"
            title="Convidar amigos para a sala"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Convidar</span>
          </button>

          {/* Mobile More Options Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-xl text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
            aria-label="Abrir menu de opções"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Current User Avatar */}
          {currentUser && (
            <div
              className="hidden sm:flex items-center pl-1.5 border-l border-zinc-800"
              title={`${currentUser.name} (${isHost ? 'Anfitrião' : 'Convidado'})`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs border border-zinc-700 font-bold relative shadow-xs"
                style={{ backgroundColor: `${currentUser.color}33` }}
              >
                <span>{currentUser.avatar}</span>
                {isHost && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xs">
                    <Crown className="w-2 h-2 fill-current" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer / Bottom Sheet for Extra Actions */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs md:hidden animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-4 flex flex-col gap-3.5 shadow-2xl z-10 pb-safe">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentUser?.avatar}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentUser?.name}</h4>
                  <span className="text-[10px] text-zinc-400">
                    {isHost ? '👑 Anfitrião da Sala' : 'Convidado'} • #{roomId.slice(0, 6)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-2 gap-2">
              {onOpenTop10 && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenTop10();
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 to-rose-950/40 border border-amber-500/40 flex items-center gap-2.5 text-left text-xs font-bold text-amber-300 active:bg-zinc-800 transition"
                >
                  <Flame className="w-4 h-4 text-rose-500 shrink-0 fill-current animate-pulse" />
                  <span>Top 10 Hoje</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenMediaBrowser();
                }}
                className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-left text-xs font-semibold text-zinc-200 active:bg-zinc-800 transition"
              >
                <Film className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Trocar Mídia</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenStreamingAccounts?.();
                }}
                className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-left text-xs font-semibold text-zinc-200 active:bg-zinc-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                <span>Contas Streaming</span>
              </button>

              {onOpenDrmHelper && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDrmHelper();
                  }}
                  className="p-3 rounded-2xl bg-red-950/20 border border-red-800/40 flex items-center gap-2.5 text-left text-xs font-semibold text-red-300 active:bg-zinc-800 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Guia Anti-DRM</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAudioOptimization?.();
                }}
                className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-left text-xs font-semibold text-zinc-200 active:bg-zinc-800 transition"
              >
                <Sliders className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Áudio HD & Rede</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-2.5 text-left text-xs font-semibold text-zinc-200 active:bg-zinc-800 transition"
              >
                <Settings className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Configurações</span>
              </button>
            </div>

            {/* Ping & Network Status in Mobile Menu */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Latência de Voz: {ping}ms</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Radio className="w-3 h-3 animate-pulse" /> Ao Vivo
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
