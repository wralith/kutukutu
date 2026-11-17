import { useState, type FormEvent } from 'react';
import type { Profile } from '../lib/types';
import { fetchProfile } from '../lib/twitter';

type Props = {
  onAdd: (profile: Profile) => void;
  existing: string[];
};

export default function ProfileSearch({ onAdd, existing }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const profile = await fetchProfile(value);
      if (existing.includes(profile.handle)) {
        setError(`@${profile.handle} is already on the board.`);
      } else {
        onAdd(profile);
        setValue('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="profile-search" onSubmit={submit}>
      <div className="profile-search-row">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="@handle or profile URL"
          spellCheck={false}
          autoComplete="off"
          disabled={busy}
          aria-label="Twitter handle"
        />
        <button type="submit" disabled={busy || !value.trim()}>
          {busy ? '…' : 'Add'}
        </button>
      </div>
      {error && <p className="search-error">{error}</p>}
    </form>
  );
}
