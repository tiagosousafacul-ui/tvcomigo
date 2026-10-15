import React, { useState } from 'react';
import { X, Search, Link as LinkIcon, Film, Play, Sparkles, Youtube, Check } from 'lucide-react';
import { MediaItem } from '../types';
import { MEDIA_CATALOG } from '../data/mediaCatalog';
import { resolveStreamingMedia } from '../utils/streamingResolver';

interface MediaBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  currentMediaId?: string;
}

export const MediaBrowserModal: React.FC<MediaBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  currentMediaId,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom link form
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Streaming');

  if (!isOpen) return null;

  const categories = ['Todos', 'Filmes', 'Animação', 'Música & Lo-Fi', 'Trailers & Games'];

  const filteredCatalog = MEDIA_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const resolved = resolveStreamingMedia(customUrl.trim(), customTitle.trim());
    if (customCategory) {
      resolved.category = customCategory;
    }
    onSelectMedia(resolved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Escolher Conteúdo</h2>
              <p className="text-xs text-zinc-400">
                Selecione filmes abertos ou cole links do YouTube, MP4 e streamings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Catálogo SyncRave</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Inserir Link (YouTube / MP4 / Stream)</span>
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'catalog' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por título ou gênero..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredCatalog.map((item) => {
                const isSelected = item.id === currentMediaId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectMedia(item);
                      onClose();
                    }}
                    className={`group relative flex flex-col rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                      isSelected
                        ? 'border-violet-500 bg-violet-950/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    {/* Poster Image */}
                    <div className="relative w-full aspect-video bg-zinc-950 overflow-hidden">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Type Badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white border border-white/10 flex items-center gap-1">
                        {item.type === 'youtube' ? (
                          <>
                            <Youtube className="w-3 h-3 text-red-500" /> YouTube
                          </>
                        ) : (
                          <>
                            <Film className="w-3 h-3 text-violet-400" /> Filme 4K
                          </>
                        )}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {/* Hover play icon */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                          <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Metadata */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-zinc-100 line-clamp-1 group-hover:text-violet-400 transition">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                        <span>{item.category}</span>
                        <span className="text-violet-400 font-semibold flex items-center gap-1">
                          Assistir Agora →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex-1 p-5 sm:p-6 flex flex-col gap-4">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-violet-400" />
                Como funciona o compartilhamento de streaming?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Você pode colar qualquer link de vídeo direto (formato <code>.mp4</code>,{' '}
                <code>.webm</code>), transmissões <code>.m3u8</code> ou qualquer link do{' '}
                <strong className="text-zinc-200">YouTube</strong>. O SyncRave sincroniza o tempo
                exato de reprodução e o áudio da chamada sem interrupções para todos na sala.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">URL do Vídeo ou Streaming *</label>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... ou https://site.com/filme.mp4"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Título do Filme / Vídeo (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Trailer Oficial / Filme da Noite"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Categoria</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-violet-500"
              >
                <option value="Streaming">Streaming Geral</option>
                <option value="Filmes">Filmes & Séries</option>
                <option value="Música & Lo-Fi">Música & Clipes</option>
                <option value="Trailers">Trailers & Jogos</option>
                <option value="Ao Vivo">Transmissão Ao Vivo</option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Transmitir na Sala</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
