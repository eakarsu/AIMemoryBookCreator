import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function MemoryTimelineView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/custom-views/timeline`, {
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

  if (loading) return <div style={{ padding: 20 }}>Loading timeline...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!data || !data.timeline) return <div style={{ padding: 20 }}>No timeline data</div>;

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Memory Timeline</h3>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        {data.total} events across {data.periods} periods
      </p>
      <div style={{ position: 'relative', paddingLeft: 30, borderLeft: '3px solid #3b82f6' }}>
        {data.timeline.map((group) => (
          <div key={group.period} style={{ marginBottom: 24 }}>
            <div
              style={{
                position: 'absolute',
                left: -10,
                width: 17,
                height: 17,
                borderRadius: '50%',
                background: '#3b82f6',
                border: '3px solid #fff',
                boxShadow: '0 0 0 1px #3b82f6',
              }}
            />
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{group.period}</div>
            {group.events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 8,
                  borderLeft: `4px solid ${ev.color}`,
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{ev.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {new Date(ev.date).toLocaleDateString()} — {ev.category}
                </div>
                {ev.description && (
                  <div style={{ fontSize: 13, color: '#334155', marginTop: 6 }}>{ev.description}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MemoryTimelineView;
