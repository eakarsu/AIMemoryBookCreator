const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/memory-books - list all books for user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mb.*, COUNT(m.id)::int AS memory_count
       FROM memory_books mb
       LEFT JOIN memories m ON m.book_id = mb.id
       WHERE mb.user_id = $1
       GROUP BY mb.id
       ORDER BY mb.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get memory books error:', error.message);
    res.status(500).json({ error: 'Failed to fetch memory books' });
  }
});

// GET /api/memory-books/:id - get single book with memory count
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mb.*, COUNT(m.id)::int AS memory_count
       FROM memory_books mb
       LEFT JOIN memories m ON m.book_id = mb.id
       WHERE mb.id = $1 AND mb.user_id = $2
       GROUP BY mb.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get memory book error:', error.message);
    res.status(500).json({ error: 'Failed to fetch memory book' });
  }
});

// POST /api/memory-books - create new book
router.post('/', async (req, res) => {
  try {
    const { title, description, cover_color } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO memory_books (user_id, title, description, cover_color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description || null, cover_color || '#6366f1']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create memory book error:', error.message);
    res.status(500).json({ error: 'Failed to create memory book' });
  }
});

// PUT /api/memory-books/:id - update book
router.put('/:id', async (req, res) => {
  try {
    const { title, description, cover_color } = req.body;

    const result = await pool.query(
      `UPDATE memory_books
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           cover_color = COALESCE($3, cover_color),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description, cover_color, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory book not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update memory book error:', error.message);
    res.status(500).json({ error: 'Failed to update memory book' });
  }
});

// DELETE /api/memory-books/:id - delete book
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM memory_books WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory book not found' });
    }

    res.json({ success: true, message: 'Memory book deleted' });
  } catch (error) {
    console.error('Delete memory book error:', error.message);
    res.status(500).json({ error: 'Failed to delete memory book' });
  }
});

module.exports = router;
