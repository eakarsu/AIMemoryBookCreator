import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function PrintablePDFExport() {
  const [title, setTitle] = useState('My Memory Book');
  const [bookId, setBookId] = useState('');
  const [status, setStatus] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setStatus('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (title) params.set('title', title);
      if (bookId) params.set('bookId', bookId);
      const url = `${API}/custom-views/pdf?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `${title.replace(/[^a-z0-9_-]+/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dlUrl);
      setStatus('PDF downloaded successfully');
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <h3 style={{ marginTop: 0, color: '#0f172a' }}>Printable Memory Book (PDF)</h3>
      <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>
        Generate a printable PDF version of your memory book with cover and chronological pages.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
          Book Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
          Book ID (optional)
        </label>
        <input
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          placeholder="Leave empty to include all memories"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          background: downloading ? '#94a3b8' : '#3b82f6',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: downloading ? 'not-allowed' : 'pointer',
        }}
      >
        {downloading ? 'Generating...' : 'Download PDF'}
      </button>

      {status && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: status.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
            color: status.startsWith('Error') ? '#991b1b' : '#166534',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default PrintablePDFExport;
