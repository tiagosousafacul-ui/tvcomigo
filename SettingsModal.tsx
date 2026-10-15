import React, { useState, useEffect } from 'react';
import { X, Settings, Smartphone, Radio, Globe, Server, CheckCircle2 } from 'lucide-react';
import { RoomState, Participant } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomState;
  currentUser: Participant | null;
  onUpdateConfig: (allowGuestControl?: boolean, title?: string) => void;
  isConnected?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUser,
  onUpdateConfig,
  isConnected = false,
}) => {
  const [title, setTitle] = useState(room.title);
  const [allowGuest, setAllowGuest] = useState(room.allowGuestControl);
  const [customWs, setCustomWs] = useState('');
  const [savedWsNotice, setSavedWsNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tvcomigo_custom_ws_url') || '';
      setCustomWs(saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isHost = currentUser?.isHost ?? false;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (customWs.trim()) {
        localStorage.setItem('tvcomigo_custom_ws_url', customWs.trim());
        setSavedWsNotice('Servidor atualizado! Recarregando conexão...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        localStorage.removeItem('tvcomigo_custom_ws_url');
      }
    }
    if (isHost) {
      onUpdateConfig(allowGuest, title.trim() || room.title);
    }
    onClose();
  };

  const handleResetWs = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tvcomigo_custom_ws_url');
      setCustomWs('');
      setSavedWsNotice('Restaurado para o servidor padrão!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90dvh] pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">Configurações da Sala</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-3.5 sm:p-5 flex flex-col gap-3.5 overflow-y-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-300">Nome da Sala</label>
            <input
              type="text"
              disabled={!isHost}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-base sm:text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 disabled:opacity-50"
            />
          </div>

          {/* Control Permissions */}
          <div className="flex flex-col gap-2 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-200">Controle Colaborativo</span>
                <span className="text-[10px] sm:text-[11px] text-zinc-400">
                  Permitir que convidados também pausem e avancem
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isHost}
                checked={allowGuest}
                onChange={(e) => setAllowGuest(e.target.checked)}
                className="w-4 h-4 accent-violet-500 rounded cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Servidor em Tempo Real & Deploy Vercel */}
          <div className="flex flex-col gap-2 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Server className="w-4 h-4 text-violet-400" />
                <span>Servidor & Deploy Vercel</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isConnected
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                }`}
              >
                {isConnected ? '🟢 Conectado' : '⚡ Modo Standalone (Vercel)'}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed">
              No Vercel (<strong>tvcomigo.vercel.app</strong>), a aplicação funciona de forma autônoma. Para sincronizar amigos em tempo real pela internet, aponte para seu servidor WebSocket.
            </p>

            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[10px] font-semibold text-zinc-400">
                Endereço WebSocket do Servidor (opcional):
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: wss://seu-backend.onrender.com ou Cloud Run"
                  value={customWs}
                  onChange={(e) => setCustomWs(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 font-mono"
                />
                {customWs && (
                  <button
                    type="button"
                    onClick={handleResetWs}
                    className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
                    title="Restaurar padrão"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {savedWsNotice && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savedWsNotice}</span>
              </div>
            )}
          </div>

          {/* iPhone & Android Tips */}
          <div className="flex flex-col gap-1.5 p-3 bg-violet-950/20 border border-violet-800/30 rounded-xl text-left">
            <div className="flex items-center gap-1.5 text-violet-400 font-bold text-xs">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Dicas para iPhone & Celulares Android:</span>
            </div>
            <ul className="text-[10px] sm:text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>
                <strong>No iPhone (iOS Safari):</strong> Toque em Compartilhar  &gt; &quot;Adicionar à Tela de Início&quot; para abrir em modo app nativo sem barra de navegador.
              </li>
              <li>
                <strong>Toque duplo no vídeo:</strong> Dê dois toques no lado esquerdo do player para voltar 10s ou no lado direito para avançar 10s.
              </li>
              <li>
                <strong>Modo Dividido:</strong> Assista ao vídeo em cima enquanto digita no chat embaixo sem perder nenhuma cena.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              Fechar
            </button>
            {isHost && (
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md shadow-violet-600/30 transition active:scale-95 cursor-pointer"
              >
                Salvar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
