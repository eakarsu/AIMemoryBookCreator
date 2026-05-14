import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const mainLinks = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  ];

  const libraryLinks = [
    { to: '/memory-books', icon: '📚', label: 'Memory Books' },
    { to: '/memories', icon: '💭', label: 'Memories' },
    { to: '/categories', icon: '📂', label: 'Categories' },
    { to: '/tags', icon: '🏷️', label: 'Tags' },
    { to: '/milestones', icon: '🏆', label: 'Milestones' },
    { to: '/templates', icon: '📋', label: 'Templates' },
  ];

  const aiLinks = [
    { to: '/ai/stories', icon: '📖', label: 'Story Generator' },
    { to: '/ai/captions', icon: '📸', label: 'Caption Generator' },
    { to: '/ai/prompts', icon: '💡', label: 'Memory Prompts' },
    { to: '/ai/sentiment', icon: '🎭', label: 'Sentiment Analysis' },
    { to: '/ai/poetry', icon: '📝', label: 'Poetry Generator' },
    { to: '/ai/quotes', icon: '💬', label: 'Quote Generator' },
    { to: '/ai/summary', icon: '📊', label: 'Summary Generator' },
    { to: '/ai/titles', icon: '✏️', label: 'Title Generator' },
    { to: '/ai/enhance', icon: '✨', label: 'Memory Enhancer' },
    { to: '/ai/timeline', icon: '📅', label: 'Timeline Generator' },
    { to: '/ai/relationships', icon: '🌳', label: 'Relationship Mapper' },
    { to: '/ai/comparison', icon: '🔍', label: 'Comparison Highlight' },
  ];

  const renderLinks = (links) =>
    links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <span className="sidebar-link-icon">{link.icon}</span>
        {link.label}
      </NavLink>
    ));

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Memory Book</h1>
        <p>AI-Powered Memories</p>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main</div>
          {renderLinks(mainLinks)}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Library</div>
          {renderLinks(libraryLinks)}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">AI Tools</div>
          {renderLinks(aiLinks)}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user.name || 'User'}</div>
            <div className="sidebar-user-email">{user.email || ''}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
