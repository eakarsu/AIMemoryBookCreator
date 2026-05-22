import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3001/api';

function ThemeRulesEditor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    layout: 'grid-2x2',
    pageSize: 'A4',
    fontFamily: 'sans-serif',
    primary: '#3b82f6',
    secondary: '#f1f5f9',
    accent: '#f59e0b',
    text: '#0f172a',
  });

  const token = localStorage.getItem('token');
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/custom-views/themes`, { headers: authH });
      const d = await r.json();
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setEditing(null);
    setForm({
      name: '',
      layout: 'grid-2x2',
      pageSize: 'A4',
      fontFamily: 'sans-serif',
      primary: '#3b82f6',
      secondary: '#f1f5f9',
      accent: '#f59e0b',
      text: '#0f172a',
    });
  };

  const handleSave = async () => {
    if (!form.name) {
      alert('Name required');
      return;
    }
    const body = JSON.stringify({
      name: form.name,
      layout: form.layout,
      pageSize: form.pageSize,
      fontFamily: form.fontFamily,
      colorScheme: { primary: form.primary, secondary: form.secondary, accent: form.accent, text: form.text },
    });
    try {
      if (editing) {
        await fetch(`${API}/custom-views/themes/${editing}`, { method: 'PUT', headers: authH, body });
      } else {
        await fetch(`${API}/custom-views/themes`, { method: 'POST', headers: authH, body });
      }
      reset();
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name,
      layout: item.layout,
      pageSize: item.pageSize,
      fontFamily: item.fontFamily,
      primary: item.colorScheme.primary,
      secondary: item.colorScheme.secondary,
      accent: item.colorScheme.accent,
      text: item.colorScheme.text,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this theme?')) return;
    await fetch(`${API}/custom-views/themes/${id}`, { method: 'DELETE', headers: authH });
    load();
  };

  if (loading) return <div style={{ padding: 20 }}>Loading themes...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Theme / Template Rules Editor</h3>
      <p style={{ color: '#64748b', fontSize: 14 }}>
        Create and manage layout + color scheme templates for your memory books.
      </p>

      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 6, marginBottom: 20 }}>
        <h4 style={{ marginTop: 0 }}>{editing ? 'Edit Theme' : 'New Theme'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            placeholder="Theme name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 4 }}
          />
          <select
            value={form.layout}
            onChange={(e) => setForm({ ...form, layout: e.target.value })}
            style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 4 }}
          >
            {(data.layoutOptions || []).map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            value={form.pageSize}
            onChange={(e) => setForm({ ...form, pageSize: e.target.value })}
            style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 4 }}
          >
            {(data.pageSizeOptions || []).map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            value={form.fontFamily}
            onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
            style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 4 }}
          >
            {(data.fontOptions || []).map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {['primary', 'secondary', 'accent', 'text'].map((k) => (
            <label key={k} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {k}:
              <input
                type="color"
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                style={{ width: 32, height: 28, border: 'none', cursor: 'pointer' }}
              />
            </label>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {editing ? 'Update' : 'Create'}
          </button>
          {editing && (
            <button
              onClick={reset}
              style={{ background: '#94a3b8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <h4>Saved Themes ({data.count})</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {data.items.map((it) => (
          <div
            key={it.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: 12,
              background: it.colorScheme.secondary,
            }}
          >
            <div style={{ fontWeight: 700, color: it.colorScheme.text }}>{it.name}</div>
            <div style={{ fontSize: 12, color: it.colorScheme.text, opacity: 0.8 }}>
              {it.layout} • {it.pageSize} • {it.fontFamily}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {Object.entries(it.colorScheme).map(([k, v]) => (
                <span key={k} title={k} style={{ background: v, width: 18, height: 18, borderRadius: 3, border: '1px solid #00000020' }} />
              ))}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <button
                onClick={() => handleEdit(it)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(it.id)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThemeRulesEditor;
