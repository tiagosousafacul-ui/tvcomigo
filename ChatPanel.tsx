import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage, Participant } from '../types';

interface ChatPanelProps {
  chat: ChatMessage[];
  currentUser: Participant | null;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  typingUsers?: Record<string, string>;
  onSendTypingStatus?: (isTyping: boolean) => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '🍿', '👏', '😱', '🎉', '👀'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chat,
  currentUser,
  onSendMessage,
  onSendReaction,
  typingUsers = {},
  onSendTypingStatus,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    if (!onSendTypingStatus) return;

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onSendTypingStatus(true);
      }

      // Reset timeout
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        isTypingRef.current = false;
        onSendTypingStatus(false);
      }, 2500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onSendTypingStatus(false);
      }
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (onSendTypingStatus && isTypingRef.current) {
      isTypingRef.current = false;
      onSendTypingStatus(false);
    }
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    onSendMessage(inputText);
    setInputText('');
  };

  // Convert dictionary to array of names (excluding currentUser)
  const typingNames = Object.entries(typingUsers)
    .filter(([id]) => id !== currentUser?.id)
    .map(([, name]) => name);

  return (
    <div className="flex flex-col h-full bg-zinc-950/95 border-l border-zinc-800/80 min-h-0">
      {/* Header (Hidden on mobile split view where tab switcher already identifies the tab) */}
      <div className="hidden lg:flex p-3 sm:p-4 border-b border-zinc-800/80 items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <h3 className="font-bold text-sm text-zinc-100">Bate-Papo da Sala</h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
          {chat.filter((c) => c.type === 'text').length} msgs
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800 overscroll-contain">
        {chat.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="flex items-center justify-center my-1">
                <span className="text-[10px] sm:text-[11px] text-zinc-400 bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1 rounded-full text-center">
                  <span className="mr-1">{msg.senderAvatar}</span>
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = currentUser?.id === msg.senderId;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs shrink-0 border border-zinc-700/60 shadow-xs"
                style={{ backgroundColor: `${msg.senderColor}22` }}
              >
                <span>{msg.senderAvatar}</span>
              </div>
              <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className="text-[10px] sm:text-[11px] font-bold"
                    style={{ color: msg.senderColor || '#a855f7' }}
                  >
                    {isMe ? 'Você' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`px-3 py-1.5 sm:py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-xs ${
                    isMe
                      ? 'bg-violet-600 text-white rounded-tr-xs'
                      : 'bg-zinc-900 text-zinc-100 rounded-tl-xs border border-zinc-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingNames.length > 0 && (
        <div className="px-3.5 py-1.5 text-[10px] sm:text-xs text-zinc-400 bg-zinc-950/90 border-t border-zinc-900/60 flex items-center gap-1.5 shrink-0 animate-fade-in">
          {/* Animated typing dots */}
          <div className="flex gap-0.5 items-center mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="font-bold text-violet-300">
            {typingNames.join(', ')}
          </span>
          <span>{typingNames.length === 1 ? 'está digitando...' : 'estão digitando...'}</span>
        </div>
      )}

      {/* Floating Reaction Quick Bar */}
      <div className="px-2.5 py-1 bg-zinc-900/70 border-t border-zinc-800/60 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] text-zinc-400 font-medium shrink-0 mr-1 hidden sm:inline">
          Reações:
        </span>
        <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto justify-around sm:justify-start">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="text-lg sm:text-xl active:scale-130 transition-transform p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer touch-manipulation"
              title={`Reagir com ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field - text-base (16px) on mobile to prevent iOS Safari auto-zoom! */}
      <form
        onSubmit={handleSubmit}
        className="p-2 sm:p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Envie uma mensagem..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-base sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-600/30 shrink-0 cursor-pointer"
          aria-label="Enviar mensagem"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
