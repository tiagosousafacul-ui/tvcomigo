export function getDeviceType(): 'iphone' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'iphone';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod|android|mobile/i.test(window.navigator.userAgent);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs > 0) {
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export function extractTwitchChannel(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:twitch\.tv\/)([\w\d_]+)/i);
  if (match && !['directory', 'videos', 'p', 'downloads'].includes(match[1].toLowerCase())) {
    return match[1];
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:vimeo\.com\/)(\d+)/i);
  return match ? match[1] : null;
}
