import { useCallback, useEffect, useRef, useState } from 'react';
import type { AxisLabels, ChartState, Placement, Profile, TemplateId } from './lib/types';
import { defaultChart, migratePlacements, normalizeChart } from './lib/templates';
import { exportNode } from './lib/exportImage';
import ProfileSearch from './components/ProfileSearch';
import Roster from './components/Roster';
import Board from './components/Board';
import Toolbar from './components/Toolbar';
import CardEditor from './components/CardEditor';

const STORAGE_KEY = 'kutukutu:v1';

type AppState = {
  profiles: Record<string, Profile>;
  chart: ChartState;
};

type SavedState = {
  v: 1;
  profiles: Profile[];
  chart: ChartState;
};

function savedToState(saved: SavedState): AppState {
  return {
    profiles: Object.fromEntries(saved.profiles.map((profile) => [profile.handle, profile])),
    chart: normalizeChart(saved.chart),
  };
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SavedState;
      if (data?.v === 1 && data.chart && Array.isArray(data.profiles)) return savedToState(data);
    }
  } catch {
    // Corrupt storage — start fresh.
  }

  return { profiles: {}, chart: defaultChart('alignment') };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'kutukutu'
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const { profiles, chart } = state;

  useEffect(() => {
    const saved: SavedState = { v: 1, profiles: Object.values(profiles), chart };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage full or blocked — not fatal.
    }
  }, [profiles, chart]);

  const setChart = useCallback(
    (update: (chart: ChartState) => ChartState) => {
      setState((current) => ({ ...current, chart: update(current.chart) }));
    },
    [],
  );

  const addProfile = useCallback((profile: Profile) => {
    setState((current) => ({
      ...current,
      profiles: { ...current.profiles, [profile.handle]: profile },
    }));
  }, []);

  const place = useCallback(
    (handle: string, placement: Placement) => {
      setSelected(null);
      setSheetOpen(false);
      setChart((current) => {
        const placements = { ...current.placements };

        // The color chart holds one person per cell: swap with the occupant,
        // or send the occupant back to the roster.
        if (current.template === 'alignment' && placement.cell) {
          const occupant = Object.entries(placements).find(
            ([other, p]) => other !== handle && p.cell === placement.cell,
          )?.[0];

          if (occupant) {
            const previous = placements[handle];
            if (previous?.cell) {
              placements[occupant] = { ...placements[occupant], cell: previous.cell };
            } else {
              delete placements[occupant];
            }
          }
        }

        placements[handle] = { ...placements[handle], ...placement };
        return { ...current, placements };
      });
    },
    [setChart],
  );

  const setNote = useCallback(
    (handle: string, note: string) => {
      setChart((current) => {
        const placement = current.placements[handle];
        if (!placement) return current;
        return {
          ...current,
          placements: { ...current.placements, [handle]: { ...placement, note } },
        };
      });
    },
    [setChart],
  );

  const setCardLabel = useCallback(
    (handle: string, label: string) => {
      setChart((current) => {
        const placement = current.placements[handle];
        if (!placement) return current;
        return {
          ...current,
          placements: { ...current.placements, [handle]: { ...placement, label } },
        };
      });
    },
    [setChart],
  );

  const toggleFlip = useCallback(
    (handle: string) => {
      setChart((current) => {
        const placement = current.placements[handle];
        if (!placement) return current;
        return {
          ...current,
          placements: {
            ...current.placements,
            [handle]: { ...placement, flipped: !placement.flipped },
          },
        };
      });
    },
    [setChart],
  );

  const unplace = useCallback(
    (handle: string) => {
      setChart((current) => {
        const placements = { ...current.placements };
        delete placements[handle];
        return { ...current, placements };
      });
    },
    [setChart],
  );

  const removeProfile = useCallback((handle: string) => {
    setSelected((current) => (current === handle ? null : current));
    setEditing((current) => (current === handle ? null : current));
    setState((current) => {
      const profilesNext = { ...current.profiles };
      delete profilesNext[handle];
      const placements = { ...current.chart.placements };
      delete placements[handle];
      return { profiles: profilesNext, chart: { ...current.chart, placements } };
    });
  }, []);

  const setTemplate = useCallback(
    (template: TemplateId) => {
      setChart((current) =>
        current.template === template
          ? current
          : {
              ...current,
              template,
              placements: migratePlacements(current.placements, current.template, template),
            },
      );
    },
    [setChart],
  );

  const setLabel = useCallback(
    (key: keyof AxisLabels, value: string) => {
      setChart((current) => ({ ...current, labels: { ...current.labels, [key]: value } }));
    },
    [setChart],
  );

  const setTierLabel = useCallback(
    (index: number, value: string) => {
      setChart((current) => ({
        ...current,
        tierLabels: current.tierLabels.map((label, i) => (i === index ? value : label)),
      }));
    },
    [setChart],
  );

  const selectPerson = useCallback((handle: string | null) => {
    setSelected(handle);
    if (handle) setSheetOpen(false);
  }, []);

  const handleExport = useCallback(async () => {
    const node = surfaceRef.current;
    if (!node) return;
    setExporting(true);
    try {
      const filename = `kutukutu-${slugify(chart.title || chart.template)}.png`;
      await exportNode(node, filename);
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'unknown error';
      alert(`Export failed: ${message}`);
    } finally {
      setExporting(false);
    }
  }, [chart.title, chart.template]);

  return (
    <div className={`app${sheetOpen ? ' sheet-open' : ''}`}>
      {sheetOpen && (
        <button
          type="button"
          className="sheet-backdrop"
          aria-label="Close people panel"
          onClick={() => setSheetOpen(false)}
        />
      )}

      <aside className={`sidebar${sheetOpen ? ' is-open' : ''}`} aria-label="People">
        <div className="brand">
          <span className="brand-mark">🧩</span> kutukutu
        </div>
        <ProfileSearch onAdd={addProfile} existing={Object.keys(profiles)} />
        <Roster
          profiles={profiles}
          chart={chart}
          selected={selected}
          onSelect={selectPerson}
          onUnplace={unplace}
          onRemove={removeProfile}
        />
        <p className="fineprint">
          Public Twitter data, stored in your browser only — no login, no server. On touch screens:
          tap a person, then tap a cell.
        </p>
      </aside>

      <main className="main">
        <div className="mobile-head">
          <div className="brand brand-mobile">
            <span className="brand-mark">🧩</span> kutukutu
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Rendering…' : '⬇ Save PNG'}
          </button>
        </div>

        <Toolbar
          chart={chart}
          exporting={exporting}
          onExport={handleExport}
          onTemplate={setTemplate}
          onTitle={(title) => setChart((current) => ({ ...current, title }))}
          onTextScale={(textScale) => setChart((current) => ({ ...current, textScale }))}
        />
        {selected && (
          <div className="selection-hint">
            <span>
              Placing <strong>{profiles[selected]?.name ?? selected}</strong> — tap a cell to
              drop them.
            </span>
            <button type="button" className="btn" onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        )}
        <Board
          chart={chart}
          profiles={profiles}
          selected={selected}
          onPlace={place}
          onUnplace={unplace}
          onEdit={setEditing}
          onLabel={setLabel}
          onTierLabel={setTierLabel}
          surfaceRef={surfaceRef}
        />
      </main>

      <button
        type="button"
        className={`people-fab${sheetOpen || editing ? ' is-hidden' : ''}`}
        onClick={() => setSheetOpen(true)}
      >
        + People
      </button>

      {editing && profiles[editing] && chart.placements[editing] && (
        <CardEditor
          profile={profiles[editing]}
          placement={chart.placements[editing]}
          onLabel={(label) => setCardLabel(editing, label)}
          onNote={(note) => setNote(editing, note)}
          onFlip={() => toggleFlip(editing)}
          onRemove={() => unplace(editing)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
