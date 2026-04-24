import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';
const EMOTIONS = ['happy', 'sad', 'nostalgic', 'excited', 'peaceful', 'grateful', 'proud', 'amused', 'reflective', 'hopeful'];

function Memories() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', book_id: '', memory_date: '', location: '',
    emotion: '', category_id: '', is_favorite: false,
  });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchData = async () => {
    try {
      const [memRes, bookRes, catRes] = await Promise.all([
        fetch(`${API}/memories`, { headers }),
        fetch(`${API}/memory-books`, { headers }),
        fetch(`${API}/categories`, { headers }),
      ]);
      const [memData, bookData, catData] = await Promise.all([memRes.json(), bookRes.json(), catRes.json()]);
      setMemories(Array.isArray(memData) ? memData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (body.book_id) body.book_id = Number(body.book_id);
      if (body.category_id) body.category_id = Number(body.category_id);
      const res = await fetch(`${API}/memories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Memory created!', 'success');
      setShowModal(false);
      setForm({ title: '', content: '', book_id: '', memory_date: '', location: '', emotion: '', category_id: '', is_favorite: false });
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Memories</h1>
          <p className="page-subtitle">Your precious moments</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Memory</button>
        </div>
      </div>

      {memories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💭</div>
          <div className="empty-state-title">No memories yet</div>
          <div className="empty-state-text">Start capturing your precious moments.</div>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Emotion</th>
                <th>Favorite</th>
              </tr>
            </thead>
            <tbody>
              {memories.map((mem) => (
                <tr key={mem.id} onClick={() => navigate(`/memories/${mem.id}`)}>
                  <td className="data-table-title">{mem.title}</td>
                  <td>{mem.memory_date ? new Date(mem.memory_date).toLocaleDateString() : '-'}</td>
                  <td>{mem.location || '-'}</td>
                  <td>
                    {mem.emotion && <span className={`emotion-badge emotion-${mem.emotion}`}>{mem.emotion}</span>}
                  </td>
                  <td>
                    <span className={`favorite-star ${mem.is_favorite ? '' : 'inactive'}`}>
                      {mem.is_favorite ? '★' : '☆'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Memory" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </>
      }>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Memory title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea className="form-textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Describe your memory..." />
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
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where did it happen?" />
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
              <label className="form-label" style={{ margin: 0 }}>Mark as favorite</label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Memories;
