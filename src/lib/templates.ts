import type { ChartState, ColorChartSize, Placement, TemplateId } from './types';

export const TEMPLATES: { id: TemplateId; label: string; short: string; icon: string }[] = [
  { id: 'alignment', label: 'Color chart', short: 'Color', icon: '🎨' },
  { id: 'tier', label: 'Tier list', short: 'Tiers', icon: '🏅' },
  { id: 'scatter', label: 'Scatter plot', short: 'Scatter', icon: '📈' },
];

export const COLOR_CHART_SIZES: ColorChartSize[] = [4, 6, 8];

export const TEMPLATE_DEFS: Record<TemplateId, { rows: number; cols: number }> = {
  alignment: { rows: 4, cols: 4 },
  tier: { rows: 6, cols: 5 },
  scatter: { rows: 1, cols: 1 },
};

/** Grid definition for a template, taking the color chart size into account. */
export function templateDef(template: TemplateId, alignmentSize: ColorChartSize = 4) {
  return template === 'alignment' ? { rows: alignmentSize, cols: alignmentSize } : TEMPLATE_DEFS[template];
}

export const TIER_COLORS = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#bfff7f', '#7fdfff', '#c9c9c9'];

// Card background colors: pink/red top-left, blue top-right, green bottom-left,
// yellow bottom-right, and a muted blend along the center cross, like the
// reference collage.
const CARD_COLORS_4: string[][] = [
  ['#ef8f8f', '#f4b0b0', '#b9d8f2', '#a3cbec'],
  ['#f1a2a2', '#f6b9b9', '#b2d3ef', '#abd0ed'],
  ['#b7d3b1', '#c8dfc0', '#f6e6a2', '#f8e998'],
  ['#a9cda3', '#c1dcb8', '#f7eaa6', '#f6e58f'],
];

// The 6x6 grid mirrors the reference collage: three columns per quadrant,
// with the center column/row blending the neighbouring hues.
const CARD_COLORS_6: string[][] = [
  ['#ef8a8a', '#f4a3a3', '#d9a7b4', '#a8c3e6', '#7cc4ee', '#7cc2ee'],
  ['#f3a0a0', '#f4b2b2', '#dbb1bf', '#b3cce9', '#9fd2f2', '#9ccff0'],
  ['#f2c3bb', '#f4c8c2', '#d6c3c6', '#c4cfdc', '#b7e1ea', '#b5dfe9'],
  ['#d0d8bf', '#d2d9c2', '#c7ccc8', '#c8ccc2', '#d8e8b0', '#d6e6ab'],
  ['#b7dcb1', '#c4e5bd', '#d3e7b8', '#f0edaf', '#f7ee9d', '#f5eb96'],
  ['#a5d99e', '#bce3b4', '#c9e5b3', '#f5ebb0', '#f8ed97', '#f6e98d'],
];

// The denser grid uses the same four corners, but fades toward the middle so
// the 2x2 quadrants stay readable at eight columns.
const CARD_COLORS_8: string[][] = [
  ['#f08484', '#f29a9a', '#f3abab', '#e8b9bd', '#b6c9e4', '#8fc7ee', '#82c4f0', '#80c2ef'],
  ['#f39494', '#f4a6a6', '#f5b4b4', '#e6c0c4', '#c2d2e9', '#a5d2f0', '#98cff1', '#96cdf0'],
  ['#f2a9a9', '#f3b6b6', '#f4c0c0', '#e3cbcb', '#ccd8e6', '#b8ddee', '#aedbee', '#acd9ed'],
  ['#f0b9b1', '#f2c3bb', '#f2cbc5', '#ded2d0', '#ccd4d8', '#c4dfe2', '#bedfe0', '#bcdde0'],
  ['#d5d9c3', '#d3dbc6', '#cfd6cd', '#ccd0cc', '#ccd1c3', '#d7e2bb', '#d9e5b4', '#d9e6ae'],
  ['#c4dcb9', '#c8e0bf', '#cbe3c7', '#cbdccb', '#d8e8bb', '#e6ebb1', '#e9edac', '#eaeeaa'],
  ['#b4d8a9', '#bcdfb3', '#c2e2bb', '#c6dfc0', '#dbecae', '#f0eea4', '#f4efa1', '#f5f09e'],
  ['#a5d49a', '#b1dba7', '#b9dfb0', '#c0ddb8', '#dceaa6', '#f2ed9a', '#f6ed94', '#f7ee90'],
];

