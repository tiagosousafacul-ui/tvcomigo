import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Flame, Users, Clock, ShieldCheck, Film } from 'lucide-react';
import { MediaItem } from '../types';

interface WatchPartyCountdownOverlayProps {
  party: {
    mediaId: string;
    mediaTitle: string;
    syncStartTime: number;
    initiatorName: string;
  };
  media: MediaItem;
  onFinish?: () => void;
}

export const WatchPartyCountdownOverlay: React.FC<WatchPartyCountdownOverlayProps> = ({
  party,
  media,
  onFinish,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => Math.max(0, party.syncStartTime - Date.now()));

  useEffect(() => {
    // Play subtle audio tone using Web Audio API on countdown ticks
    const playTickSound = (frequency: number) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } catch (_) {}
    };

    let lastSec = Math.ceil(Math.max(0, party.syncStartTime - Date.now()) / 1000);

    const interval = setInterval(() => {
      const remaining = Math.max(0, party.syncStartTime - Date.now());
      setTimeLeftMs(remaining);

      const currentSec = Math.ceil(remaining / 1000);
      if (currentSec !== lastSec && currentSec > 0) {
        lastSec = currentSec;
        playTickSound(currentSec === 1 ? 880 : 660);
      }

      if (remaining <= 0) {
        playTickSound(1100);
        clearInterval(interval);
        onFinish?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [party.syncStartTime, onFinish]);

  const seconds = Math.ceil(timeLeftMs / 1000);
  const totalDurationMs = 5000;
  const progressPercent = Math.min(100, Math.max(0, ((totalDurationMs - timeLeftMs) / totalDurationMs) * 100));

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-linear-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center gap-4 shadow-2xl shadow-amber-950/50 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500 to-rose-600 text-white font-extrabold text-[11px] sm:text-xs shadow-lg shadow-amber-600/30">
          <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
          <span>DAILY WATCH PARTY • SINCRONIA EM GRUPO</span>
        </div>

        {/* Movie Info */}
        <div className="flex items-center gap-3.5 text-left w-full p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 border border-amber-500/30 bg-zinc-950">
            <img
              src={media.poster}
              alt={media.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Filme Mais Popular do Dia
            </span>
            <h4 className="text-sm sm:text-base font-black text-white truncate">
              {media.title}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
              Iniciado por <strong className="text-zinc-200">{party.initiatorName}</strong>
            </p>
          </div>
        </div>

        {/* Giant Countdown Ring */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center my-1">
          {/* Circular SVG Progress */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-zinc-800 stroke-current"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-amber-500 stroke-current transition-all duration-100 ease-linear"
              strokeWidth="6"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Number Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {seconds > 0 ? (
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
                {seconds}
              </span>
            ) : (
              <span className="text-lg sm:text-xl font-black text-emerald-400 animate-bounce tracking-wide flex items-center gap-1">
                <Play className="w-5 h-5 fill-current" /> PLAY
              </span>
            )}
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
              {seconds > 0 ? 'Segundos' : 'Iniciando'}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Sincronizando início em grupo para todos...</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            Todos os celulares e computadores conectados na sala começarão juntos no mesmo instante!
          </span>
        </div>
      </div>
    </div>
  );
};
