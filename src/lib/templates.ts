import type { ChartState, Placement, TemplateId } from './types';

export const TEMPLATES: { id: TemplateId; label: string; short: string; icon: string }[] = [
  { id: 'alignment', label: 'Color chart', short: 'Color', icon: '🎨' },
  { id: 'tier', label: 'Tier list', short: 'Tiers', icon: '🏅' },
  { id: 'scatter', label: 'Scatter plot', short: 'Scatter', icon: '📈' },
];

export const TEMPLATE_DEFS: Record<TemplateId, { rows: number; cols: number }> = {
  alignment: { rows: 4, cols: 4 },
  tier: { rows: 6, cols: 5 },
  scatter: { rows: 1, cols: 1 },
};

export const TIER_COLORS = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#bfff7f', '#7fdfff', '#c9c9c9'];

// 4x4 card background colors: pink/red top-left, blue top-right,
// green bottom-left, yellow bottom-right, like the reference collage.
const CARD_COLORS: string[][] = [
  ['#ef8f8f', '#f4b0b0', '#b9d8f2', '#a3cbec'],
  ['#f1a2a2', '#f6b9b9', '#b2d3ef', '#abd0ed'],
  ['#b7d3b1', '#c8dfc0', '#f6e6a2', '#f8e998'],
  ['#a9cda3', '#c1dcb8', '#f7eaa6', '#f6e58f'],
];

export function cardColor(r: number, c: number): string {
  const row = Math.min(CARD_COLORS.length - 1, Math.max(0, r));
  const col = Math.min(CARD_COLORS[0].length - 1, Math.max(0, c));
  return CARD_COLORS[row][col];
}

export function defaultChart(template: TemplateId): ChartState {
  return {
    template,
    title: '',
    labels: { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' },
    tierLabels: ['S', 'A', 'B', 'C', 'D', 'F'],
    placements: {},
  };
}

export function cellToXY(cell: string, rows: number, cols: number): { x: number; y: number } {
  const [r, c] = cell.split('-').map(Number);
  return { x: ((c + 0.5) / cols) * 100, y: ((r + 0.5) / rows) * 100 };
}

export function xyToCell(x: number, y: number, rows: number, cols: number): string {
  const c = Math.min(cols - 1, Math.max(0, Math.floor((x / 100) * cols)));
  const r = Math.min(rows - 1, Math.max(0, Math.floor((y / 100) * rows)));
  return `${r}-${c}`;
}

/** Re-map placements when the user switches to another template. */
export function migratePlacements(
  placements: Record<string, Placement>,
  from: TemplateId,
  to: TemplateId,
): Record<string, Placement> {
  const toDef = TEMPLATE_DEFS[to];
  const out: Record<string, Placement> = {};
  const usedCells = new Set<string>();
  for (const [handle, p] of Object.entries(placements)) {
    if (to === 'scatter') {
      if (p.x != null && p.y != null) {
        out[handle] = { x: p.x, y: p.y, note: p.note, label: p.label, flipped: p.flipped };
      } else if (p.cell) {
        if (from === 'tier') {
          const r = Number(p.cell.split('-')[0]) || 0;
          out[handle] = {
            x: 50,
            y: ((r + 0.5) / TEMPLATE_DEFS.tier.rows) * 100,
            note: p.note,
            label: p.label,
            flipped: p.flipped,
          };
        } else {
          const fromDef = TEMPLATE_DEFS[from];
          out[handle] = { ...cellToXY(p.cell, fromDef.rows, fromDef.cols), note: p.note, label: p.label, flipped: p.flipped };
        }
      }
      continue;
    }
    let cell: string;
    if (p.x != null && p.y != null) {
      cell = xyToCell(p.x, p.y, toDef.rows, toDef.cols);
    } else if (p.cell) {
      const [rawR = 0, rawC = 0] = p.cell.split('-').map(Number);
      const r = Math.min(toDef.rows - 1, Math.max(0, rawR));
      const c =
        to === 'tier'
          ? 0
          : from === 'tier'
            ? Math.floor(toDef.cols / 2)
            : Math.min(toDef.cols - 1, Math.max(0, rawC));
      cell = `${r}-${c}`;
    } else {
      continue;
    }
    // The color chart holds exactly one person per cell.
    if (to === 'alignment') {
      if (usedCells.has(cell)) continue;
      usedCells.add(cell);
    }
    out[handle] = { cell, note: p.note, label: p.label, flipped: p.flipped };
  }
  return out;
}

/** Clamps saved charts to the current grid and removes duplicate cells on the color chart. */
export function normalizeChart(chart: ChartState): ChartState {
  if (chart.template !== 'alignment') return chart;

  const { rows, cols } = TEMPLATE_DEFS.alignment;
  const usedCells = new Set<string>();
  const placements: Record<string, Placement> = {};

  for (const [handle, p] of Object.entries(chart.placements)) {
    if (!p.cell) continue;
    const [rawR = 0, rawC = 0] = p.cell.split('-').map(Number);
    const cell = `${Math.min(rows - 1, Math.max(0, rawR))}-${Math.min(cols - 1, Math.max(0, rawC))}`;
    if (usedCells.has(cell)) continue;
    usedCells.add(cell);
    placements[handle] = { ...p, cell };
  }

  return { ...chart, placements };
}
