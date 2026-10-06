import { MediaItem } from '../types';
import { POPULAR_STREAMING_TITLES } from './mediaCatalog';

export interface Top10Entry {
  rank: number;
  media: MediaItem;
  trendBadge: string;
  relevance: number; // e.g. 99%
  genre: string;
  year: number;
  ageRating: string;
  movement: 'up' | 'new' | 'hot' | 'stable';
  movementText: string;
}

// Pseudo-random deterministic generator for daily rotation based on date seed
function getDailySeed(date: Date): number {
  // Use UTC or Brazil timezone date
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 372 + m * 31 + d;
}

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const GENRE_MAPPING: Record<string, string> = {
  'netflix-stranger-things': 'Ficção Científica • Terror • Aventura',
  'netflix-squid-game': 'Suspense • Drama Psicológico',
  'netflix-cyberpunk': 'Anime • Ação • Distopia',
  'netflix-wednesday': 'Comédia Sombria • Fantasia • Mistério',
  'netflix-red-notice': 'Ação • Comédia • Assalto',
  'netflix-glass-onion': 'Mistério • Investigação • Comédia',
  'prime-the-boys': 'Super-Heróis • Ação • Sátira',
  'prime-fallout': 'Pós-Apocalíptico • Aventura • Sci-Fi',
  'disney-deadpool': 'Marvel • Ação • Comédia 18+',
  'disney-avatar': 'Ficção Científica • Aventura Épica',
  'disney-moana': 'Animação • Aventura • Musical',
  'disney-inside-out': 'Animação • Família • Comédia',
  'max-the-last-of-us': 'Drama • Sobrevivência • Suspense',
  'max-house-of-dragon': 'Fantasia Épica • Drama Medieval',
  'crunchyroll-one-piece': 'Anime Shonen • Piratas • Aventura',
  'direct-sintonia-verao': 'Drama • Música • Cultura Urbana',
  'direct-big-buck-bunny': 'Animação 4K • Curta Clássico',
  'direct-elephants-dream': 'Sci-Fi 4K • Computação Gráfica',
};

const AGE_RATINGS: Record<string, string> = {
  'netflix-stranger-things': '16+',
  'netflix-squid-game': '18+',
  'netflix-cyberpunk': '18+',
  'netflix-wednesday': '14+',
  'netflix-red-notice': '14+',
  'netflix-glass-onion': '14+',
  'prime-the-boys': '18+',
  'prime-fallout': '18+',
  'disney-deadpool': '18+',
  'disney-avatar': '14+',
  'disney-moana': 'Livre',
  'disney-inside-out': 'Livre',
  'max-the-last-of-us': '18+',
  'max-house-of-dragon': '18+',
  'crunchyroll-one-piece': '14+',
  'direct-sintonia-verao': '16+',
  'direct-big-buck-bunny': 'Livre',
  'direct-elephants-dream': '12+',
};

export function getDailyTop10(referenceDate: Date = new Date()): {
  dateFormatted: string;
  items: Top10Entry[];
  spotlight: Top10Entry;
} {
  const seed = getDailySeed(referenceDate);
  const rng = seededRandom(seed);

  // Copy candidate titles from catalog
  const pool = [...POPULAR_STREAMING_TITLES];

  // Fisher-Yates shuffle with deterministic daily seed
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick top 10 items
  const selected = pool.slice(0, 10);

  const movements: Array<'up' | 'new' | 'hot' | 'stable'> = ['hot', 'up', 'new', 'up', 'stable', 'up', 'new', 'stable', 'up', 'stable'];
  const movementTexts = [
    '🔥 Líder de audiência hoje',
    '⬆ Subiu 2 posições',
    '✨ Estreia no Top 10',
    '⬆ Em alta no Brasil',
    '⭐ Firme no ranking',
    '⬆ Mais assistido da tarde',
    '⚡ Tendência do momento',
    '🍿 Favorito das salas',
    '⬆ Bombando no chat',
    '🎬 Destaque da semana',
  ];

  const items: Top10Entry[] = selected.map((media, idx) => {
    const rank = idx + 1;
    const relevance = Math.max(90, 99 - Math.floor(idx * 0.8) - Math.floor(rng() * 2));
    const genre = GENRE_MAPPING[media.id] || (media.kind === 'filme' ? 'Filme • Destaque' : 'Série • Destaque');
    const ageRating = AGE_RATINGS[media.id] || '14+';
    const movement = movements[idx % movements.length];
    const movementText = movementTexts[idx % movementTexts.length];
    const year = 2024 - (idx % 3);

    return {
      rank,
      media,
      trendBadge: rank === 1 ? '🔥 #1 EM ALTA NO BRASIL' : `#${rank} em Alta`,
      relevance,
      genre,
      year,
      ageRating,
      movement,
      movementText,
    };
  });

  const dateFormatted = referenceDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return {
    dateFormatted: dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1),
    items,
    spotlight: items[0],
  };
}
