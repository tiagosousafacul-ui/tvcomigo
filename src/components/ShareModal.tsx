import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Smartphone,
  ShieldCheck,
  MessageCircle,
  Key,
  ExternalLink,
} from 'lucide-react';
import { getQrCodeImageUrl } from '../utils/qr';
import { getPublicShareUrl, getWhatsAppShareUrl, getTelegramShareUrl } from '../utils/share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomTitle,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const publicUrl = getPublicShareUrl(roomId);
  const qrImageUrl = getQrCodeImageUrl(publicUrl, 260);
  const whatsappUrl = getWhatsAppShareUrl(roomId, roomTitle);
  const _telegramUrl = getTelegramShareUrl(roomId, roomTitle);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Assistir juntos: ${roomTitle}`,
          text: `Vem assistir comigo no SyncRave com voz e vídeo em tempo real!\nCódigo da Sala: ${roomId}`,
          url: publicUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-zinc-800 bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Convidar Amigos</h2>
              <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Link público desbloqueado para todos
              </span>
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
        <div className="p-3.5 sm:p-5 flex flex-col items-center gap-3.5 text-center overflow-y-auto pb-safe">
          {/* Room Title & Code Pill */}
          <div className="flex flex-col items-center gap-1">
            <h3 className="font-bold text-zinc-100 text-sm sm:text-base">{roomTitle}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-zinc-400">Código da Sala:</span>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-violet-500/40 text-violet-300 font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-violet-950/30 transition active:scale-95 cursor-pointer"
                title="Clique para copiar o código"
              >
                <Key className="w-3 h-3 text-violet-400" />
                <span>{roomId}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          {/* QR Code for Mobile Scanning */}
          <div className="p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner flex flex-col items-center">
            <img
              src={qrImageUrl}
              alt="QR Code da Sala Pública"
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl object-contain"
            />
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aponte a câmera do iPhone ou Android</span>
            </div>
          </div>

          {/* Direct Public Link Box */}
          <div className="w-full flex flex-col gap-1.5 text-left">
            <label className="text-[10px] sm:text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
              Link Direto da Sala (Público)
            </label>
            <div className="w-full flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="bg-transparent text-xs text-zinc-200 font-mono flex-1 outline-hidden select-all truncate px-1"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp / Telegram / Social Share Buttons */}
          <div className="w-full grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <button
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-violet-400" />
              <span>Outros Apps</span>
            </button>
          </div>

          {/* Open Room in Public Window for Host */}
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-linear-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/40 hover:to-fuchsia-600/40 text-violet-200 border border-violet-500/40 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-violet-600/20"
          >
            <ExternalLink className="w-4 h-4 text-violet-400" />
            <span>Abrir Sala no Navegador Externo</span>
          </a>

          {/* Clear info instruction */}
          <div className="w-full flex items-start gap-2 bg-violet-950/20 border border-violet-800/30 rounded-xl p-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="text-[10px] sm:text-[11px] text-zinc-300 leading-normal">
              <strong>Dica de Acesso Rápido:</strong> Se seu amigo preferir, ele só precisa abrir o SyncRave no celular ou PC e digitar o código <strong className="text-violet-400 font-mono">{roomId}</strong>!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
