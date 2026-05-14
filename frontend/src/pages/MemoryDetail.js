import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';
const EMOTIONS = ['happy', 'sad', 'nostalgic', 'excited', 'peaceful', 'grateful', 'proud', 'amused', 'reflective', 'hopeful'];

function SentimentDisplay({ result }) {
  if (!result || typeof result === 'string') return <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>;

  const scoreColor = result.score >= 7 ? '#22c55e' : result.score >= 4 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        {result.emotion && (
          <span style={{
            background: '#6366f1', color: '#fff', padding: '4px 14px',
            borderRadius: '20px', fontWeight: 600, fontSize: '0.95rem'
          }}>
            {result.emotion}
          </span>
        )}
        {result.score != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '120px', height: '8px', background: '#e5e7eb',
              borderRadius: '4px', overflow: 'hidden'
            }}>
              <div style={{
                width: `${(result.score / 10) * 100}%`, height: '100%',
                background: scoreColor, borderRadius: '4px'
              }} />
            </div>
            <span style={{ fontWeight: 700, color: scoreColor }}>{result.score}/10</span>
          </div>
        )}
      </div>
      {result.tone && <p style={{ color: '#555', fontStyle: 'italic', margin: 0 }}>{result.tone}</p>}
      {result.themes && result.themes.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#888' }}>Themes</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {result.themes.map((t, i) => (
              <span key={i} style={{
                background: '#ede9fe', color: '#6366f1',
                padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem'
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchMemory = async () => {
    try {
      const [memRes, bookRes, catRes] = await Promise.all([
        fetch(`${API}/memories/${id}`, { headers }),
        fetch(`${API}/memory-books`, { headers }),
        fetch(`${API}/categories`, { headers }),
      ]);
      const memData = await memRes.json();
      const bookData = await bookRes.json();
      const catData = await catRes.json();
      setMemory(memData);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setForm({
        title: memData.title || '',
        content: memData.content || '',
        book_id: memData.book_id || '',
        memory_date: memData.memory_date ? memData.memory_date.split('T')[0] : '',
        location: memData.location || '',
        emotion: memData.emotion || '',
        category_id: memData.category_id || '',
        is_favorite: memData.is_favorite || false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMemory(); /* eslint-disable-next-line */ }, [id]);

  const handleUpdate = async () => {
    try {
      const body = { ...form };
      if (body.book_id) body.book_id = Number(body.book_id);
      if (body.category_id) body.category_id = Number(body.category_id);
      const res = await fetch(`${API}/memories/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setMemory(updated);
      setShowEdit(false);
      showToast('Memory updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/memories/${id}`, { method: 'DELETE', headers });
      showToast('Memory deleted', 'success');
      navigate('/memories');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`${API}/memories/${id}/upload-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setMemory((m) => ({ ...m, photo_url: data.photo_url }));
      showToast('Photo uploaded!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAnalyzePhoto = async () => {
    setAnalyzingPhoto(true);
    setPhotoAnalysis(null);
    try {
      const res = await fetch(`${API}/memories/${id}/analyze-photo`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setPhotoAnalysis(data.analysis);
      showToast('Photo analyzed!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!memory) return <div className="empty-state"><div className="empty-state-title">Memory not found</div></div>;

  return (
    <div className="detail-view">
      <div className="detail-back" onClick={() => navigate('/memories')}>&larr; Back to Memories</div>

      <div className="detail-header">
        <div>
          <h1 className="detail-title">
            {memory.is_favorite && <span className="favorite-star" style={{ marginRight: '8px' }}>★</span>}
            {memory.title}
          </h1>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-meta-grid">
          {memory.memory_date && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">Date</div>
              <div className="detail-meta-value">{new Date(memory.memory_date).toLocaleDateString()}</div>
            </div>
          )}
          {memory.location && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">Location</div>
              <div className="detail-meta-value">{memory.location}</div>
            </div>
          )}
          {memory.emotion && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">Emotion</div>
              <div className="detail-meta-value">
                <span className={`emotion-badge emotion-${memory.emotion}`}>{memory.emotion}</span>
              </div>
            </div>
          )}
          <div className="detail-meta-item">
            <div className="detail-meta-label">Created</div>
            <div className="detail-meta-value">{new Date(memory.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Photo section */}
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="detail-section-title">Photo</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg,image/png" onChange={handleUploadPhoto} />
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()} disabled={uploadingPhoto}>
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </button>
            {memory.photo_url && (
              <button className="btn btn-primary btn-sm" onClick={handleAnalyzePhoto} disabled={analyzingPhoto}>
                {analyzingPhoto ? 'Analyzing...' : 'AI Analyze Photo'}
              </button>
            )}
          </div>
        </div>

        {memory.photo_url && (
          <div>
            <img
              src={`http://localhost:3001${memory.photo_url}`}
              alt="Memory"
              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', objectFit: 'cover', marginBottom: '12px' }}
            />
          </div>
        )}

        {photoAnalysis && (
          <div style={{ background: '#f8f7ff', border: '1px solid #e0dcff', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <div style={{ fontWeight: 600, color: '#6366f1', marginBottom: '10px' }}>AI Photo Analysis</div>
            {photoAnalysis.scene_description && <p><strong>Scene:</strong> {photoAnalysis.scene_description}</p>}
            {photoAnalysis.estimated_date_period && <p><strong>Estimated Period:</strong> {photoAnalysis.estimated_date_period}</p>}
            {photoAnalysis.people_count != null && <p><strong>People:</strong> {photoAnalysis.people_count}</p>}
            {photoAnalysis.mood && <p><strong>Mood:</strong> {photoAnalysis.mood}</p>}
            {photoAnalysis.suggested_caption && (
              <div style={{ marginTop: '8px', padding: '8px', background: '#ede9fe', borderRadius: '6px' }}>
                <strong>Suggested Caption:</strong> {photoAnalysis.suggested_caption}
              </div>
            )}
            {photoAnalysis.memory_prompt && (
              <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#6366f1' }}>
                <strong>Memory Prompt:</strong> {photoAnalysis.memory_prompt}
              </div>
            )}
            {photoAnalysis.raw && <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{photoAnalysis.raw}</pre>}
          </div>
        )}
      </div>

      {memory.content && (
        <div className="detail-section">
          <div className="detail-section-title">Memory</div>
          <div className="detail-content">{memory.content}</div>
        </div>
      )}

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Memory" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
        </>
      }>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea className="form-textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Memory Book</label>
            <select className="form-select" value={form.book_id} onChange={(e) => setForm({ ...form, book_id: e.target.value })}>
              <option value="">Select a book</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.memory_date} onChange={(e) => setForm({ ...form, memory_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Emotion</label>
          <select className="form-select" value={form.emotion} onChange={(e) => setForm({ ...form, emotion: e.target.value })}>
            <option value="">Select emotion</option>
            {EMOTIONS.map((em) => <option key={em} value={em}>{em.charAt(0).toUpperCase() + em.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <div className="form-checkbox-group">
            <input type="checkbox" className="form-checkbox" checked={form.is_favorite} onChange={(e) => setForm({ ...form, is_favorite: e.target.checked })} />
            <label className="form-label" style={{ margin: 0 }}>Favorite</label>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Memory">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">⚠️</div>
          <div className="confirm-dialog-text">Are you sure you want to delete "{memory.title}"? This cannot be undone.</div>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MemoryDetail;
