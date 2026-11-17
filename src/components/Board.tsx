import { useRef, type CSSProperties, type DragEvent, type MouseEvent, type RefObject } from 'react';
import type { AxisLabels, ChartState, Placement, Profile } from '../lib/types';
import { TIER_COLORS, cardColor } from '../lib/templates';
import AvatarImg from './AvatarImg';

type BoardProps = {
  chart: ChartState;
  profiles: Record<string, Profile>;
  selected: string | null;
  onPlace: (handle: string, placement: Placement) => void;
  onUnplace: (handle: string) => void;
  onEdit: (handle: string) => void;
  onLabel: (key: keyof AxisLabels, value: string) => void;
  onTierLabel: (index: number, value: string) => void;
  /** Attached to the element that gets snapshotted for PNG export. */
  surfaceRef: RefObject<HTMLDivElement | null>;
};

function placedHandle(event: DragEvent): string | null {
  event.preventDefault();
  return event.dataTransfer.getData('text/plain') || null;
}

function PlacedChip({ profile, onUnplace }: { profile: Profile; onUnplace: () => void }) {
  return (
    <button
      type="button"
      className="placed-chip"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', profile.handle);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(event) => {
        event.stopPropagation();
        onUnplace();
      }}
      title={`${profile.name} (@${profile.handle}) — click to remove, drag to move`}
    >
      <span className="avatar-wrap">
        <AvatarImg profile={profile} size={28} />
      </span>
    </button>
  );
}

export default function Board(props: BoardProps) {
  const { chart, surfaceRef } = props;
  const textScale = Math.min(1.8, Math.max(0.7, chart.textScale ?? 1));
  return (
    <div className={`board board-${chart.template}`}>
      <div
        ref={surfaceRef}
        className="export-surface"
        style={{ '--card-text-scale': textScale } as CSSProperties}
      >
        {chart.title.trim() !== '' && <h1 className="chart-heading">{chart.title}</h1>}
        {chart.template === 'alignment' && <AlignmentBoard {...props} />}
        {chart.template === 'tier' && <TierBoard {...props} />}
        {chart.template === 'scatter' && <ScatterBoard {...props} />}
      </div>
    </div>
  );
}

