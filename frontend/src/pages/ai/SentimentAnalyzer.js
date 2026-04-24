import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

function SentimentAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/ai/analyze-sentiment`, {
        method: 'POST', headers, body: JSON.stringify({ memoryText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const data = result.result || result;

    // If result is a parsed JSON object from sentiment analysis
    const isObj = typeof data === 'object' && data !== null;
    const sentiment = isObj ? (data.emotion || data.overall_sentiment || data.sentiment || 'N/A') : 'N/A';
    const score = isObj ? (data.score || data.confidence || 'N/A') : 'N/A';
    const emotions = isObj ? (data.themes || data.emotions || []) : [];
    const summary = isObj ? (data.tone || data.summary || data.analysis || '') : (typeof data === 'string' ? data : '');

    const emotionColors = {
      happy: '#f59e0b', sad: '#3b82f6', nostalgic: '#8b5cf6', excited: '#ec4899',
      peaceful: '#10b981', grateful: '#f59e0b', proud: '#ef4444', amused: '#f97316',
      reflective: '#6366f1', hopeful: '#10b981', joy: '#f59e0b', love: '#ec4899',
      anger: '#ef4444', fear: '#6b7280', surprise: '#8b5cf6',
    };

    return (
      <div className="ai-result-card">
        <div className="ai-result-label">Sentiment Analysis</div>

        <div className="ai-sentiment-display">
          <div className="ai-sentiment-item">
            <div className="ai-sentiment-item-label">Overall Sentiment</div>
            <div className="ai-sentiment-item-value" style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>
              {typeof sentiment === 'string' ? sentiment : JSON.stringify(sentiment)}
            </div>
          </div>
          <div className="ai-sentiment-item">
            <div className="ai-sentiment-item-label">Confidence Score</div>
            <div className="ai-sentiment-item-value" style={{ color: 'var(--secondary)' }}>
              {typeof score === 'number' ? `${Math.round(score * 100)}%` : score}
            </div>
          </div>
        </div>

        {Array.isArray(emotions) && emotions.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <div className="ai-sentiment-item-label" style={{ marginBottom: '10px' }}>Detected Emotions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {emotions.map((em, i) => {
                const name = typeof em === 'string' ? em : em.name || em.emotion || '';
                return (
                  <span key={i} className="emotion-badge" style={{
                    background: `${emotionColors[name.toLowerCase()] || '#6366f1'}20`,
                    color: emotionColors[name.toLowerCase()] || '#6366f1',
                  }}>
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {summary && (
          <div style={{ marginTop: '20px' }}>
            <div className="ai-sentiment-item-label" style={{ marginBottom: '8px' }}>Analysis</div>
            <div className="ai-output" style={{ fontSize: '0.95rem' }}>{summary}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Sentiment Analysis</h1>
        <p>Understand the emotions in your memories</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Text</label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or write your memory text to analyze..."
            style={{ minHeight: '150px' }}
          />
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !text.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Analyzing emotions..." />}
      {result && !loading && renderResult()}
    </div>
  );
}

export default SentimentAnalyzer;
