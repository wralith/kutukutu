import { useEffect, useState } from 'react';
import type { Profile } from '../lib/types';
import { fallbackAvatarUrl, hashHue, initialsOf, proxyAvatarUrl } from '../lib/avatar';

type Props = {
  profile: Profile;
  size?: number;
  /** Stretch to the parent box (used by the profile cards). */
  fill?: boolean;
};

export default function AvatarImg({ profile, size = 32, fill = false }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [profile.handle, profile.avatar]);

  if (failed) {
    return (
      <span
        className={`avatar avatar-fallback${fill ? ' avatar-fill' : ''}`}
        style={{
          background: `hsl(${hashHue(profile.handle)} 52% 54%)`,
          ...(fill ? {} : { width: size, height: size, fontSize: size * 0.4 }),
        }}
        aria-hidden="true"
      >
        {initialsOf(profile.name)}
      </span>
    );
  }

  // Proxy first (works when pbs.twimg.com is blocked), then unavatar.
  const source = [proxyAvatarUrl(profile.avatar), fallbackAvatarUrl(profile.handle)];

  return (
    <img
      className={`avatar${fill ? ' avatar-fill' : ''}`}
      src={source[0]}
      {...(fill ? {} : { width: size, height: size })}
      alt={profile.name}
      data-handle={profile.handle}
      loading="lazy"
      draggable={false}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallback === '1') {
          setFailed(true);
          return;
        }
        img.dataset.fallback = '1';
        img.src = source[1];
      }}
    />
  );
}
