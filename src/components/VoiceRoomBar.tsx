import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Smartphone,
  Laptop,
  Sliders,
  Users,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Participant } from '../types';

interface VoiceRoomBarProps {
  participants: Record<string, Participant>;
  currentUser: Participant | null;
  isMicActive: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  voiceVolume: number;
  pushToTalkActive: boolean;
  onToggleMic: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onSetVoiceVolume: (val: number) => void;
  onSetPushToTalk: (active: boolean) => void;
}

export const VoiceRoomBar: React.FC<VoiceRoomBarProps> = ({
  participants,
  currentUser,
  isMicActive,
  isMuted,
  isDeafened,
  isSpeaking,
  voiceVolume,
  pushToTalkActive,
  onToggleMic,
  onToggleMute: _onToggleMute,
  onToggleDeafen,
  onSetVoiceVolume,
  onSetPushToTalk,
}) => {
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const participantList = Object.values(participants);

  const activeSpeakers = participantList.filter((p) => {
    return p.id === currentUser?.id ? isSpeaking : p.isSpeaking;
  });

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'iphone':
        return <Smartphone className="w-3 h-3 text-cyan-400" />;
      case 'android':
        return <Smartphone className="w-3 h-3 text-emerald-400" />;
      default:
        return <Laptop className="w-3 h-3 text-violet-400" />;
    }
  };

  return (
    <div className="bg-zinc-950/95 border-t border-zinc-800/80 px-2.5 sm:px-4 py-2 sm:py-2.5 backdrop-blur-md shrink-0 flex flex-col gap-1.5 z-20 pb-safe">
      {/* Mobile Active Speakers Banner / Drawer Toggle */}
      {showMembersDrawer && (
        <div className="md:hidden py-2 px-2 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none animate-fade-in">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
            Na Chamada:
          </span>
          {participantList.map((p) => {
            const isMe = currentUser?.id === p.id;
            const speaking = isMe ? isSpeaking : p.isSpeaking;
            const muted = isMe ? isMuted || !isMicActive : p.isMuted;
            return (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 shrink-0"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    speaking ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                  }`}
                  style={{ backgroundColor: `${p.color}33` }}
                >
                  <span>{p.avatar}</span>
                </div>
                <span className="text-[11px] font-medium text-zinc-300">
                  {p.name} {isMe && '(Você)'}
                </span>
                {muted && <MicOff className="w-2.5 h-2.5 text-zinc-500" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Single-Row Voice Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* Left Side: Desktop Avatars / Mobile Status */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Desktop Full Avatars */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto max-w-[340px] lg:max-w-[420px] scrollbar-none">
            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400 shrink-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Voz:</span>
            </div>
            {participantList.map((p) => {
              const isMe = currentUser?.id === p.id;
              const speaking = isMe ? isSpeaking : p.isSpeaking;
              const muted = isMe ? isMuted || !isMicActive : p.isMuted;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 shrink-0"
                  title={`${p.name} [${p.device}]`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      speaking ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''
                    }`}
                    style={{ backgroundColor: `${p.color}25` }}
                  >
                    <span>{p.avatar}</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-300 truncate max-w-[80px]">
                    {p.name}
                  </span>
                  {muted ? (
                    <MicOff className="w-3 h-3 text-zinc-500" />
                  ) : (
                    getDeviceIcon(p.device)
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Status Indicator */}
          <button
            onClick={() => setShowMembersDrawer((prev) => !prev)}
            className="md:hidden flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 active:scale-95 transition"
          >
            <div className="flex items-center -space-x-1">
              {participantList.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ring-1 ring-zinc-900 ${
                    p.isSpeaking ? 'ring-2 ring-emerald-400' : ''
                  }`}
                  style={{ backgroundColor: p.color || '#a855f7' }}
                >
                  <span className="scale-75">{p.avatar}</span>
                </div>
              ))}
            </div>
            {activeSpeakers.length > 0 ? (
              <span className="text-emerald-400 font-bold truncate max-w-[80px]">
                {activeSpeakers[0].name} fala...
              </span>
            ) : (
              <span className="text-zinc-400 font-medium">Voz ({participantList.length})</span>
            )}
            {showMembersDrawer ? (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Right Side: Fast Voice Control Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Push-to-Talk Button (Touch friendly with active visual feedback) */}
          {isMicActive && !isDeafened && (
            <button
              onMouseDown={() => onSetPushToTalk(true)}
              onMouseUp={() => onSetPushToTalk(false)}
              onTouchStart={() => onSetPushToTalk(true)}
              onTouchEnd={() => onSetPushToTalk(false)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all select-none active:scale-95 flex items-center gap-1.5 cursor-pointer touch-none ${
                pushToTalkActive
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">
                {pushToTalkActive ? 'Falando...' : 'Segure p/ Falar'}
              </span>
              <span className="xs:hidden">{pushToTalkActive ? 'Falar...' : 'PTT'}</span>
            </button>
          )}

          {/* Master Microphone Button */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
              isMicActive
                ? isMuted
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title={isMicActive ? (isMuted ? 'Microfone Mutado' : 'Microfone Ativo') : 'Ligar Microfone'}
          >
            {isMicActive ? (
              isMuted ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mutado</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Voz On</span>
                </>
              )
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-zinc-400" />
                <span>Microfone</span>
              </>
            )}
          </button>

          {/* Deafen (Mute friend's audio) */}
          <button
            onClick={onToggleDeafen}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              isDeafened
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
            title={isDeafened ? 'Desmutar voz dos amigos' : 'Mutar áudio da chamada'}
          >
            {isDeafened ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Mutado</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
                <span className="hidden sm:inline">Ouvindo</span>
              </>
            )}
          </button>

          {/* Voice Volume Level Slider (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-xl">
            <Sliders className="w-3 h-3 text-zinc-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isDeafened ? 0 : voiceVolume}
              onChange={(e) => onSetVoiceVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              title="Volume da voz dos amigos"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