function AxisLabelInput({
  className,
  value,
  placeholder,
  onChange,
}: {
  className: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      className={`axis-label ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}

function AlignmentBoard({ chart, profiles, selected, onPlace, onEdit }: BoardProps) {
  const size = chart.alignmentSize ?? 4;
  const rows = size;
  const cols = size;

  const byCell = new Map<string, { handle: string; profile: Profile; placement: Placement }>();
  for (const [handle, placement] of Object.entries(chart.placements)) {
    const profile = profiles[handle];
    if (profile && placement.cell) byCell.set(placement.cell, { handle, profile, placement });
  }

  return (
    <div
      className={`card-grid${size !== 4 ? ' is-large' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: rows * cols }, (_, index) => {
        const r = Math.floor(index / cols);
        const c = index % cols;
        const key = `${r}-${c}`;
        const entry = byCell.get(key);

        return (
          <div
            key={key}
            className={`card-cell${selected ? ' is-target' : ''}`}
            style={{ background: cardColor(r, c, size) }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const handle = placedHandle(event);
              if (handle) onPlace(handle, { cell: key });
            }}
            onClick={() => {
              if (selected) onPlace(selected, { cell: key });
            }}
          >
            {entry ? (
              <button
                type="button"
                className={`profile-card${entry.placement.flipped ? ' is-flipped' : ''}`}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', entry.handle);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (selected) {
                    onPlace(selected, { cell: key });
                    return;
                  }
                  onEdit(entry.handle);
                }}
                title={`${entry.profile.name} (@${entry.handle}) — click to edit`}
              >
                <span className="card-photo">
                  <AvatarImg profile={entry.profile} fill />
                </span>
                <span className="card-body">
                  <span className="card-name">
                    {entry.placement.label?.trim() || entry.profile.name}
                  </span>
                  {(entry.placement.note ?? '').trim() !== '' && (
                    <span className="card-notes">{entry.placement.note}</span>
                  )}
                </span>
              </button>
            ) : (
              <span className="card-empty" aria-hidden="true">
                +
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TierBoard({ chart, profiles, selected, onPlace, onUnplace, onTierLabel }: BoardProps) {
  const rows = Math.max(1, chart.tierLabels.length);
  const rowProfiles: Profile[][] = Array.from({ length: rows }, () => []);

  for (const [handle, placement] of Object.entries(chart.placements)) {
    const profile = profiles[handle];
    if (!profile || !placement.cell) continue;
    const r = Math.min(rows - 1, Math.max(0, Number(placement.cell.split('-')[0]) || 0));
    rowProfiles[r].push(profile);
  }

  return (
    <div className="tier-rows">
      {chart.tierLabels.map((label, index) => (
        <div
          key={index}
          className="tier-row"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const handle = placedHandle(event);
            if (handle) onPlace(handle, { cell: `${index}-0` });
          }}
          onClick={(event) => {
            if (!selected) return;
            if ((event.target as HTMLElement).closest('input, .placed-chip')) return;
            onPlace(selected, { cell: `${index}-0` });
          }}
        >
          <input
            className="tier-label"
            style={{ background: TIER_COLORS[index % TIER_COLORS.length] }}
            value={label}
            onChange={(event) => onTierLabel(index, event.target.value)}
            aria-label={`Tier ${index + 1} label`}
            spellCheck={false}
          />
          <div className="tier-area">
            {rowProfiles[index].map((profile) => (
              <PlacedChip
                key={profile.handle}
                profile={profile}
                onUnplace={() => onUnplace(profile.handle)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScatterBoard({ chart, profiles, selected, onPlace, onUnplace, onLabel }: BoardProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  function positionFromEvent(event: DragEvent | MouseEvent): { x: number; y: number } {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const clamp = (value: number) => Math.min(97, Math.max(3, value));
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    };
  }

  return (
    <div className="axis-frame">
      <AxisLabelInput
        className="axis-top"
        value={chart.labels.top}
        placeholder="top label"
        onChange={(value) => onLabel('top', value)}
      />
      <div className="axis-mid">
        <AxisLabelInput
          className="axis-left"
          value={chart.labels.left}
          placeholder="left"
          onChange={(value) => onLabel('left', value)}
        />
        <div
          ref={areaRef}
          className="scatter-area"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const handle = placedHandle(event);
            if (handle) onPlace(handle, positionFromEvent(event));
          }}
          onClick={(event) => {
            if (!selected) return;
            if ((event.target as HTMLElement).closest('.scatter-chip')) return;
            onPlace(selected, positionFromEvent(event));
          }}
        >
          <div className="scatter-axis scatter-axis-v" />
          <div className="scatter-axis scatter-axis-h" />
          {Object.entries(chart.placements).map(([handle, placement]) => {
            const profile = profiles[handle];
            if (!profile || placement.x == null || placement.y == null) return null;
            return (
              <div
                key={handle}
                className="scatter-chip"
                style={{ left: `${placement.x}%`, top: `${placement.y}%` }}
              >
                <PlacedChip profile={profile} onUnplace={() => onUnplace(handle)} />
                <span className="scatter-name">{profile.name}</span>
              </div>
            );
          })}
        </div>
        <AxisLabelInput
          className="axis-right"
          value={chart.labels.right}
          placeholder="right"
          onChange={(value) => onLabel('right', value)}
        />
      </div>
      <AxisLabelInput
        className="axis-bottom"
        value={chart.labels.bottom}
        placeholder="bottom label"
        onChange={(value) => onLabel('bottom', value)}
      />
    </div>
  );
}
