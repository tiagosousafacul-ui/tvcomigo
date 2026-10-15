import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Monitor,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Zap,
  Smartphone,
  Laptop,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { RoomState } from '../types';
import { formatTime } from '../utils/device';

interface DrmHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: RoomState | null;
  onStartScreenShare?: () => Promise<void>;
  netflixWatchUrl?: string;
}

export const DrmHelperModal: React.FC<DrmHelperModalProps> = ({
  isOpen,
  onClose,
  room,
  onStartScreenShare,
  netflixWatchUrl = 'https://www.netflix.com',
}) => {
  const [activeTab, setActiveTab] = useState<'costream' | 'bookmarklet' | 'mobile'>('costream');
  const [copiedSetting, setCopiedSetting] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const currentRoomId = room?.id || 'sala';
  const currentTime = room?.playback?.currentTime || 0;

  // The SyncRave Netflix Web Controller Bookmarklet
  const bookmarkletCode = `javascript:(function(){
    var wsUrl=(location.protocol==='https:'?'wss:':'ws:')+'//${typeof window !== 'undefined' ? window.location.host : 'syncrave.app'}';
    var ws=new WebSocket(wsUrl);
    ws.onopen=function(){
      ws.send(JSON.stringify({type:'join',roomId:'${currentRoomId}',user:{name:'Netflix Controller',avatar:'🍿',device:'desktop'}}));
      alert('🍿 SyncRave conectado com sucesso à sua Netflix! A reprodução agora está sincronizada com a sala.');
    };
    ws.onmessage=function(e){
      try{
        var data=JSON.parse(e.data);
        var v=document.querySelector('video');
        if(!v) return;
        if(data.type==='playback:updated'){
          if(data.playback.isPlaying && v.paused) v.play();
          else if(!data.playback.isPlaying && !v.paused) v.pause();
          if(Math.abs(v.currentTime - data.playback.currentTime) > 1.5){
            v.currentTime = data.playback.currentTime;
          }
        }
      }catch(err){}
    };
  })();`.replace(/\s+/g, ' ');

  const handleCopyChromeSettings = () => {
    navigator.clipboard.writeText('chrome://settings/system');
    setCopiedSetting(true);
    setTimeout(() => setCopiedSetting(false), 2500);
  };

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-2xl max-h-[90dvh] bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Assistir Netflix & Streamings com DRM
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  Sem Tela Preta
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Soluções testadas e aprovadas para contornar o bloqueio de DRM da Netflix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950/50 p-2 gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('costream')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'costream'
                ? 'bg-emerald-600 text-zinc-950 shadow-md shadow-emerald-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>1. Transmitir Aba (Rave Mode)</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarklet')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'bookmarklet'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2. Sincronia de Contas (Teleparty)</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mobile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>3. No Celular (PiP)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 text-zinc-200">
          {activeTab === 'costream' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-amber-300 block mb-0.5">Por que a Netflix fica preta na transmissão?</strong>
                  Os navegadores (Chrome e Edge) ativam por padrão a &quot;Aceleração de Hardware&quot;, que esconde o vídeo para impedir gravação. Desativando isso em 10 segundos, você transmite a Netflix com áudio estéreo nativo para qualquer amigo no iPhone, Android e PC!
                </div>
              </div>

              <div className="flex flex-col gap-2.5 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] flex items-center justify-center font-mono">1</span>
                  Desativar Aceleração Gráfica no Chrome / Edge
                </h4>
                <ol className="text-xs text-zinc-300 space-y-2 pl-7 list-decimal leading-relaxed">
                  <li>
                    Abra uma nova aba e cole:
                    <div className="mt-1 flex items-center gap-2">
                      <code className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-violet-300 font-mono text-[11px]">
                        chrome://settings/system
                      </code>
                      <button
                        onClick={handleCopyChromeSettings}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-[10px] flex items-center gap-1 border border-zinc-700 cursor-pointer"
                      >
                        {copiedSetting ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSetting ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </li>
                  <li>Desmarque a opção: <strong>&quot;Usar aceleração de hardware quando disponível&quot;</strong>.</li>
                  <li>Clique no botão <strong>&quot;Reiniciar&quot;</strong> que aparece ao lado.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] flex items-center justify-center font-mono">2</span>
                  Iniciar a Transmissão da Aba
                </h4>
                <p className="text-xs text-zinc-300 pl-7">
                  Abra o filme na Netflix, volte para o SyncRave e clique no botão abaixo. Escolha a <strong>Aba da Netflix</strong> e certifique-se de marcar a caixinha <strong>&quot;Compartilhar áudio da aba&quot;</strong>.
                </p>
                <div className="pt-2 pl-7">
                  <button
                    onClick={async () => {
                      onClose();
                      if (onStartScreenShare) await onStartScreenShare();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Iniciar Transmissão de Aba com Áudio</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/40 flex items-center justify-between text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Dica: No <strong>Mozilla Firefox</strong>, a Netflix transmite sem precisar mexer em nada!</span>
                </span>
              </div>
            </div>
          )}

          {activeTab === 'bookmarklet' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-start gap-3">
                <Zap className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-violet-300 block mb-0.5">Modo Sincronia Direta de Contas (Estilo Teleparty)</strong>
                  Se você e seus amigos têm conta da Netflix, vocês podem assistir com qualidade máxima 4K HDR e áudio surround 5.1 diretamente no site da Netflix, com o SyncRave sincronizando o Play, Pause e Tempo no milissegundo!
                </div>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-3">
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Código de Sincronia Instantânea (Bookmarklet)
                </h4>
                <p className="text-xs text-zinc-400">
                  Copie o código abaixo, abra a aba do seu filme na Netflix, abra o console (F12) e cole, ou adicione como favorito:
                </p>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={bookmarkletCode}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-zinc-300 focus:outline-hidden resize-none select-all"
                  />
                  <button
                    onClick={handleCopyBookmarklet}
                    className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    {copiedBookmarklet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBookmarklet ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400 block">Tempo atual da sala:</span>
                  <span className="text-base font-extrabold font-mono text-white text-emerald-400">
                    {formatTime(currentTime)}
                  </span>
                </div>
                <a
                  href={netflixWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Netflix Oficial</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-blue-300 block mb-0.5">Assistindo no Celular (iPhone e Android)</strong>
                  Nos smartphones, a forma mais prática de assistir é usar a chamada de voz do SyncRave em segundo plano enquanto assiste à transmissão da sala ou abre a Netflix em Picture-in-Picture.
                </div>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2.5">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span>Se um amigo estiver no Computador (Anfitrião)</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Ele transmite a aba da Netflix com áudio estéreo nativo pelo SyncRave. Você no celular assiste diretamente na tela do SyncRave sem precisar instalar nada e sem precisar de login na Netflix!
                </p>
              </div>

              <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 flex flex-col gap-2.5">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-violet-400" />
                  <span>Se todos estiverem no Celular</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O SyncRave mantém a sala de voz ligada com cancelamento de ruído. Vocês podem abrir o app da Netflix simultaneamente usando a contagem de sincronia da sala!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SyncRave DRM Bypass v2.4</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
