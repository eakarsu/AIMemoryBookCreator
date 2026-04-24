import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function StoryGenerator() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('warm');
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
      const res = await fetch(`${API}/ai/generate-story`, {
        method: 'POST', headers, body: JSON.stringify({ memoryText: text, tone }),
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
    const content = result?.result || JSON.stringify(result);
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard!', 'success');
  };

  const getStoryText = () => {
    if (!result) return '';
    if (typeof result.result === 'string') return result.result;
    if (typeof result === 'string') return result;
    return JSON.stringify(result, null, 2);
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Story Generator</h1>
        <p>Transform your memories into beautiful narratives</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Text</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your memory in detail..."
            style={{ minHeight: '150px' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Tone</label>
          <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="warm">Warm</option>
            <option value="dramatic">Dramatic</option>
            <option value="humorous">Humorous</option>
            <option value="poetic">Poetic</option>
            <option value="nostalgic">Nostalgic</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Story'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Crafting your story..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Story</div>
          <div className="ai-output-story">{getStoryText()}</div>
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div>
  );
}

export default StoryGenerator;
