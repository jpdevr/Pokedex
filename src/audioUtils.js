export function toSafeAudioUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  const fallbackBase = 'https://pokeapi.co/';
  const baseUrl = typeof window !== 'undefined' ? window.location.href : fallbackBase;

  try {
    const parsed = new URL(trimmedUrl, baseUrl);
    const currentLocation = typeof window !== 'undefined' ? window.location : null;
    const sameOrigin = currentLocation ? parsed.origin === currentLocation.origin : false;
    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '::1' ||
      parsed.hostname === '[::1]';

    if (parsed.protocol === 'http:') {
      if (!sameOrigin && !isLocalHost) {
        parsed.protocol = 'https:';
      }
    }

    const allowHttp = parsed.protocol === 'http:' && (sameOrigin || isLocalHost);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'data:' && parsed.protocol !== 'blob:' && !allowHttp) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
