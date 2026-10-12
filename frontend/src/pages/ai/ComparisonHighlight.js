
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import NativeAIControls from "../../components/NativeAIControls";
import useNativeAIRequest from "../../components/useNativeAIRequest";
import FormattedAIReport from "../../components/FormattedAIReport";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ComparisonHighlight() {
  const fullAIExamples = useFullAIExamples();

  const nativeAIRequest = useNativeAIRequest();

  const [memoryIdA, setMemoryIdA] = useState('');
  const [memoryIdB, setMemoryIdB] = useState('');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body = {};
      if (memoryIdA) body.memoryIdA = memoryIdA;
      if (memoryIdB) body.memoryIdB = memoryIdB;
      if (textA) body.textA = textA;
      if (textB) body.textB = textB;

      const res = await nativeAIRequest.run((signal) => fetch(`${API}/ai/comparison-highlight`, { ...({
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }), ...({ signal }) }).then(async (response) => { await response.clone().arrayBuffer(); return response; }));

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'AI service unavailable (OPENROUTER_API_KEY not set on server).', 'error');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Comparison failed');
      setResult(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <NativeAIControls busy={nativeAIRequest.busy} onCancel={nativeAIRequest.cancel} context="Memory Book Creator"><div data-full-ai-workspace="ComparisonHighlight"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} /><div className="ai-page">
      <div className="ai-page-header">
        <h1>AI Comparison Highlight</h1>
        <p>Compare two memories — surface shared themes, unique details, and emotional contrast.</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory A — ID (optional)</label>
          <input data-ai-field="memoryIdA"
            type="text"
            className="form-input"
            value={memoryIdA}
            onChange={(e) => setMemoryIdA(e.target.value)}
            placeholder="e.g. 12" data-full-ai-field={fullAIExamples.bind({ current: memoryIdA, change: (e) => setMemoryIdA(e.target.value), label: "memoryIdA", manual: false, json: false, sample: '' }, "p1-2636", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste text for Memory A</label>
          <textarea data-ai-field="textA"
            className="form-textarea"
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            placeholder="The summer we drove to the lake..."
            style={{ minHeight: '120px' }} data-full-ai-field={fullAIExamples.bind({ current: textA, change: (e) => setTextA(e.target.value), label: "textA", manual: false, json: false, sample: '' }, "p1-3001", undefined)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Memory B — ID (optional)</label>
          <input data-ai-field="memoryIdB"
            type="text"
            className="form-input"
            value={memoryIdB}
            onChange={(e) => setMemoryIdB(e.target.value)}
            placeholder="e.g. 17" data-full-ai-field={fullAIExamples.bind({ current: memoryIdB, change: (e) => setMemoryIdB(e.target.value), label: "memoryIdB", manual: false, json: false, sample: '' }, "p1-3405", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste text for Memory B</label>
          <textarea data-ai-field="textB"
            className="form-textarea"
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            placeholder="Years later, we returned to the same lake..."
            style={{ minHeight: '120px' }} data-full-ai-field={fullAIExamples.bind({ current: textB, change: (e) => setTextB(e.target.value), label: "textB", manual: false, json: false, sample: '' }, "p1-3770", undefined)}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Comparing...' : 'Compare Memories'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Comparing memories..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Comparison</div>
          <FormattedAIReport response={result} />
          <button className="ai-copy-btn" onClick={handleCopy}>Copy to clipboard</button>
        </div>
      )}
    </div></div></NativeAIControls>
  );
}

export default ComparisonHighlight;
