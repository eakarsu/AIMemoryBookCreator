import React, { useState } from 'react';
import MemoryTimelineView from '../components/MemoryTimelineView';
import PhotoHeatmapView from '../components/PhotoHeatmapView';
import PrintablePDFExport from '../components/PrintablePDFExport';
import ThemeRulesEditor from '../components/ThemeRulesEditor';

const TABS = [
  { id: 'timeline', label: 'Memory Timeline', kind: 'VIZ' },
  { id: 'heatmap', label: 'Photo Heatmap', kind: 'VIZ' },
  { id: 'pdf', label: 'Printable PDF', kind: 'TOOL' },
  { id: 'themes', label: 'Theme Rules', kind: 'TOOL' },
];

function CustomViewsPage() {
  const [active, setActive] = useState('timeline');

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#0f172a', marginBottom: 4 }}>Memory Views</h1>
        <p style={{ color: '#64748b' }}>
          Custom visualizations and tools for organizing, printing and styling your memory book.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          borderBottom: '2px solid #e2e8f0',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            data-testid={`tab-${tab.id}`}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              color: active === tab.id ? '#3b82f6' : '#64748b',
              borderBottom: active === tab.id ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: -2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                background: tab.kind === 'VIZ' ? '#dbeafe' : '#fef3c7',
                color: tab.kind === 'VIZ' ? '#1e40af' : '#92400e',
                padding: '2px 6px',
                borderRadius: 3,
                marginRight: 6,
              }}
            >
              {tab.kind}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {active === 'timeline' && <MemoryTimelineView />}
        {active === 'heatmap' && <PhotoHeatmapView />}
        {active === 'pdf' && <PrintablePDFExport />}
        {active === 'themes' && <ThemeRulesEditor />}
      </div>
    </div>
  );
}

export default CustomViewsPage;
