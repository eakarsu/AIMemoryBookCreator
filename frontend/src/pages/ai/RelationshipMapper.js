import FormattedAIReport from "../../components/FormattedAIReport";

import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showToast } from '../../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const MEMORY_EXAMPLES = [
  [{ title: 'Baking with Grandma Rose', content: 'Grandma Rose taught me to bake peach cobbler with my brother Eli every summer.' }],
  [{ title: 'Fishing trip', content: 'Uncle Sam took me and my cousin Nora fishing at the lake while Dad packed lunch.' }],
  [{ title: 'Birthday stories', content: 'At Aunt May’s birthday, her daughter Lina interviewed our grandfather about the family photographs.' }],
].map((memories) => JSON.stringify(memories));

function RelationshipMapper() {
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
      const res = await fetch(`${API}/ai/relationship-mapper`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mapping failed');
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
    <div className="ai-page" data-full-ai-workspace="RelationshipMapper"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
      <div className="ai-page-header">
        <h1>AI Relationship Mapper</h1>
        <p>Extract people and relationships across a memory collection — returns a family-tree hint.</p>
      </div>

      <div className="ai-input-section">
        <div className="form-group">
          <label className="form-label">Memory Book ID (optional)</label>
          <input
            type="text"
            className="form-input"
            value={memoryBookId}
            onChange={(e) => setMemoryBookId(e.target.value)}
            placeholder="Pull memories from a memory book" data-full-ai-field={fullAIExamples.bind({ current: memoryBookId, change: (e) => setMemoryBookId(e.target.value), label: "memoryBookId", manual: false, json: false, sample: '' }, "p1-1878", undefined)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Or paste memories (one per line, or JSON array)</label>
          <textarea
            className="form-textarea"
            value={memories}
            onChange={(e) => setMemories(e.target.value)}
            placeholder={'My grandmother Rose taught me to bake.\nUncle Sam took us fishing every summer.'}
            style={{ minHeight: '180px' }} data-full-ai-field={fullAIExamples.bind({ current: memories, change: (e) => setMemories(e.target.value), label: "memories", manual: false, json: true, samples: MEMORY_EXAMPLES }, "p1-2269", undefined)}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Mapping...' : 'Map Relationships'}
        </button>
      </div>

      {loading && <LoadingSpinner text="Discovering relationships..." />}

      {result && !loading && (
        <div className="ai-result-card">
          <div className="ai-result-label">Relationship Map</div>
          <FormattedAIReport response={result} title="Relationship Map" />
        </div>
      )}
    </div>
  );
}

export default RelationshipMapper;