export function cardColor(r: number, c: number, size: ColorChartSize = 4): string {
  const palette = size === 8 ? CARD_COLORS_8 : size === 6 ? CARD_COLORS_6 : CARD_COLORS_4;
  const row = Math.min(palette.length - 1, Math.max(0, r));
  const col = Math.min(palette[0].length - 1, Math.max(0, c));
  return palette[row][col];
}

export function defaultChart(template: TemplateId): ChartState {
  return {
    template,
    alignmentSize: 4,
    title: '',
    labels: { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' },
    tierLabels: ['S', 'A', 'B', 'C', 'D', 'F'],
    textScale: 1,
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
  fromSize: ColorChartSize = 4,
  toSize: ColorChartSize = 4,
): Record<string, Placement> {
  const toDef = templateDef(to, toSize);
  const fromDef = templateDef(from, fromSize);
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
            y: ((r + 0.5) / fromDef.rows) * 100,
            note: p.note,
            label: p.label,
            flipped: p.flipped,
          };
        } else {
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
      // Rows scale proportionally when the row count changes (e.g. an 8x8
      // color chart to a 6-tier list) so nobody piles up in the last row.
      const scaledRow =
        from === to
          ? rawR
          : Math.floor(
              ((Math.min(fromDef.rows - 1, Math.max(0, rawR)) + (from === 'tier' ? 0.5 : 0)) /
                fromDef.rows) *
                toDef.rows,
            );
      const r = Math.min(toDef.rows - 1, Math.max(0, scaledRow));
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

function nearestFreeCell(
  r: number,
  c: number,
  size: number,
  used: Set<string>,
): string | null {
  for (let distance = 0; distance < size * 2; distance += 1) {
    for (let dr = -distance; dr <= distance; dr += 1) {
      for (let dc = -distance; dc <= distance; dc += 1) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== distance) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
        const key = `${nr}-${nc}`;
        if (!used.has(key)) return key;
      }
    }
  }
  return null;
}

/**
 * Re-map color chart placements between grid sizes. Cells scale to the same
 * relative position; when two cards land in the same cell the later one moves
 * to the nearest free cell so nobody falls off the board.
 */
export function resizeAlignmentPlacements(
  placements: Record<string, Placement>,
  from: ColorChartSize,
  to: ColorChartSize,
): Record<string, Placement> {
  if (from === to) return placements;

  const scale = to / from;
  const used = new Set<string>();
  const out: Record<string, Placement> = {};

  for (const [handle, p] of Object.entries(placements)) {
    if (!p.cell) continue;
    const [rawR = 0, rawC = 0] = p.cell.split('-').map(Number);
    const r = Math.min(to - 1, Math.max(0, Math.floor(Math.min(from - 1, Math.max(0, rawR)) * scale)));
    const c = Math.min(to - 1, Math.max(0, Math.floor(Math.min(from - 1, Math.max(0, rawC)) * scale)));
    const cell = nearestFreeCell(r, c, to, used);
    if (!cell) continue;
    used.add(cell);
    out[handle] = { ...p, cell };
  }

  return out;
}

/** Clamps saved charts to the current grid and removes duplicate cells on the color chart. */
export function normalizeChart(chart: ChartState): ChartState {
  const alignmentSize: ColorChartSize =
    chart.alignmentSize === 6 || chart.alignmentSize === 8 ? chart.alignmentSize : 4;
  if (chart.template !== 'alignment') return { ...chart, alignmentSize };

  const { rows, cols } = templateDef('alignment', alignmentSize);
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

  return { ...chart, alignmentSize, placements };
}
