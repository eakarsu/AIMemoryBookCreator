import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function SummaryGenerator() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/ai/generate-summary`, {
        method: 'POST', headers, body: JSON.stringify({ memories: text.split('\n').filter(l => l.trim()).map(l => ({ content: l })) }),
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

  const getSummary = () => {
    if (!result) return '';
    if (typeof result.result === 'string') return result.result;
    if (typeof result === 'string') return result;
    return JSON.stringify(result, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSummary());
    showToast('Summary copied!', 'success');
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Summary Generator</h1>
        <p>Summarize your memory collections into concise overviews</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memories Text</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste multiple memories or a long description to summarize..."
            style={{ minHeight: '180px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Creating summary..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Summary</div>
          <div className="ai-output" style={{ lineHeight: '1.9' }}>{getSummary()}</div>
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
}

export default SummaryGenerator;
