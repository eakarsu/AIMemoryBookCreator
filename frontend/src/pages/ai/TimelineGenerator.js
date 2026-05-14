import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function TimelineGenerator() {
  const [memoryBookId, setMemoryBookId] = useState('');
  const [memories, setMemories] = useState('');
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
      if (memoryBookId) body.memoryBookId = memoryBookId;
      if (memories) {
        try {
          body.memories = JSON.parse(memories);
        } catch {
          body.memories = memories.split('\n').filter(Boolean);
        }
      }
      const res = await fetch(`${API}/ai/generate-timeline`, {
        method: 'POST', headers, body: JSON.stringify(body),
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

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Timeline Generator</h1>
        <p>Build a chronological timeline with era grouping and a narrative arc.</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Book ID (optional)</label>
          <input
            type="text"
            className="form-input"
            value={memoryBookId}
            onChange={(e) => setMemoryBookId(e.target.value)}
            placeholder="Pull memories from a memory book"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste memories (one per line, or JSON array)</label>
          <textarea
            className="form-textarea"
            value={memories}
            onChange={(e) => setMemories(e.target.value)}
            placeholder={'1995 - Started college\n1999 - Graduated\n2001 - First job'}
            style={{ minHeight: '180px' }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Timeline'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Building your timeline..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Timeline</div>
          <pre className="ai-output-story" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
}

export default TimelineGenerator;
