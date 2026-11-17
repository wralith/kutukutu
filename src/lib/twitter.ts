import type { Profile } from './types';

const cache = new Map<string, Profile>();

/** Accepts "@jack", "jack", "x.com/jack" or "twitter.com/jack/..." and returns "jack". */
export function normalizeHandle(input: string): string {
  let value = input.trim();
  const fromUrl = value.match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/i);
  if (fromUrl) value = fromUrl[1];
  return value.replace(/^@+/, '').toLowerCase();
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9_]{1,15}$/.test(handle);
}

function upgradeAvatar(url: string): string {
  // pbs.twimg.com serves several sizes; _normal is tiny, _400x400 looks sharp.
  return url.replace(/_(normal|bigger|mini)\./, '_400x400.');
}

type FxResponse = {
  code?: number;
  user?: {
    screen_name?: string;
    name?: string;
    avatar_url?: string | null;
  };
};

/**
 * Fetches a public profile without any API key:
 * 1) fxtwitter's public API (CORS-enabled, returns name + avatar).
 * 2) unavatar.io as an avatar-only fallback, which also verifies the account exists.
 */
export async function fetchProfile(input: string): Promise<Profile> {
  const handle = normalizeHandle(input);
  if (!isValidHandle(handle)) {
    throw new Error('That doesn’t look like a valid X/Twitter handle.');
  }

  const cached = cache.get(handle);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.fxtwitter.com/${handle}`);
    if (res.ok) {
      const data = (await res.json()) as FxResponse;
      const user = data.user;
      if (Number(data.code) === 200 && user?.screen_name) {
        const profile: Profile = {
          handle: user.screen_name.toLowerCase(),
          name: user.name || handle,
          avatar: user.avatar_url
            ? upgradeAvatar(user.avatar_url)
            : `https://unavatar.io/x/${handle}`,
        };
        cache.set(profile.handle, profile);
        return profile;
      }
    }
  } catch {
    // API unreachable or returned HTML (e.g. a redirect for a missing user).
  }

  const fallbackUrl = `https://unavatar.io/x/${handle}?fallback=false`;
  const fallback = await fetch(fallbackUrl).catch(() => null);
  if (fallback?.ok) {
    const profile: Profile = { handle, name: handle, avatar: fallbackUrl };
    cache.set(handle, profile);
    return profile;
  }

  throw new Error(
    `Couldn’t find @${handle}. The account may not exist, or the public profile endpoints are unavailable right now.`,
  );
}
