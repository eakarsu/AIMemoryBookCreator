import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function PhotoHeatmapView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/custom-views/heatmap`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading heatmap...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 20 }}>No heatmap data</div>;

  const getOpacity = (val) => (data.max > 0 ? 0.15 + (val / data.max) * 0.85 : 0.15);

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Photo Theme / Category Heatmap</h3>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        {data.total} total photos across {data.categories.length} categories
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 2, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Category</th>
              {data.months.map((m) => (
                <th
                  key={m}
                  style={{ padding: '8px 4px', color: '#475569', fontWeight: 600, width: 38, textAlign: 'center' }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.categories.map((cat) => (
              <tr key={cat.category}>
                <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0f172a' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: cat.color,
                      marginRight: 6,
                    }}
                  />
                  {cat.category}
                </td>
                {cat.counts.map((v, i) => (
                  <td
                    key={i}
                    title={`${cat.category} - ${data.months[i]}: ${v}`}
                    style={{
                      width: 36,
                      height: 36,
                      textAlign: 'center',
                      background: v > 0 ? `${cat.color}${Math.round(getOpacity(v) * 255).toString(16).padStart(2, '0')}` : '#f1f5f9',
                      borderRadius: 4,
                      color: v > data.max / 2 ? '#fff' : '#0f172a',
                      fontWeight: 600,
                    }}
                  >
                    {v || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
          <span
            key={o}
            style={{
              width: 16,
              height: 16,
              background: `rgba(59, 130, 246, ${o})`,
              borderRadius: 3,
              display: 'inline-block',
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default PhotoHeatmapView;
