import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({});
  const [sharedBooks, setSharedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoints = ['memory-books', 'memories', 'categories', 'tags', 'milestones', 'templates'];
        const results = await Promise.allSettled(
          endpoints.map((ep) => fetch(`${API}/${ep}`, { headers }).then((r) => r.json()))
        );
        const counts = {};
        endpoints.forEach((ep, i) => {
          const result = results[i];
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            counts[ep] = result.value.length;
          } else {
            counts[ep] = 0;
          }
        });
        setStats(counts);

        // Fetch shared books
        try {
          const sharedRes = await fetch(`${API}/memory-books/shared-with-me`, { headers });
          const sharedData = await sharedRes.json();
          setSharedBooks(Array.isArray(sharedData) ? sharedData : []);
        } catch (_) {}
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    { icon: '📚', title: 'Memory Books', desc: 'Create and organize your memory collections', path: '/memory-books', countKey: 'memory-books' },
    { icon: '💭', title: 'Memories', desc: 'Capture and preserve your precious moments', path: '/memories', countKey: 'memories' },
    { icon: '📂', title: 'Categories', desc: 'Organize memories by life areas', path: '/categories', countKey: 'categories' },
    { icon: '🏷️', title: 'Tags', desc: 'Label and find memories easily', path: '/tags', countKey: 'tags' },
    { icon: '🏆', title: 'Milestones', desc: "Mark your life's greatest achievements", path: '/milestones', countKey: 'milestones' },
    { icon: '📋', title: 'Templates', desc: 'Ready-made formats for your memories', path: '/templates', countKey: 'templates' },
    { icon: '📖', title: 'AI Story Generator', desc: 'Transform memories into narratives', path: '/ai/stories' },
    { icon: '📸', title: 'AI Caption Generator', desc: 'Create perfect captions for moments', path: '/ai/captions' },
    { icon: '💡', title: 'AI Memory Prompts', desc: 'Get inspired to recall memories', path: '/ai/prompts' },
    { icon: '🎭', title: 'AI Sentiment Analysis', desc: 'Understand the emotions in memories', path: '/ai/sentiment' },
    { icon: '📝', title: 'AI Poetry Generator', desc: 'Turn memories into beautiful poems', path: '/ai/poetry' },
    { icon: '💬', title: 'AI Quote Generator', desc: 'Generate inspirational memory quotes', path: '/ai/quotes' },
    { icon: '📊', title: 'AI Summary Generator', desc: 'Summarize your memory collections', path: '/ai/summary' },
    { icon: '✏️', title: 'AI Title Generator', desc: 'Create perfect titles for memories', path: '/ai/titles' },
    { icon: '✨', title: 'AI Memory Enhancer', desc: 'Enrich and expand your memories', path: '/ai/enhance' },
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Welcome back, {user.name || 'User'}!</h1>
        <p>Here is your memory book overview</p>
      </div>

      <div className="stats-row">
        <div className="stats-card">
          <div className="stats-card-value">{stats['memory-books'] || 0}</div>
          <div className="stats-card-label">Memory Books</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats['memories'] || 0}</div>
          <div className="stats-card-label">Memories</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats['categories'] || 0}</div>
          <div className="stats-card-label">Categories</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats['tags'] || 0}</div>
          <div className="stats-card-label">Tags</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats['milestones'] || 0}</div>
          <div className="stats-card-label">Milestones</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats['templates'] || 0}</div>
          <div className="stats-card-label">Templates</div>
        </div>
      </div>

      {/* Shared With Me */}
      {sharedBooks.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', marginBottom: '12px' }}>
            Shared With Me
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {sharedBooks.map((b) => (
              <div
                key={b.id}
                className="feature-card"
                onClick={() => navigate(`/memory-books/${b.id}`)}
                style={{ borderTop: `4px solid ${b.cover_color || '#6366f1'}` }}
              >
                <span className="feature-card-icon">📚</span>
                <div className="feature-card-title">{b.title}</div>
                <div className="feature-card-description">{b.role} · {b.memory_count || 0} memories</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {features.map((f) => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <span className="feature-card-icon">{f.icon}</span>
            <div className="feature-card-title">{f.title}</div>
            <div className="feature-card-description">{f.desc}</div>
            {f.countKey && stats[f.countKey] !== undefined && (
              <div className="feature-card-count">{stats[f.countKey]} items</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
