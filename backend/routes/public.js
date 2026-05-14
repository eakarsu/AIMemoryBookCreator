const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/public/memory-books/:token - view shared book (no auth required)
router.get('/memory-books/:token', async (req, res) => {
  try {
    const bookResult = await pool.query(
      'SELECT id, title, description, cover_color, created_at FROM memory_books WHERE share_token = $1 AND is_public = TRUE',
      [req.params.token]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shared book not found or no longer public' });
    }

    const book = bookResult.rows[0];

    const memoriesResult = await pool.query(
      `SELECT m.title, m.content, m.memory_date, m.location, m.emotion, m.photo_url,
              c.name AS category_name
       FROM memories m
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.book_id = $1
       ORDER BY m.memory_date ASC NULLS LAST, m.created_at ASC`,
      [book.id]
    );

    res.json({ book, memories: memoriesResult.rows });
  } catch (error) {
    console.error('Public book error:', error.message);
    res.status(500).json({ error: 'Failed to fetch public book' });
  }
});

module.exports = router;
