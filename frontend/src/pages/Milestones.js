import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../components/Toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', milestone_date: '', icon: '🏆', memory_id: '' });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchData = async () => {
    try {
      const [milRes, memRes] = await Promise.all([
        fetch(`${API}/milestones`, { headers }),
        fetch(`${API}/memories`, { headers }),
      ]);
      const milData = await milRes.json();
      const memData = await memRes.json();
      setMilestones(Array.isArray(milData) ? milData : []);
      setMemories(Array.isArray(memData) ? memData : []);
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
      if (body.memory_id) body.memory_id = Number(body.memory_id);
      else delete body.memory_id;
      const res = await fetch(`${API}/milestones`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to create');
      showToast('Milestone created!', 'success');
      setShowModal(false);
      setForm({ title: '', description: '', milestone_date: '', icon: '🏆', memory_id: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const body = { ...form };
      if (body.memory_id) body.memory_id = Number(body.memory_id);
      else delete body.memory_id;
      const res = await fetch(`${API}/milestones/${showDetail.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Milestone updated!', 'success');
      setShowEdit(false);
      setShowDetail(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/milestones/${showDetail.id}`, { method: 'DELETE', headers });
      showToast('Milestone deleted', 'success');
      setShowDelete(false);
      setShowDetail(null);
      fetchData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDetail = (mil) => {
    setShowDetail(mil);
    setForm({
      title: mil.title,
      description: mil.description || '',
      milestone_date: mil.milestone_date ? mil.milestone_date.split('T')[0] : '',
      icon: mil.icon || '🏆',
      memory_id: mil.memory_id || '',
    });
  };

  if (loading) return <LoadingSpinner />;

  const renderForm = () => (
    <>
      <div className="form-group">
        <label className="form-label">Title</label>
        <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Milestone title" required />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe this milestone..." />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.milestone_date} onChange={(e) => setForm({ ...form, milestone_date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Icon (emoji)</label>
          <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏆" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Linked Memory (optional)</label>
        <select className="form-select" value={form.memory_id} onChange={(e) => setForm({ ...form, memory_id: e.target.value })}>
          <option value="">None</option>
          {memories.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Milestones</h1>
          <p className="page-subtitle">Your life's greatest achievements</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Milestone</button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <div className="empty-state-title">No milestones yet</div>
          <div className="empty-state-text">Mark your life's greatest achievements.</div>
        </div>
      ) : (
        <div className="timeline">
          {milestones.map((mil) => (
            <div key={mil.id} className="timeline-item" onClick={() => openDetail(mil)}>
              <div className="timeline-item-icon">{mil.icon || '🏆'}</div>
              <div className="timeline-item-title">{mil.title}</div>
              <div className="timeline-item-description">{mil.description || ''}</div>
              <div className="timeline-item-date">
                {mil.milestone_date ? new Date(mil.milestone_date).toLocaleDateString() : 'No date'}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Milestone" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create</button>
        </>
      }>
        <form onSubmit={handleCreate}>{renderForm()}</form>
      </Modal>

      <Modal isOpen={!!showDetail && !showEdit && !showDelete} onClose={() => setShowDetail(null)} title={showDetail?.title || 'Milestone'} footer={
        <>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Delete</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
        </>
      }>
        {showDetail && (
          <div>
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '16px' }}>{showDetail.icon || '🏆'}</div>
            <p style={{ color: 'var(--gray-600)', marginBottom: '12px' }}>{showDetail.description || 'No description'}</p>
            {showDetail.milestone_date && (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>
                Date: {new Date(showDetail.milestone_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Milestone" footer={
        <>
          <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
        </>
      }>
        {renderForm()}
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Milestone">
        <div className="confirm-dialog">
          <div className="confirm-dialog-icon">⚠️</div>
          <div className="confirm-dialog-text">Are you sure you want to delete "{showDetail?.title}"?</div>
          <div className="confirm-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Milestones;
