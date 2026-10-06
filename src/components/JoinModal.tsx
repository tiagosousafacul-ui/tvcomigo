import React, { useState, useEffect } from 'react';
import { Zap, Smartphone, Laptop, Check, Key, Users } from 'lucide-react';
import { getDeviceType } from '../utils/device';
import { normalizeRoomId } from '../utils/share';

interface JoinModalProps {
  initialRoomId: string;
  onJoin: (user: { name: string; avatar: string; color: string }, roomId: string) => void;
}

interface ActiveRoomSummary {
  id: string;
  title: string;
  participantCount: number;
  currentMedia: { title: string };
  isPlaying: boolean;
}

const AVATARS = ['🍿', '😎', '🐱', '🦊', '🚀', '🎧', '🎮', '🐼', '👾', '🔥'];
const COLORS = [
  '#a855f7', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#8b5cf6', // purple
];

export const JoinModal: React.FC<JoinModalProps> = ({ initialRoomId, onJoin }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [activeRooms, setActiveRooms] = useState<ActiveRoomSummary[]>([]);

  const device = getDeviceType();

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(normalizeRoomId(initialRoomId));
    }
  }, [initialRoomId]);

  // Fetch active rooms on mount
  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActiveRooms(data);
          if (!initialRoomId && data.length > 0) {
            setRoomId(normalizeRoomId(data[0].id));
          }
        }
      })
      .catch(() => {});
  }, [initialRoomId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `Usuário ${Math.floor(Math.random() * 899 + 100)}`;
    const finalRoomId = normalizeRoomId(roomId) || `rave-${Math.floor(Math.random() * 8999 + 1000)}`;

    onJoin(
      {
        name: finalName,
        avatar: selectedAvatar,
        color: selectedColor,
      },
      finalRoomId
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/95 backdrop-blur-md overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-7 shadow-2xl flex flex-col gap-3.5 my-auto max-h-[92dvh] overflow-y-auto pb-safe">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-linear-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 p-0.5 shadow-xl shadow-violet-600/40">
            <div className="w-full h-full bg-zinc-950 rounded-[12px] flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 fill-current" />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            SyncRave Watch Party
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 max-w-xs">
            Assista a streamings com bate-papo de voz em tempo real no iPhone, Android e PC.
          </p>
        </div>

        {/* Detected Active Room banner if friend is already waiting */}
        {activeRooms.length > 0 && !initialRoomId && (
          <div className="bg-violet-950/30 border border-violet-500/40 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-violet-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                Sala Ativa Detectada
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Ao Vivo
              </span>
            </div>
            {activeRooms.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoomId(r.id)}
                className={`w-full p-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                  roomId === r.id
                    ? 'bg-violet-600 text-white font-bold'
                    : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="truncate mr-2">
                  <span>{r.title}</span>
                  <span className="text-[10px] block opacity-80">
                    Mídia: {r.currentMedia?.title || 'Streaming'}
                  </span>
                </div>
                <span className="text-[10px] font-mono shrink-0">#{r.id.slice(0, 8)}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* User Name - text-base (16px) on mobile prevents iOS Safari zoom */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Seu Nome ou Apelido</label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos, Mariana, Leo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 transition"
            />
          </div>

          {/* Room ID input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">Código da Sala</label>
              {initialRoomId ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Convite carregado!
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">
                  (Vazio cria nova sala)
                </span>
              )}
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: rave-1234"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9.5 pr-4 py-2.5 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 font-mono"
              />
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Escolha seu Avatar</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border transition-all active:scale-95 cursor-pointer ${
                    selectedAvatar === av
                      ? 'border-violet-500 bg-violet-600/30 scale-105 shadow-md shadow-violet-500/30'
                      : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Cor de Destaque</label>
            <div className="flex items-center gap-2.5">
              {COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setSelectedColor(col)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    selectedColor === col
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {selectedColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Device Detection Pill */}
          <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              {device === 'iphone' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>iPhone / iOS Otimizado</span>
                </>
              ) : device === 'android' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Android Otimizado</span>
                </>
              ) : (
                <>
                  <Laptop className="w-3.5 h-3.5 text-violet-400" />
                  <span>Desktop / PC Web</span>
                </>
              )}
            </span>
            <span className="text-emerald-400 font-semibold">100% Pronto</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-1 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{roomId ? 'Entrar na Sala' : 'Criar Nova Sala'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
