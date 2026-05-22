import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MemoryBooks from './pages/MemoryBooks';
import MemoryBookDetail from './pages/MemoryBookDetail';
import Memories from './pages/Memories';
import MemoryDetail from './pages/MemoryDetail';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import Milestones from './pages/Milestones';
import Templates from './pages/Templates';
import StoryGenerator from './pages/ai/StoryGenerator';
import CaptionGenerator from './pages/ai/CaptionGenerator';
import PromptGenerator from './pages/ai/PromptGenerator';
import SentimentAnalyzer from './pages/ai/SentimentAnalyzer';
import PoetryGenerator from './pages/ai/PoetryGenerator';
import QuoteGenerator from './pages/ai/QuoteGenerator';
import SummaryGenerator from './pages/ai/SummaryGenerator';
import TitleGenerator from './pages/ai/TitleGenerator';
import MemoryEnhancer from './pages/ai/MemoryEnhancer';
import TimelineGenerator from './pages/ai/TimelineGenerator';
import RelationshipMapper from './pages/ai/RelationshipMapper';
import ComparisonHighlight from './pages/ai/ComparisonHighlight';
import HeritageGapFinder from './pages/HeritageGapFinder';
import PublicBook from './pages/PublicBook';
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const isPublicPage = location.pathname.startsWith('/public/');

  // Public pages - no auth, no sidebar
  if (isPublicPage) {
    return (
      <>
        <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

          <Route path="/public/books/:token" element={<PublicBook />} />
        </Routes>
      </>
    );
  }

  if (isLoginPage) {
    return (
      <>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/memory-books" element={<ProtectedRoute><MemoryBooks /></ProtectedRoute>} />
        <Route path="/memory-books/:id" element={<ProtectedRoute><MemoryBookDetail /></ProtectedRoute>} />
        <Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
        <Route path="/memories/:id" element={<ProtectedRoute><MemoryDetail /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
        <Route path="/milestones" element={<ProtectedRoute><Milestones /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
        <Route path="/ai/stories" element={<ProtectedRoute><StoryGenerator /></ProtectedRoute>} />
        <Route path="/ai/captions" element={<ProtectedRoute><CaptionGenerator /></ProtectedRoute>} />
        <Route path="/ai/prompts" element={<ProtectedRoute><PromptGenerator /></ProtectedRoute>} />
        <Route path="/ai/sentiment" element={<ProtectedRoute><SentimentAnalyzer /></ProtectedRoute>} />
        <Route path="/ai/poetry" element={<ProtectedRoute><PoetryGenerator /></ProtectedRoute>} />
        <Route path="/ai/quotes" element={<ProtectedRoute><QuoteGenerator /></ProtectedRoute>} />
        <Route path="/ai/summary" element={<ProtectedRoute><SummaryGenerator /></ProtectedRoute>} />
        <Route path="/ai/titles" element={<ProtectedRoute><TitleGenerator /></ProtectedRoute>} />
        <Route path="/ai/enhance" element={<ProtectedRoute><MemoryEnhancer /></ProtectedRoute>} />
        <Route path="/ai/timeline" element={<ProtectedRoute><TimelineGenerator /></ProtectedRoute>} />
        <Route path="/ai/relationships" element={<ProtectedRoute><RelationshipMapper /></ProtectedRoute>} />
        <Route path="/ai/comparison" element={<ProtectedRoute><ComparisonHighlight /></ProtectedRoute>} />
        <Route path="/ai/heritage-gaps" element={<ProtectedRoute><HeritageGapFinder /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </AppLayout>
  );
}

export default App;
