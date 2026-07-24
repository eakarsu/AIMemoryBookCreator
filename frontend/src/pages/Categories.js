import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#6366f1', icon: '📁', description: '' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/categories`, { headers });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/categories`, {
        method: 'POST', headers, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Category created!', 'success');
      setShowModal(false);
      setForm({ name: '', color: '#6366f1', icon: '📁', description: '' });
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${API}/categories/${showDetail.id}`, {
        method: 'PUT', headers, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Category updated!', 'success');
      setShowEdit(false);
      setShowDetail(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/categories/${showDetail.id}`, { method: 'DELETE', headers });
      showToast('Category deleted', 'success');
      setShowDelete(false);
      setShowDetail(null);
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDetail = (cat) => {
    setShowDetail(cat);
    setForm({ name: cat.name, color: cat.color || '#6366f1', icon: cat.icon || '📁', description: cat.description || '' });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="page-subtitle">Organize memories by life areas</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Category</button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No categories yet</div>
          <div className="empty-state-text">Create categories to organize your memories.</div>
        </div>
      ) : (
        <div className="cards-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card" onClick={() => openDetail(cat)}>
              <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: cat.color || '#6366f1', marginBottom: '16px' }} />
              <div className="category-card-icon">{cat.icon || '📁'}</div>
              <div className="category-card-name">{cat.name}</div>
              <div className="category-card-description">{cat.description || 'No description'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Category" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </>
      }>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📁" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input type="color" className="form-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: '44px', padding: '4px' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this category..." />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail && !showEdit && !showDelete} onClose={() => setShowDetail(null)} title={showDetail?.name || 'Category'} footer={
        <>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
        </>
      }>
        {showDetail && (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{showDetail.icon || '📁'}</div>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: showDetail.color || '#6366f1', marginBottom: '16px' }} />
            <p style={{ color: 'var(--gray-600)' }}>{showDetail.description || 'No description'}</p>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Category" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
        </>
      }>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Icon (emoji)</label>
            <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input type="color" className="form-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ height: '44px', padding: '4px' }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Category">
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

export default Categories;
