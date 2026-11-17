export function hashHue(value: string): number {
  let hue = 0;
  for (let i = 0; i < value.length; i++) hue = (hue * 31 + value.charCodeAt(i)) % 360;
  return hue;
}

export function initialsOf(name: string): string {
  const words = name.replace(/^@/, '').split(/[\s_.\-]+/).filter(Boolean);
  return (words.map((word) => word[0]).join('').slice(0, 2) || '?').toUpperCase();
}

/**
 * Routes avatars through a CORS-friendly image proxy. This keeps the UI and
 * the PNG export on the same source and works on networks where pbs.twimg.com
 * is blocked or rate-limited.
 */
export function proxyAvatarUrl(url: string): string {
  if (!url || url.startsWith('data:') || url.includes('images.weserv.nl') || url.includes('unavatar.io')) {
    return url;
  }
  const isHttps = url.startsWith('https://');
  const rest = url.replace(/^https?:\/\//, '');
  const target = (isHttps ? 'ssl:' : '') + rest;
  return `https://images.weserv.nl/?url=${encodeURIComponent(target)}&w=256&h=256&fit=cover`;
}

/** Fallback avatar source for a handle. */
export function fallbackAvatarUrl(handle: string): string {
  return `https://unavatar.io/x/${handle}`;
}

/** Circular initials avatar as an SVG data URL, used when no photo can load. */
export function initialsAvatarDataUrl(handle: string, name: string, size = 160): string {
  const hue = hashHue(handle || name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="hsl(${hue} 52% 54%)"/><text x="50" y="54" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${initialsOf(name)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
