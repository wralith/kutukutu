import type { ChartState, TemplateId } from '../lib/types';
import { TEMPLATES } from '../lib/templates';

type Props = {
  chart: ChartState;
  exporting: boolean;
  onExport: () => void;
  onTemplate: (template: TemplateId) => void;
  onTitle: (title: string) => void;
};

export default function Toolbar({ chart, exporting, onExport, onTemplate, onTitle }: Props) {
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

      <input
        className="title-input"
        value={chart.title}
        onChange={(event) => onTitle(event.target.value)}
        placeholder="Chart title…"
        aria-label="Chart title"
      />

      <div className="toolbar-actions">
        <button type="button" className="btn btn-primary" onClick={onExport} disabled={exporting}>
          {exporting ? 'Rendering…' : '⬇ Save PNG'}
        </button>
      </div>
    </div>
  );
}
