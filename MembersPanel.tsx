import React from 'react';
import { Users, Crown, Mic, MicOff, VolumeX, Smartphone, Laptop, Shield } from 'lucide-react';
import { Participant } from '../types';

interface MembersPanelProps {
  participants: Record<string, Participant>;
  currentUser: Participant | null;
  allowGuestControl: boolean;
  onToggleGuestControl?: () => void;
  isHost: boolean;
}

export const MembersPanel: React.FC<MembersPanelProps> = ({
  participants,
  currentUser,
  allowGuestControl,
  onToggleGuestControl,
  isHost,
}) => {
  const list = Object.values(participants);

  return (
    <div className="flex flex-col h-full bg-zinc-950/95 border-l border-zinc-800/80 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-sm text-zinc-100">Participantes ({list.length})</h3>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
        {list.map((p) => {
          const isMe = currentUser?.id === p.id;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 hover:border-zinc-700/80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm border font-bold ${
                    p.isSpeaking
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: `${p.color}25` }}
                >
                  <span>{p.avatar}</span>
                  {p.isHost && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xs">
                      <Crown className="w-2 h-2 fill-current" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] text-violet-400 font-bold">(Você)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    {p.device === 'iphone' ? (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Smartphone className="w-3 h-3" /> iPhone
                      </span>
                    ) : p.device === 'android' ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Smartphone className="w-3 h-3" /> Android
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Laptop className="w-3 h-3" /> PC / Web
                      </span>
                    )}
                    {p.isBuffering && (
                      <span className="text-amber-400 font-medium">⏳ Carregando</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1 text-zinc-400">
                {p.isMuted ? (
                  <span title="Mutado">
                    <MicOff className="w-3.5 h-3.5 text-zinc-500" />
                  </span>
                ) : (
                  <span title={p.isSpeaking ? 'Falando' : 'Microfone ativo'}>
                    <Mic
                      className={`w-3.5 h-3.5 ${
                        p.isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'
                      }`}
                    />
                  </span>
                )}
                {p.isDeafened && (
                  <span title="Áudio desativado" className="ml-1">
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Box */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
            Controle do Vídeo:
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {allowGuestControl ? 'Todos podem pausar' : 'Apenas Anfitrião'}
          </span>
        </div>
        {isHost && onToggleGuestControl && (
          <button
            onClick={onToggleGuestControl}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 transition"
          >
            {allowGuestControl
              ? 'Bloquear controle para convidados'
              : 'Permitir que todos controlem o vídeo'}
          </button>
        )}
      </div>
    </div>
  );
};
