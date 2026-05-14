import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';
const PAGE_SIZE = 10;

function MemoryBookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', cover_color: '#6366f1' });
  const [shareUrl, setShareUrl] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchBook = async () => {
    try {
      const bookRes = await fetch(`${API}/memory-books/${id}`, { headers });
      const bookData = await bookRes.json();
      setBook(bookData);
      setForm({ title: bookData.title, description: bookData.description || '', cover_color: bookData.cover_color || '#6366f1' });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMemories = async (pageNum = 1) => {
    try {
      const memRes = await fetch(`${API}/memories?book_id=${id}&page=${pageNum}&limit=${PAGE_SIZE}`, { headers });
      const memData = await memRes.json();
      if (memData.data) {
        setMemories(memData.data);
        setTotalPages(memData.pagination.totalPages);
      } else {
        setMemories(Array.isArray(memData) ? memData : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchBook(), fetchMemories(1)]);
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line
  }, [id]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchMemories(newPage);
  };

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

  const handleShare = async () => {
    try {
      const res = await fetch(`${API}/memory-books/${id}/share`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed to generate share link');
      const data = await res.json();
      setShareUrl(data.share_url);
      setShowShare(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return showToast('Email is required', 'error');
    try {
      const res = await fetch(`${API}/memory-books/${id}/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: inviteEmail, role: 'contributor' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite');
      showToast(`Collaborator invited!`, 'success');
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await fetch(`${API}/memory-books/${id}/export-pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-book-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('PDF exported!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExportingPdf(false);
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
          <button className="btn btn-secondary btn-sm" onClick={handleShare}>Share</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(true)}>Invite</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
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
          {book.is_public && (
            <div className="detail-meta-item">
              <div className="detail-meta-label">Status</div>
              <div className="detail-meta-value" style={{ color: '#22c55e' }}>Public</div>
            </div>
          )}
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
          <>
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

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                  &larr; Prev
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: '#666' }}>
                  Page {page} of {totalPages}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Modal */}
      <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Share Memory Book">
        <p>Your book is now public. Share this link:</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="form-input"
            value={shareUrl}
            readOnly
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(shareUrl); showToast('Link copied!', 'success'); }}>
            Copy
          </button>
        </div>
      </Modal>

      {/* Invite Collaborator Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite Collaborator" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleInvite}>Invite</button>
        </>
      }>
        <div className="form-group">
          <label className="form-label">Collaborator Email</label>
          <input
            className="form-input"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
          />
        </div>
      </Modal>

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
