import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const MEMORY_EXAMPLES = [
  [{ title: 'Summer picnic', content: 'In July 1998, Grandma served peach cobbler at the lake while our cousins set up the picnic table.', memory_date: '1998-07-12' }],
  [{ title: 'First school day', content: 'Dad walked me to the blue school door and our teacher asked me to arrange the classroom books.', memory_date: '2004-09-07' }],
  [{ title: 'Family birthday', content: 'At Aunt May’s seventieth birthday dinner, we recorded the stories behind her old photographs.', memory_date: '2022-04-16' }],
].map((memories) => JSON.stringify(memories));

function TimelineGenerator() {
  const fullAIExamples = useFullAIExamples();

  const [memoryBookId, setMemoryBookId] = useState('');
  const [memories, setMemories] = useState('');
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
      if (memoryBookId) body.memoryBookId = memoryBookId;
      if (memories) {
        try {
          body.memories = JSON.parse(memories);
        } catch {
          body.memories = memories.split('\n').filter(Boolean);
        }
      }
      const res = await fetch(`${API}/ai/generate-timeline`, {
        method: 'POST', headers, body: JSON.stringify(body),
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
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    showToast('Copied to clipboard!', 'success');
  };

  return (
    <div className="ai-page" data-full-ai-workspace="TimelineGenerator"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Timeline Generator</h1>
        <p>Build a chronological timeline with era grouping and a narrative arc.</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Book ID (optional)</label>
          <input
            type="text"
            className="form-input"
            value={memoryBookId}
            onChange={(e) => setMemoryBookId(e.target.value)}
            placeholder="Pull memories from a memory book" data-full-ai-field={fullAIExamples.bind({ current: memoryBookId, change: (e) => setMemoryBookId(e.target.value), label: "memoryBookId", manual: false, json: false, sample: '' }, "p1-1857", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste memories (one per line, or JSON array)</label>
          <textarea
            className="form-textarea"
            value={memories}
            onChange={(e) => setMemories(e.target.value)}
            placeholder={'1995 - Started college\n1999 - Graduated\n2001 - First job'}
            style={{ minHeight: '180px' }} data-full-ai-field={fullAIExamples.bind({ current: memories, change: (e) => setMemories(e.target.value), label: "memories", manual: false, json: true, samples: MEMORY_EXAMPLES }, "p1-2248", undefined)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Timeline'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Building your timeline..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Generated Timeline</div>
          <FormattedAIReport response={result} title="Generated Timeline" />
        </div>
      )}
    </div>
  );
}

export default TimelineGenerator;
