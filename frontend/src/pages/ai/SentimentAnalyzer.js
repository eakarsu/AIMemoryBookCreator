import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = 'http://localhost:3001/api';

const EMOTION_COLORS = {
  happy: '#f59e0b', sad: '#3b82f6', nostalgic: '#8b5cf6', excited: '#ec4899',
  peaceful: '#10b981', grateful: '#f59e0b', proud: '#ef4444', amused: '#f97316',
  reflective: '#6366f1', hopeful: '#10b981', joy: '#f59e0b', love: '#ec4899',
  anger: '#ef4444', fear: '#6b7280', surprise: '#8b5cf6',
};

function StructuredSentiment({ data }) {
  if (!data || typeof data === 'string') {
    return <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#333' }}>{data}</pre>;
  }

  const score = typeof data.score === 'number' ? data.score : null;
  const scoreColor = score != null ? (score >= 7 ? '#22c55e' : score >= 4 ? '#f59e0b' : '#ef4444') : '#6366f1';
  const emotionKey = (data.emotion || '').toLowerCase();
  const emotionColor = EMOTION_COLORS[emotionKey] || '#6366f1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Emotion badge + score gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {data.emotion && (
          <span style={{
            background: `${emotionColor}22`, color: emotionColor, border: `1px solid ${emotionColor}55`,
            padding: '6px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize'
          }}>
            {data.emotion}
          </span>
        )}
        {score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '160px', height: '10px', background: '#e5e7eb',
              borderRadius: '5px', overflow: 'hidden'
            }}>
              <div style={{
                width: `${(score / 10) * 100}%`, height: '100%',
                background: scoreColor, borderRadius: '5px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <span style={{ fontWeight: 700, color: scoreColor, fontSize: '1rem' }}>{score}/10</span>
          </div>
        )}
      </div>

      {/* Tone */}
      {data.tone && (
        <p style={{ color: '#555', fontStyle: 'italic', margin: 0, lineHeight: '1.6' }}>
          {data.tone}
        </p>
      )}

      {/* Themes */}
      {Array.isArray(data.themes) && data.themes.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Emotional Themes
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {data.themes.map((t, i) => (
              <span key={i} style={{
                background: '#ede9fe', color: '#6366f1',
                padding: '3px 12px', borderRadius: '14px', fontSize: '0.88rem'
              }}>{typeof t === 'string' ? t : JSON.stringify(t)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
      setResult(data.result);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
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

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Sentiment Analysis</div>
          <StructuredSentiment data={result} />
        </div>
      )}
    </div>
  );
}

export default SentimentAnalyzer;
