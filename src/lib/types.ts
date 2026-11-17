export type Profile = {
  /** Lowercase handle without the @. */
  handle: string;
  /** Display name as shown on Twitter, or "@handle" when only the avatar is known. */
  name: string;
  /** Avatar URL. */
  avatar: string;
};

export type TemplateId = 'alignment' | 'tier' | 'scatter';

/** Color chart grid size. */
export type ColorChartSize = 4 | 6 | 8;

/** Grid templates store a cell key such as "2-3"; scatter stores percentages. */
export type Placement = {
  cell?: string;
  x?: number;
  y?: number;
  /** Card text shown under the name on the color chart. */
  note?: string;
  /** Custom card title; falls back to the profile display name. */
  label?: string;
  /** Put the photo on the right side of the card instead of the left. */
  flipped?: boolean;
};

export type AxisLabels = {
  top: string;
  bottom: string;
  left: string;
  right: string;
};

export type ChartState = {
  template: TemplateId;
  /** Color chart grid: 4x4 (default), 6x6 or 8x8. */
  alignmentSize?: ColorChartSize;
  title: string;
  labels: AxisLabels;
  tierLabels: string[];
  /** Multiplier for the card notes text, 0.7–1.8. */
  textScale?: number;
  /** handle -> placement */
  placements: Record<string, Placement>;
};
