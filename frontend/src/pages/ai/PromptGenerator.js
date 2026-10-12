import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function PromptGenerator() {
  const fullAIExamples = useFullAIExamples();

  const [category, setCategory] = useState('');
  const [count, setCount] = useState(5);
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    fetch(`${API}/categories`, { headers })
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/ai/generate-prompts`, {
        method: 'POST', headers, body: JSON.stringify({ category, count: Number(count) }),
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

  const getPrompts = () => {
    if (!result) return [];
    if (typeof result.result === 'string') return result.result.split('\n').filter(l => l.trim());
    if (typeof result === 'string') return result.split('\n').filter(l => l.trim());
    return [JSON.stringify(result)];
  };

  return (
    <div className="ai-page" data-full-ai-workspace="PromptGenerator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Memory Prompts</h1>
        <p>Get inspired to recall and write about your memories</p>
      </div>

      <div className="ai-input-section">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: category, change: (e) => setCategory(e.target.value), label: "category", manual: false, json: false, sample: '' }, "p1-2031", undefined)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Number of prompts</label>
            <input type="number" className="form-input" min="1" max="10" value={count} onChange={(e) => setCount(e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: count, change: (e) => setCount(e.target.value), label: "count", manual: false, json: false, sample: 5 }, "p1-2431", undefined)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Prompts'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Creating prompts..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Memory Prompts</div>
          <FormattedAIReport response={result} title="Memory Prompts" />
        </div>
      )}
    </div>
  );
}

export default PromptGenerator;
