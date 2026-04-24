import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';

function MemoryBookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover_color: '#6366f1' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookRes, memRes] = await Promise.all([
          fetch(`${API}/memory-books/${id}`, { headers }),
          fetch(`${API}/memories?book_id=${id}`, { headers }),
        ]);
        const bookData = await bookRes.json();
        const memData = await memRes.json();
        setBook(bookData);
        setForm({ title: bookData.title, description: bookData.description || '', cover_color: bookData.cover_color || '#6366f1' });
        setMemories(Array.isArray(memData) ? memData : []);
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
      const res = await fetch(`${API}/memory-books/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setBook(updated);
      setShowEdit(false);
      showToast('Book updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/memory-books/${id}`, { method: 'DELETE', headers });
      showToast('Book deleted', 'success');
      navigate('/memory-books');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!book) return <div className="empty-state"><div className="empty-state-title">Book not found</div></div>;

  return (
    <div className="detail-view">
      <div className="detail-back" onClick={() => navigate('/memory-books')}>
        &larr; Back to Memory Books
      </div>

      <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: book.cover_color || '#6366f1', marginBottom: '24px' }} />

      <div className="detail-header">
        <div>
          <h1 className="detail-title">{book.title}</h1>
          <p className="page-subtitle">{book.description || 'No description'}</p>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-meta-grid">
          <div className="detail-meta-item">
            <div className="detail-meta-label">Created</div>
            <div className="detail-meta-value">{new Date(book.created_at).toLocaleDateString()}</div>
          </div>
          <div className="detail-meta-item">
            <div className="detail-meta-label">Memories</div>
            <div className="detail-meta-value">{memories.length}</div>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="detail-section-title" style={{ margin: 0 }}>Memories in this book</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/memories')}>+ Add Memory</button>
        </div>

        {memories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💭</div>
            <div className="empty-state-text">No memories in this book yet</div>
          </div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Emotion</th>
                </tr>
              </thead>
              <tbody>
                {memories.map((mem) => (
                  <tr key={mem.id} onClick={() => navigate(`/memories/${mem.id}`)}>
                    <td className="data-table-title">{mem.title}</td>
                    <td>{mem.memory_date ? new Date(mem.memory_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {mem.emotion && (
                        <span className={`emotion-badge emotion-${mem.emotion}`}>{mem.emotion}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Memory Book" footer={
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
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Cover Color</label>
          <input type="color" className="form-input" value={form.cover_color} onChange={(e) => setForm({ ...form, cover_color: e.target.value })} style={{ height: '44px', padding: '4px' }} />
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Memory Book">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">⚠️</div>
          <div className="confirm-dialog-text">Are you sure you want to delete "{book.title}"? This action cannot be undone.</div>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MemoryBookDetail;
