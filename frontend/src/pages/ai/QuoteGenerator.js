import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function QuoteGenerator() {
  const [theme, setTheme] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/ai/generate-quote`, {
        method: 'POST', headers, body: JSON.stringify({ theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getQuote = () => {
    if (!result) return '';
    if (typeof result.result === 'string') return result.result;
    if (typeof result === 'string') return result;
    return JSON.stringify(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getQuote());
    showToast('Quote copied!', 'success');
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Quote Generator</h1>
        <p>Generate inspirational quotes from memory themes</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Theme</label>
          <input
            className="form-input"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. family love, childhood adventures, friendship..."
          />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !theme.trim()}>
          {loading ? 'Generating...' : 'Generate Quote'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Crafting a quote..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Quote</div>
          <div className="ai-output-quote">{getQuote()}</div>
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
}

export default QuoteGenerator;
