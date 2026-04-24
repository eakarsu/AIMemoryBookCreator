import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';

function MemoryBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover_color: '#6366f1' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API}/memory-books`, { headers });
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/memory-books`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Memory book created!', 'success');
      setShowModal(false);
      setForm({ title: '', description: '', cover_color: '#6366f1' });
      fetchBooks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Memory Books</h1>
          <p className="page-subtitle">Your memory collections</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Book
          </button>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">No memory books yet</div>
          <div className="empty-state-text">Create your first memory book to start organizing your memories.</div>
        </div>
      ) : (
        <div className="cards-grid">
          {books.map((book) => (
            <div
              key={book.id}
              className="card"
              onClick={() => navigate(`/memory-books/${book.id}`)}
            >
              <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: book.cover_color || '#6366f1', marginBottom: '16px' }} />
              <div className="card-title">{book.title}</div>
              <div className="card-description">{book.description || 'No description'}</div>
              <div className="card-meta">
                <span>{new Date(book.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Memory Book"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create</button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="My Memory Book"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this collection..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cover Color</label>
            <input
              type="color"
              className="form-input"
              value={form.cover_color}
              onChange={(e) => setForm({ ...form, cover_color: e.target.value })}
              style={{ height: '44px', padding: '4px' }}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MemoryBooks;
