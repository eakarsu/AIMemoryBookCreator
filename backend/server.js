const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./db');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

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

runMigrations();

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

// Custom Views (4 endpoints: timeline, heatmap, pdf, themes CRUD) — mounted BEFORE 404
app.use('/api/custom-views', require('./routes/customViews'));

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

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_generate_timeline = require('./routes/gap-generate-timeline'); app.use('/api/gap-generate-timeline', _gap_generate_timeline); } catch(e) { console.error('gap mount fail generate-timeline:', e.message); }
try { const _gap_relationship_mapper = require('./routes/gap-relationship-mapper'); app.use('/api/gap-relationship-mapper', _gap_relationship_mapper); } catch(e) { console.error('gap mount fail relationship-mapper:', e.message); }
try { const _gap_memory_search = require('./routes/gap-memory-search'); app.use('/api/gap-memory-search', _gap_memory_search); } catch(e) { console.error('gap mount fail memory-search:', e.message); }
try { const _gap_comparison_highlight = require('./routes/gap-comparison-highlight'); app.use('/api/gap-comparison-highlight', _gap_comparison_highlight); } catch(e) { console.error('gap mount fail comparison-highlight:', e.message); }
try { const _gap_collaborative = require('./routes/gap-collaborative'); app.use('/api/gap-collaborative', _gap_collaborative); } catch(e) { console.error('gap mount fail collaborative:', e.message); }
try { const _gap_video = require('./routes/gap-video'); app.use('/api/gap-video', _gap_video); } catch(e) { console.error('gap mount fail video:', e.message); }
try { const _gap_audio = require('./routes/gap-audio'); app.use('/api/gap-audio', _gap_audio); } catch(e) { console.error('gap mount fail audio:', e.message); }
try { const _gap_granular = require('./routes/gap-granular'); app.use('/api/gap-granular', _gap_granular); } catch(e) { console.error('gap mount fail granular:', e.message); }
try { const _gap_print_on_demand = require('./routes/gap-print-on-demand'); app.use('/api/gap-print-on-demand', _gap_print_on_demand); } catch(e) { console.error('gap mount fail print-on-demand:', e.message); }
try { const _gap_email_sms = require('./routes/gap-email-sms'); app.use('/api/gap-email-sms', _gap_email_sms); } catch(e) { console.error('gap mount fail email-sms:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
// === End Batch 05 Mounts ===

// Final 404 fallback for unknown /api/* routes (registered LAST, after all mounts)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});
