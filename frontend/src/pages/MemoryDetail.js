import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';
const EMOTIONS = ['happy', 'sad', 'nostalgic', 'excited', 'peaceful', 'grateful', 'proud', 'amused', 'reflective', 'hopeful'];

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

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
    // eslint-disable-next-line
  }, [id]);

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
