import type { ChartState, Profile } from '../lib/types';
import AvatarImg from './AvatarImg';

type Props = {
  profiles: Record<string, Profile>;
  chart: ChartState;
  selected: string | null;
  onSelect: (handle: string | null) => void;
  onUnplace: (handle: string) => void;
  onRemove: (handle: string) => void;
};

export default function Roster({
  profiles,
  chart,
  selected,
  onSelect,
  onUnplace,
  onRemove,
}: Props) {
  const list = Object.values(profiles);

  return (
    <div
      className="roster"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('text/plain')) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const handle = event.dataTransfer.getData('text/plain');
        if (handle && chart.placements[handle]) onUnplace(handle);
      }}
    >
      <div className="roster-head">
        <h2>
          Profiles <span>{list.length}</span>
        </h2>
        <small>Tap to select · tap a card to edit</small>
      </div>

      {list.length === 0 && (
        <p className="empty">No profiles yet — search a handle above to get started.</p>
      )}

      <ul>
        {list.map((profile) => {
          const placed = Boolean(chart.placements[profile.handle]);
          return (
            <li key={profile.handle} className={selected === profile.handle ? 'selected' : ''}>
              <button
                type="button"
                className={`roster-chip${placed ? ' placed' : ''}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', profile.handle);
                  event.dataTransfer.effectAllowed = 'copyMove';
                }}
                onClick={() => onSelect(selected === profile.handle ? null : profile.handle)}
                title={`${profile.name} (${profile.handle})`}
              >
                <AvatarImg profile={profile} size={30} />
                <span className="chip-text">
                  <span className="chip-name">{profile.name}</span>
                  <span className="chip-handle">{profile.handle}</span>
                </span>
                {placed && <span className="chip-badge">on board</span>}
              </button>
              <button
                type="button"
                className="chip-remove"
                onClick={() => onRemove(profile.handle)}
                title={`Remove ${profile.name} from the list`}
                aria-label={`Remove ${profile.name}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
