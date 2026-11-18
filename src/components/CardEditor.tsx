import type { ColorChartSize, Placement, Profile } from '../lib/types';
import { cardColor } from '../lib/templates';
import AvatarImg from './AvatarImg';
import FitText from './FitText';

type Props = {
  profile: Profile;
  placement: Placement;
  /** Color chart grid size, so the preview matches the card's cell. */
  colorSize?: ColorChartSize;
  onLabel: (label: string) => void;
  onNote: (note: string) => void;
  onFlip: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export default function CardEditor({
  profile,
  placement,
  colorSize = 4,
  onLabel,
  onNote,
  onFlip,
  onRemove,
  onClose,
}: Props) {
  const [row = 0, col = 0] = (placement.cell ?? '0-0').split('-').map(Number);
  const color = cardColor(row, col, colorSize);
  const note = placement.note ?? '';
  const label = placement.label ?? profile.name;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card-editor"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${profile.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="editor-head">
          <AvatarImg profile={profile} size={40} />
          <div className="editor-identity">
            <span className="editor-name">{profile.name}</span>
            <span className="editor-handle">{profile.handle}</span>
          </div>
          <button type="button" className="editor-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="editor-preview">
          <div
            className={`profile-card is-preview${placement.flipped ? ' is-flipped' : ''}`}
            style={{ background: color }}
          >
            <span className="card-photo">
              <AvatarImg profile={profile} fill />
            </span>
            <span className="card-body">
              <FitText
                className="card-name"
                text={label.trim() || profile.name}
                matchPhoto
              />
              {note.trim() !== '' && <FitText className="card-notes" text={note} />}
            </span>
          </div>
        </div>

        <label className="editor-label" htmlFor="card-name">
          Card name
        </label>
        <input
          id="card-name"
          className="editor-input"
          value={label}
          onChange={(event) => onLabel(event.target.value)}
          placeholder={profile.name}
          spellCheck={false}
        />

        <label className="editor-label" htmlFor="card-note">
          Card text
        </label>
        <textarea
          id="card-note"
          className="editor-textarea"
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder={'One line per point, e.g.\n- funny\n- chaotic good'}
          rows={5}
        />

        <div className="editor-actions">
          <button type="button" className="btn" onClick={onFlip}>
            {placement.flipped ? 'Photo on left' : 'Photo on right'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            Remove
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
