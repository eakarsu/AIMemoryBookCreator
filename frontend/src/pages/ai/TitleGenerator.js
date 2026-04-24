import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function TitleGenerator() {
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
      const res = await fetch(`${API}/ai/generate-title`, {
        method: 'POST', headers, body: JSON.stringify({ memoryText: text }),
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

  const getTitles = () => {
    if (!result) return [];
    if (typeof result.result === 'string') return result.result.split('\n').filter(l => l.trim());
    if (typeof result === 'string') return result.split('\n').filter(l => l.trim());
    return [JSON.stringify(result)];
  };

  const handleCopy = (title) => {
    navigator.clipboard.writeText(title);
    showToast('Title copied!', 'success');
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Title Generator</h1>
        <p>Create perfect titles for your memories</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Text</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your memory and get creative title suggestions..."
            style={{ minHeight: '120px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Titles'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Creating titles..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Suggested Titles</div>
          <div className="ai-output-titles">
            {getTitles().map((title, i) => (
              <div key={i} className="ai-title-item" onClick={() => handleCopy(title)}>
                {typeof title === 'string' ? title : title.text || JSON.stringify(title)}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '12px' }}>Click a title to copy</p>
        </div>
      )}
    </div>
  );
}

export default TitleGenerator;
