import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function QuoteGenerator() {
  const fullAIExamples = useFullAIExamples();

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
    <div className="ai-page" data-full-ai-workspace="QuoteGenerator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
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
            placeholder="e.g. family love, childhood adventures, friendship..." data-full-ai-field={fullAIExamples.bind({ current: theme, change: (e) => setTheme(e.target.value), label: "theme", manual: false, json: false, sample: '' }, "p1-1700", undefined)}
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
          <FormattedAIReport response={result} title="Generated Quote" />
        </div>
      )}
    </div>
  );
}

export default QuoteGenerator;
