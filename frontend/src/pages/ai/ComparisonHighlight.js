import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ComparisonHighlight() {
  const [memoryIdA, setMemoryIdA] = useState('');
  const [memoryIdB, setMemoryIdB] = useState('');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body = {};
      if (memoryIdA) body.memoryIdA = memoryIdA;
      if (memoryIdB) body.memoryIdB = memoryIdB;
      if (textA) body.textA = textA;
      if (textB) body.textB = textB;

      const res = await fetch(`${API}/ai/comparison-highlight`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'AI service unavailable (OPENROUTER_API_KEY not set on server).', 'error');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Comparison failed');
      setResult(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Comparison Highlight</h1>
        <p>Compare two memories — surface shared themes, unique details, and emotional contrast.</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory A — ID (optional)</label>
          <input
            type="text"
            className="form-input"
            value={memoryIdA}
            onChange={(e) => setMemoryIdA(e.target.value)}
            placeholder="e.g. 12"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste text for Memory A</label>
          <textarea
            className="form-textarea"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="The summer we drove to the lake..."
            style={{ minHeight: '120px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Memory B — ID (optional)</label>
          <input
            type="text"
            className="form-input"
            value={memoryIdB}
            onChange={(e) => setMemoryIdB(e.target.value)}
            placeholder="e.g. 17"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste text for Memory B</label>
          <textarea
            className="form-textarea"
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Years later, we returned to the same lake..."
            style={{ minHeight: '120px' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Comparing...' : 'Compare Memories'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Comparing memories..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Comparison</div>
          <pre className="ai-output-story" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
}

export default ComparisonHighlight;
