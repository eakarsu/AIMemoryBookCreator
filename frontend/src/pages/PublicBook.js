import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const API = 'http://localhost:3001/api';

function PublicBook() {
  const { token } = useParams();
  const [book, setBook] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/public/memory-books/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setBook(data.book);
          setMemories(data.memories || []);
        }
      })
      .catch(() => setError('Failed to load book'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
        <h2>{error}</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', padding: '32px 16px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Book header */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '32px',
          boxShadow: '0 2px 16px rgba(99,102,241,0.08)', marginBottom: '24px',
          borderTop: `6px solid ${book.cover_color || '#6366f1'}`
        }}>
          <h1 style={{ fontSize: '2rem', color: '#1a1a2e', marginBottom: '8px' }}>{book.title}</h1>
          {book.description && <p style={{ color: '#666', fontSize: '1.05rem' }}>{book.description}</p>}
          <div style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '8px' }}>
            {memories.length} memories
          </div>
        </div>

        {/* Memories */}
        {memories.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '32px' }}>No memories shared yet.</div>
        ) : (
          memories.map((mem, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              marginBottom: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ color: '#1a1a2e', marginBottom: '8px' }}>{mem.title}</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {mem.memory_date && (
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(mem.memory_date).toLocaleDateString()}
                  </span>
                )}
                {mem.location && (
                  <span style={{ fontSize: '0.8rem', color: '#888' }}> • {mem.location}</span>
                )}
                {mem.emotion && (
                  <span style={{
                    background: '#ede9fe', color: '#6366f1',
                    padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem'
                  }}>{mem.emotion}</span>
                )}
              </div>
              {mem.photo_url && (
                <img
                  src={`http://localhost:3001${mem.photo_url}`}
                  alt={mem.title}
                  style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '12px', objectFit: 'cover' }}
                />
              )}
              {mem.content && (
                <p style={{ color: '#333', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{mem.content}</p>
              )}
            </div>
          ))
        )}

        <div style={{ textAlign: 'center', color: '#ccc', fontSize: '0.8rem', marginTop: '32px' }}>
          Shared via AI Memory Book Creator
        </div>
      </div>
    </div>
  );
}

export default PublicBook;
