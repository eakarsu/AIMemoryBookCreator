const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./db');
const { validateRuntime } = require('./governance/runtime');
const governanceRouter = require('./governance/router');
const { createProviderGate } = require('./governance/providerGate');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

validateRuntime();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin:(origin,callback)=>!origin||allowedOrigins.includes(origin)?callback(null,true):callback(new Error('Origin not allowed by CORS')),credentials:true }));
app.use(express.json({ limit: '10mb' }));
app.use(createProviderGate(['/api/life-story-interviewer','/api/vision-memory-enhance','/api/text-to-video-stream','/api/family-legacy-workflow','/api/memory-book-marketplace']));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB schema migrations
async function runMigrations() {
  try {
    await pool.query(`ALTER TABLE memory_books ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE memory_books ADD COLUMN IF NOT EXISTS share_token VARCHAR(64) UNIQUE`);
    await pool.query(`ALTER TABLE memories ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_book_collaborators (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES memory_books(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'contributor',
        invited_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(book_id, user_id)
      )
    `);
    console.log('Migrations complete');
  } catch (e) {
    console.error('Migration error:', e.message);
  }
}

if (process.env.ENABLE_LEGACY_SCHEMA_BOOTSTRAP === 'true') runMigrations();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/memory-books', require('./routes/memoryBooks'));
app.use('/api/memories', require('./routes/memories'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/public', require('./routes/public'));
app.use('/api/heritage-gap-finder', require('./routes/heritageGapFinder'));

// Custom Views (4 endpoints: timeline, heatmap, pdf, themes CRUD) — mounted BEFORE 404
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/governed-memory-corpus', governanceRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/life-story-interviewer', require('./routes/life-story-interviewer'));
app.use('/api/vision-memory-enhance', require('./routes/vision-memory-enhance'));
app.use('/api/text-to-video-stream', require('./routes/text-to-video-stream'));
app.use('/api/family-legacy-workflow', require('./routes/family-legacy-workflow'));
app.use('/api/memory-book-marketplace', require('./routes/memory-book-marketplace'));

// Generated gap routes are quarantined: no mounts until durable provider contracts and acceptance tests exist.

// Final 404 fallback for unknown /api/* routes (registered LAST, after all mounts)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});
