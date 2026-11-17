import type { ChartState, ColorChartSize, TemplateId } from '../lib/types';
import { COLOR_CHART_SIZES, TEMPLATES } from '../lib/templates';

type Props = {
  chart: ChartState;
  exporting: boolean;
  onExport: () => void;
  onTemplate: (template: TemplateId) => void;
  onAlignmentSize: (size: ColorChartSize) => void;
  onTitle: (title: string) => void;
  onTextScale: (scale: number) => void;
};

export default function Toolbar({
  chart,
  exporting,
  onExport,
  onTemplate,
  onAlignmentSize,
  onTitle,
  onTextScale,
}: Props) {
  const textScale = Math.min(1.8, Math.max(0.7, chart.textScale ?? 1));
  const alignmentSize = chart.alignmentSize ?? 4;
  return (
    <div className="toolbar">
      <div className="template-picker" role="tablist" aria-label="Chart type">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            role="tab"
            aria-selected={chart.template === template.id}
            className={chart.template === template.id ? 'active' : ''}
            onClick={() => onTemplate(template.id)}
          >
            <span aria-hidden="true">{template.icon}</span>
            <span className="tab-full">{template.label}</span>
            <span className="tab-short">{template.short}</span>
          </button>
        ))}
      </div>

      {chart.template === 'alignment' && (
        <div className="grid-switch" role="group" aria-label="Color chart grid size">
          <span className="grid-switch-label" aria-hidden="true">
            Grid
          </span>
          {COLOR_CHART_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={alignmentSize === size ? 'active' : ''}
              aria-pressed={alignmentSize === size}
              onClick={() => onAlignmentSize(size)}
              title={`${size} × ${size} color chart`}
            >
              {size}×{size}
            </button>
          ))}
        </div>
      )}

      <input
        className="title-input"
        value={chart.title}
        onChange={(event) => onTitle(event.target.value)}
        placeholder="Chart title…"
        aria-label="Chart title"
      />

      <label className="text-scale">
        <span className="text-scale-label" aria-hidden="true">Aa</span>
        <input
          type="range"
          min={0.7}
          max={1.8}
          step={0.05}
          value={textScale}
          onChange={(event) => onTextScale(Number(event.target.value))}
          aria-label="Card text size"
        />
        <span className="text-scale-value">{Math.round(textScale * 100)}%</span>
      </label>

      <div className="toolbar-actions">
        <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
          {exporting ? 'Rendering…' : '⬇ Save PNG'}
        </button>
      </div>
    </div>
  );
}
