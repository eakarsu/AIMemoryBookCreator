import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function PromptGenerator() {
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
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Memory Prompts</h1>
        <p>Get inspired to recall and write about your memories</p>
      </div>

      <div className="ai-input-section">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Number of prompts</label>
            <input type="number" className="form-input" min="1" max="10" value={count} onChange={(e) => setCount(e.target.value)} />
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
          <div className="ai-output-prompts">
            {getPrompts().map((prompt, i) => (
              <div key={i} className="ai-prompt-item">
                <span>{typeof prompt === 'string' ? prompt : prompt.text || JSON.stringify(prompt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptGenerator;
