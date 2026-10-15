export const OFFICIAL_DOMAIN = 'https://tvcomigo.vercel.app';

export function normalizeRoomId(id: string): string {
  if (!id) return '';
  return id
    .trim()
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/^\?room=/, '')
    .replace(/^room=/, '')
    .replace(/[^a-z0-9_-]/g, '');
}

export function extractRoomIdFromLocation(): string {
  if (typeof window === 'undefined') return '';
  try {
    // 1. Search params (?room=...)
    const searchParams = new URLSearchParams(window.location.search);
    const queryRoom = searchParams.get('room');
    if (queryRoom) {
      return normalizeRoomId(queryRoom);
    }
    // 2. Hash (#room=... or #rave-...)
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace('#', '').trim();
      if (cleanHash.startsWith('room=')) {
        return normalizeRoomId(cleanHash.replace('room=', ''));
      }
      if (cleanHash.includes('rave-') || cleanHash.length >= 3) {
        return normalizeRoomId(cleanHash);
      }
    }
    // 3. Pathname if formatted as /room/...
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart.startsWith('rave-')) {
        return normalizeRoomId(lastPart);
      }
    }
    return '';
  } catch (_) {
    return '';
  }
}

export function getPublicShareUrl(roomId: string): string {
  const cleanId = normalizeRoomId(roomId);
  // Always prioritize the official production domain https://tvcomigo.vercel.app
  return `${OFFICIAL_DOMAIN}/?room=${cleanId}`;
}

export function getCurrentOriginShareUrl(roomId: string): string {
  const cleanId = normalizeRoomId(roomId);
  if (typeof window === 'undefined') {
    return `${OFFICIAL_DOMAIN}/?room=${cleanId}`;
  }
  let origin = window.location.origin;
  if (origin.includes('-dev-')) {
    origin = origin.replace('-dev-', '-pre-');
  }
  return `${origin}/?room=${cleanId}`;
}

export function getWhatsAppShareUrl(roomId: string, roomTitle: string): string {
  const shareUrl = getPublicShareUrl(roomId);
  const cleanId = normalizeRoomId(roomId);
  const text = `🍿 Vem assistir comigo no TV Comigo!\n🎬 Sala: ${roomTitle}\n🔑 Código: ${cleanId}\n\n👉 Acesse agora: ${shareUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function getTelegramShareUrl(roomId: string, roomTitle: string): string {
  const shareUrl = getPublicShareUrl(roomId);
  const cleanId = normalizeRoomId(roomId);
  const text = `🎬 Assistir no TV Comigo: ${roomTitle} (Código: ${cleanId})`;
  return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
}

