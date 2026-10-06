import React from 'react';
import { FloatingReaction } from '../types';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30">
      {reactions.map((rx) => (
        <div
          key={rx.id}
          className="absolute bottom-16 sm:bottom-20 flex flex-col items-center animate-rave-float select-none pointer-events-none"
          style={{
            left: `${rx.x}%`,
          }}
        >
          <span className="text-4xl sm:text-5xl filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] transform transition-transform">
            {rx.emoji}
          </span>
          <span
            className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 bg-zinc-950/85 backdrop-blur-md text-white shadow-xl border border-white/15"
            style={{ color: rx.senderColor || '#a855f7' }}
          >
            {rx.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};
