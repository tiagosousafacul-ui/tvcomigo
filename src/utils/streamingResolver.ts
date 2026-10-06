import { MediaItem, StreamingService } from '../types';
import { extractYouTubeId, extractTwitchChannel, extractVimeoId } from './device';
import { POPULAR_STREAMING_TITLES } from '../data/mediaCatalog';

export interface ResolvedStreamingMedia extends MediaItem {
  isHls?: boolean;
}

export function resolveStreamingMedia(rawUrl: string, customTitle?: string): MediaItem {
  const url = (rawUrl || '').trim();
  const lowerUrl = url.toLowerCase();

  // 1. YouTube
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      id: `yt_${ytId}_${Date.now()}`,
      title: customTitle?.trim() || `YouTube (${ytId})`,
      url: `https://www.youtube.com/watch?v=${ytId}`,
      type: 'youtube',
      service: 'youtube',
      serviceUrl: `https://www.youtube.com/watch?v=${ytId}`,
      poster: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      category: 'YouTube',
      description: 'Vídeo do YouTube sincronizado em alta definição.',
    };
  }

  // 2. Twitch TV
  const twitchChannel = extractTwitchChannel(url);
  if (twitchChannel) {
    return {
      id: `twitch_${twitchChannel}_${Date.now()}`,
      title: customTitle?.trim() || `Twitch: ${twitchChannel}`,
      url: `https://www.twitch.tv/${twitchChannel}`,
      type: 'stream',
      service: 'twitch',
      serviceUrl: `https://www.twitch.tv/${twitchChannel}`,
      poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      category: 'Twitch TV',
      description: `Transmissão ao vivo do canal ${twitchChannel} na Twitch.`,
    };
  }

  // 3. Vimeo
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return {
      id: `vimeo_${vimeoId}_${Date.now()}`,
      title: customTitle?.trim() || `Vimeo Video (${vimeoId})`,
      url: `https://player.vimeo.com/video/${vimeoId}`,
      type: 'video',
      service: 'direct',
      serviceUrl: url,
      category: 'Vimeo HD',
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
      description: 'Vídeo do Vimeo sincronizado com áudio em alta fidelidade.',
    };
  }

  // Google Drive
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com/file')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    const directUrl = fileId
      ? `https://drive.google.com/uc?export=download&id=${fileId}`
      : url;

    return {
      id: `drive_${Date.now()}`,
      title: customTitle?.trim() || (fileId ? `Google Drive (${fileId.slice(0, 8)}...)` : 'Vídeo do Google Drive'),
      url: directUrl,
      type: 'video',
      service: 'drive',
      serviceUrl: url,
      poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      category: 'Google Drive',
      description: 'Arquivo de vídeo na nuvem do Google Drive transmitido em alta velocidade.',
    };
  }

  // 4. Commercial Streamings: Netflix, Prime Video, Disney+, Max
  let commercialService: StreamingService | null = null;
  if (lowerUrl.includes('netflix.com')) commercialService = 'netflix';
  else if (lowerUrl.includes('primevideo.com') || lowerUrl.includes('amazon.')) commercialService = 'prime';
  else if (lowerUrl.includes('disneyplus.com') || lowerUrl.includes('disney.')) commercialService = 'disney';
  else if (lowerUrl.includes('max.com') || lowerUrl.includes('hbomax.com')) commercialService = 'max';
  else if (lowerUrl.includes('crunchyroll.com')) commercialService = 'crunchyroll';

  if (commercialService) {
    // Check if the user specified a title matching our catalog
    const matchedInCatalog = POPULAR_STREAMING_TITLES.find(
      (item) =>
        (item.service === commercialService &&
          customTitle &&
          item.title.toLowerCase().includes(customTitle.toLowerCase())) ||
        (item.serviceUrl && lowerUrl.includes(item.serviceUrl.toLowerCase()))
    );

    if (matchedInCatalog) {
      return {
        ...matchedInCatalog,
        id: `streaming_${Date.now()}`,
        url: url, // Real video chosen by the user!
        serviceUrl: url,
        trailerUrl: matchedInCatalog.trailerUrl || matchedInCatalog.url,
        type: 'video',
      };
    }

    // Generate clean friendly title from URL if no customTitle was given
    let derivedTitle = customTitle?.trim();
    if (!derivedTitle) {
      if (commercialService === 'netflix') derivedTitle = 'Vídeo Netflix';
      else if (commercialService === 'prime') derivedTitle = 'Vídeo Prime Video';
      else if (commercialService === 'disney') derivedTitle = 'Vídeo Disney+';
      else if (commercialService === 'max') derivedTitle = 'Vídeo Max (HBO)';
      else if (commercialService === 'crunchyroll') derivedTitle = 'Anime Crunchyroll';
      else derivedTitle = 'Streaming Oficial';
    }

    const defaultForService = POPULAR_STREAMING_TITLES.find((item) => item.service === commercialService);
    return {
      id: `streaming_${Date.now()}`,
      title: derivedTitle,
      url: url, // Real video chosen by the user!
      serviceUrl: url,
      trailerUrl: defaultForService?.trailerUrl,
      poster: defaultForService?.poster || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80',
      service: commercialService,
      type: 'video',
      category: defaultForService?.category || commercialService,
      description: `Reprodução sincronizada oficial de ${derivedTitle} na plataforma ${commercialService}.`,
    };
  }

  // 5. HLS (.m3u8) or Direct MP4 / WebM video stream
  const isHls = lowerUrl.includes('.m3u8');
  const isVideoExt = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg');

  return {
    id: `direct_${Date.now()}`,
    title: customTitle?.trim() || (isHls ? 'Transmissão HLS Ao Vivo' : 'Streaming de Vídeo Direto'),
    url: url,
    type: 'video',
    service: 'direct',
    serviceUrl: url,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    category: isHls ? 'HLS Stream' : 'Vídeo Direto',
    description: isHls
      ? 'Fluxo HLS (.m3u8) decodificado com aceleração de hardware e baixa latência.'
      : 'Vídeo reproduzido e sincronizado diretamente em alta definição.',
  };
}
