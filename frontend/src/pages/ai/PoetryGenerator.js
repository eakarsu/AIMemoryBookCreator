import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function PoetryGenerator() {
  const fullAIExamples = useFullAIExamples();

  const [text, setText] = useState('');
  const [style, setStyle] = useState('free verse');
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
      const res = await fetch(`${API}/ai/generate-poetry`, {
        method: 'POST', headers, body: JSON.stringify({ memoryText: text, style }),
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

  const getPoem = () => {
    if (!result) return '';
    if (typeof result.result === 'string') return result.result;
    if (typeof result === 'string') return result;
    return JSON.stringify(result, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPoem());
    showToast('Poem copied!', 'success');
  };

  return (
    <div className="ai-page" data-full-ai-workspace="PoetryGenerator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Poetry Generator</h1>
        <p>Turn your memories into beautiful poems</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Text</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your memory to transform into poetry..."
            style={{ minHeight: '120px' }} data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", manual: false, json: false, sample: '' }, "p1-1773", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Poetry Style</label>
          <select className="form-select" value={style} onChange={(e) => setStyle(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: style, change: (e) => setStyle(e.target.value), label: "style", manual: false, json: false, sample: 'free verse' }, "p1-2154", undefined)}>
            <option value="haiku">Haiku</option>
            <option value="sonnet">Sonnet</option>
            <option value="free verse">Free Verse</option>
            <option value="limerick">Limerick</option>
            <option value="ballad">Ballad</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Poem'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Composing poetry..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Poem</div>
          <FormattedAIReport response={result} title="Generated Poem" />
        </div>
      )}
    </div>
  );
}

export default PoetryGenerator;
