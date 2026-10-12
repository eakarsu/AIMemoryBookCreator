import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CaptionGenerator() {
  const fullAIExamples = useFullAIExamples();

  const [text, setText] = useState('');
  const [style, setStyle] = useState('social media');
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
      const res = await fetch(`${API}/ai/generate-caption`, {
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

  const getCaptions = () => {
    if (!result) return [];
    if (typeof result.result === 'string') return result.result.split('\n').filter(l => l.trim());
    if (typeof result === 'string') return result.split('\n').filter(l => l.trim());
    return [JSON.stringify(result)];
  };

  const handleCopy = (caption) => {
    navigator.clipboard.writeText(caption);
    showToast('Caption copied!', 'success');
  };

  return (
    <div className="ai-page" data-full-ai-workspace="CaptionGenerator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Caption Generator</h1>
        <p>Create perfect captions for your moments</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory / Photo Description</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your memory or photo..."
            style={{ minHeight: '120px' }} data-full-ai-field={fullAIExamples.bind({ current: text, change: (e) => setText(e.target.value), label: "text", manual: false, json: false, sample: '' }, "p1-1867", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Style</label>
          <select className="form-select" value={style} onChange={(e) => setStyle(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: style, change: (e) => setStyle(e.target.value), label: "style", manual: false, json: false, sample: 'social media' }, "p1-2225", undefined)}>
            <option value="social media">Social Media</option>
            <option value="poetic">Poetic</option>
            <option value="simple">Simple</option>
            <option value="witty">Witty</option>
            <option value="heartfelt">Heartfelt</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Captions'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Creating captions..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Captions</div>
          <FormattedAIReport response={result} title="Generated Captions" />
        </div>
      )}
    </div>
  );
}

export default CaptionGenerator;
