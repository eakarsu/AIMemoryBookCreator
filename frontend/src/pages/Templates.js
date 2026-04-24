import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = 'http://localhost:3001/api';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', structure: '' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API}/templates`, { headers });
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); /* eslint-disable-next-line */ }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form };
      if (body.structure) {
        try { body.structure = JSON.parse(body.structure); } catch { /* keep as string */ }
      }
      const res = await fetch(`${API}/templates`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Template created!', 'success');
      setShowModal(false);
      setForm({ name: '', description: '', category: '', structure: '' });
      fetchTemplates();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const body = { ...form };
      if (body.structure && typeof body.structure === 'string') {
        try { body.structure = JSON.parse(body.structure); } catch { /* keep as string */ }
      }
      const res = await fetch(`${API}/templates/${showDetail.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Template updated!', 'success');
      setShowEdit(false);
      setShowDetail(null);
      fetchTemplates();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/templates/${showDetail.id}`, { method: 'DELETE', headers });
      showToast('Template deleted', 'success');
      setShowDelete(false);
      setShowDetail(null);
      fetchTemplates();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDetail = (tmpl) => {
    setShowDetail(tmpl);
    setForm({
      name: tmpl.name,
      description: tmpl.description || '',
      category: tmpl.category || '',
      structure: tmpl.structure ? JSON.stringify(tmpl.structure, null, 2) : '',
    });
  };

  const renderForm = () => (
    <>
      <div className="form-group">
        <label className="form-label">Name</label>
        <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name" required />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this template..." style={{ minHeight: '80px' }} />
      </div>
      <div className="form-group">
        <label className="form-label">Category</label>
        <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Personal, Travel, Family" />
      </div>
      <div className="form-group">
        <label className="form-label">Structure (JSON)</label>
        <textarea className="form-textarea" value={form.structure} onChange={(e) => setForm({ ...form, structure: e.target.value })} placeholder='{"fields": ["title", "date", "description"]}' style={{ minHeight: '120px', fontFamily: 'monospace' }} />
      </div>
    </>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Templates</h1>
          <p className="page-subtitle">Ready-made formats for your memories</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Template</button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No templates yet</div>
          <div className="empty-state-text">Create templates to standardize your memories.</div>
        </div>
      ) : (
        <div className="cards-grid">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="card" onClick={() => openDetail(tmpl)}>
              <div className="card-title">{tmpl.name}</div>
              <div className="card-description">{tmpl.description || 'No description'}</div>
              {tmpl.category && (
                <div className="card-meta">
                  <span className="tag-badge" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                    {tmpl.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Template" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </>
      }>
        <form onSubmit={handleCreate}>{renderForm()}</form>
      </Modal>

      <Modal isOpen={!!showDetail && !showEdit && !showDelete} onClose={() => setShowDetail(null)} title={showDetail?.name || 'Template'} footer={
        <>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
        </>
      }>
        {showDetail && (
          <div>
            <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>{showDetail.description || 'No description'}</p>
            {showDetail.category && (
              <div style={{ marginBottom: '16px' }}>
                <span className="tag-badge" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>{showDetail.category}</span>
              </div>
            )}
            {showDetail.structure && (
              <div>
                <div className="detail-section-title">Structure</div>
                <div className="template-structure">{JSON.stringify(showDetail.structure, null, 2)}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Template" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
        </>
      }>
        {renderForm()}
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Template">
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

export default Templates;
