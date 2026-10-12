import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function MemoryEnhancer() {
  const fullAIExamples = useFullAIExamples();

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
      const res = await fetch(`${API}/ai/enhance-memory`, {
        method: 'POST', headers, body: JSON.stringify({ memoryText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enhancement failed');
      setResult(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getEnhanced = () => {
    if (!result) return '';
    if (typeof result.result === 'string') return result.result;
    if (typeof result === 'string') return result;
    return JSON.stringify(result, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEnhanced());
    showToast('Enhanced memory copied!', 'success');
  };

  return (
    <div className="ai-page" data-full-ai-workspace="MemoryEnhancer"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Memory Enhancer</h1>
        <p>Enrich and expand your memories with vivid detail</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Original Memory</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your memory here and let AI enhance it with richer detail..."
            style={{ minHeight: '150px' }} data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", manual: false, json: false, sample: '' }, "p1-1745", undefined)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Enhancing...' : 'Enhance Memory'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Enhancing your memory..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Memory Enhancement</div>
          <FormattedAIReport response={result} title="Memory Enhancement" />
        </div>
      )}
    </div>
  );
}

export default MemoryEnhancer;
