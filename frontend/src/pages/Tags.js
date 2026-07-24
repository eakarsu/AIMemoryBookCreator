import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#6366f1' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API}/tags`, { headers });
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/tags`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Tag created!', 'success');
      setShowModal(false);
      setForm({ name: '', color: '#6366f1' });
      fetchTags();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API}/tags/${showDetail.id}`, { method: 'PUT', headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Tag updated!', 'success');
      setShowEdit(false);
      setShowDetail(null);
      fetchTags();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/tags/${showDetail.id}`, { method: 'DELETE', headers });
      showToast('Tag deleted', 'success');
      setShowDelete(false);
      setShowDetail(null);
      fetchTags();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDetail = (tag) => {
    setShowDetail(tag);
    setForm({ name: tag.name, color: tag.color || '#6366f1' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Tags</h1>
          <p className="page-subtitle">Label and find memories easily</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Tag</button>
        </div>
      </div>

      {tags.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <div className="empty-state-title">No tags yet</div>
          <div className="empty-state-text">Create tags to label your memories.</div>
        </div>
      ) : (
        <div className="tags-cloud">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="tag-chip"
              style={{ background: `${tag.color || '#6366f1'}15`, color: tag.color || '#6366f1', borderColor: `${tag.color || '#6366f1'}30` }}
              onClick={() => openDetail(tag)}
            >
              🏷️ {tag.name}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Tag" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </>
      }>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tag name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input type="color" className="form-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: '44px', padding: '4px' }} />
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDetail && !showEdit && !showDelete} onClose={() => setShowDetail(null)} title={showDetail?.name || 'Tag'} footer={
        <>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
        </>
      }>
        {showDetail && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="tag-chip" style={{ fontSize: '1.2rem', padding: '12px 24px', background: `${showDetail.color || '#6366f1'}15`, color: showDetail.color || '#6366f1' }}>
              🏷️ {showDetail.name}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Tag" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
        </>
      }>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input type="color" className="form-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: '44px', padding: '4px' }} />
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Tag">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">⚠️</div>
          <div className="confirm-dialog-text">Are you sure you want to delete "{showDetail?.name}"?</div>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Tags;
