import React from 'react';
import {
  X,
  Volume2,
  Wifi,
  Sliders,
  Zap,
  Smartphone,
} from 'lucide-react';
import { AudioSettings, RoomState } from '../types';

interface AudioOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: Partial<AudioSettings>) => void;
  ping: number;
  qualityLevel: 'excelente' | 'boa' | 'instavel';
  room: RoomState;
  onUpdateRoomConfig?: (
    allowGuestControl?: boolean,
    title?: string,
    adaptiveSyncMode?: 'ultra-baixa-latencia' | 'estavel-mobile'
  ) => void;
  isHost: boolean;
}

export const AudioOptimizationModal: React.FC<AudioOptimizationModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  onUpdateAudioSettings,
  ping,
  qualityLevel,
  room,
  onUpdateRoomConfig,
  isHost,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90dvh] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-linear-to-tr from-violet-600 to-emerald-500 p-0.5 shadow-md shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[12px] flex items-center justify-center">
                <Sliders className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Otimizações de Áudio HD & Rede
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                Ajustes de voz sem quedas no iPhone e Android
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
        <div className="p-3.5 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">
          {/* Network Quality Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  qualityLevel === 'excelente'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : qualityLevel === 'boa'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                  Rede:{' '}
                  <span
                    className={`capitalize ${
                      qualityLevel === 'excelente'
                        ? 'text-emerald-400'
                        : qualityLevel === 'boa'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {qualityLevel}
                  </span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono">
                  Latência estimada: <strong className="text-zinc-200">{ping} ms</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  qualityLevel === 'excelente' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase">Ao Vivo</span>
            </div>
          </div>

          {/* Adaptive Streaming Mode Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Modo de Sincronização Adaptativa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  isHost && onUpdateRoomConfig?.(room.allowGuestControl, room.title, 'estavel-mobile')
                }
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  room.adaptiveSyncMode === 'estavel-mobile'
                    ? 'border-violet-500 bg-violet-950/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-98'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    Estável Mobile
                  </span>
                  {room.adaptiveSyncMode === 'estavel-mobile' && (
                    <span className="text-[10px] text-violet-400 font-bold">Ativo</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  Ideal para 4G/5G, iPhone e Android. Evita quedas usando micro-ajustes automáticos.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  isHost &&
                  onUpdateRoomConfig?.(room.allowGuestControl, room.title, 'ultra-baixa-latencia')
                }
                className={`p-2.5 sm:p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                  room.adaptiveSyncMode === 'ultra-baixa-latencia'
                    ? 'border-violet-500 bg-violet-950/20 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-98'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Ultra-Baixa Latência
                  </span>
                  {room.adaptiveSyncMode === 'ultra-baixa-latencia' && (
                    <span className="text-[10px] text-violet-400 font-bold">Ativo</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  Sincronismo rigoroso em milissegundos para redes de fibra óptica e Wi-Fi estável.
                </p>
              </button>
            </div>
          </div>

          {/* Voice Ducking Setting */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-100">
                    Atenuação Inteligente (Voice Ducking)
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Abaixa o filme em 35% automaticamente quando amigos falam
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.duckingEnabled}
                onChange={(e) =>
                  onUpdateAudioSettings({ duckingEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* High Fidelity Opus & Noise Suppression */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-100">
                  Codec Opus HD (Estéreo 96 kbps)
                </span>
                <span className="text-[10px] text-zinc-400">
                  Áudio de alta definição sem cortes
                </span>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.highFidelity}
                onChange={(e) =>
                  onUpdateAudioSettings({ highFidelity: e.target.checked })
                }
                className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-100">
                  Cancelamento de Eco e Ruído
                </span>
                <span className="text-[10px] text-zinc-400">
                  Elimina o som do filme vazando no microfone
                </span>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.echoCancellation}
                onChange={(e) =>
                  onUpdateAudioSettings({
                    echoCancellation: e.target.checked,
                    noiseSuppression: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Volume Balance Sliders */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">Volume do Filme</span>
                <span className="text-zinc-400 font-mono">
                  {Math.round(audioSettings.movieVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.movieVolume}
                onChange={(e) =>
                  onUpdateAudioSettings({ movieVolume: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">Volume da Voz (Amigos)</span>
                <span className="text-emerald-400 font-mono">
                  {Math.round(audioSettings.voiceVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={audioSettings.voiceVolume}
                onChange={(e) =>
                  onUpdateAudioSettings({ voiceVolume: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition active:scale-95 cursor-pointer text-center"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
