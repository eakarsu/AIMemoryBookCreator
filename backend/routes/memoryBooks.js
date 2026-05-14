const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

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

// GET /api/memory-books/shared-with-me - books where user is a collaborator
router.get('/shared-with-me', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mb.*, COUNT(m.id)::int AS memory_count, mbc.role
       FROM memory_book_collaborators mbc
       JOIN memory_books mb ON mb.id = mbc.book_id
       LEFT JOIN memories m ON m.book_id = mb.id
       WHERE mbc.user_id = $1
       GROUP BY mb.id, mbc.role
       ORDER BY mbc.invited_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get shared books error:', error.message);
    res.status(500).json({ error: 'Failed to fetch shared books' });
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

// GET /api/memory-books/:id/memories - get memories for a book with pagination
router.get('/:id/memories', async (req, res) => {
  try {
    // Verify ownership or collaborator
    const bookCheck = await pool.query(
      `SELECT mb.id FROM memory_books mb
       LEFT JOIN memory_book_collaborators mbc ON mbc.book_id = mb.id AND mbc.user_id = $2
       WHERE mb.id = $1 AND (mb.user_id = $2 OR mbc.user_id IS NOT NULL)`,
      [req.params.id, req.user.id]
    );
    if (bookCheck.rows.length === 0) return res.status(404).json({ error: 'Memory book not found' });

    const pageNum = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM memories WHERE book_id = $1',
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT m.*, c.name AS category_name FROM memories m
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.book_id = $1
       ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limitNum, offset]
    );

    res.json({
      data: result.rows,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Get book memories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch memories' });
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

// POST /api/memory-books/:id/share - generate share token
router.post('/:id/share', async (req, res) => {
  try {
    const bookCheck = await pool.query('SELECT id FROM memory_books WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (bookCheck.rows.length === 0) return res.status(404).json({ error: 'Memory book not found' });

    const shareToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      'UPDATE memory_books SET is_public = TRUE, share_token = $1 WHERE id = $2 AND user_id = $3 RETURNING id, title, share_token',
      [shareToken, req.params.id, req.user.id]
    );

    res.json({
      success: true,
      share_token: result.rows[0].share_token,
      share_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/public/books/${result.rows[0].share_token}`
    });
  } catch (error) {
    console.error('Share book error:', error.message);
    res.status(500).json({ error: 'Failed to share book' });
  }
});

// POST /api/memory-books/:id/invite - invite collaborator
router.post('/:id/invite', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const bookCheck = await pool.query('SELECT id FROM memory_books WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (bookCheck.rows.length === 0) return res.status(404).json({ error: 'Memory book not found' });

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User with that email not found' });

    const inviteeId = userResult.rows[0].id;
    if (inviteeId === req.user.id) return res.status(400).json({ error: 'Cannot invite yourself' });

    await pool.query(
      `INSERT INTO memory_book_collaborators (book_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (book_id, user_id) DO NOTHING`,
      [req.params.id, inviteeId, role || 'contributor']
    );

    res.json({ success: true, message: `Collaborator ${email} invited` });
  } catch (error) {
    console.error('Invite collaborator error:', error.message);
    res.status(500).json({ error: 'Failed to invite collaborator' });
  }
});

// GET /api/memory-books/:id/export-pdf - generate PDF export
router.get('/:id/export-pdf', async (req, res) => {
  try {
    const bookResult = await pool.query(
      'SELECT * FROM memory_books WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (bookResult.rows.length === 0) return res.status(404).json({ error: 'Memory book not found' });

    const book = bookResult.rows[0];

    const memoriesResult = await pool.query(
      `SELECT m.*, c.name AS category_name FROM memories m
       LEFT JOIN categories c ON c.id = m.category_id
       WHERE m.book_id = $1
       ORDER BY m.memory_date ASC NULLS LAST, m.created_at ASC`,
      [req.params.id]
    );

    const memories = memoriesResult.rows;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="memory-book-${book.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Title page
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f7ff');
    doc.fill('#6366f1').fontSize(32).font('Helvetica-Bold')
      .text(book.title, 50, 180, { align: 'center' });

    if (book.description) {
      doc.fill('#555').fontSize(14).font('Helvetica')
        .text(book.description, 50, 240, { align: 'center' });
    }

    doc.fill('#888').fontSize(11)
      .text(`${memories.length} memories`, 50, 300, { align: 'center' });

    doc.fill('#aaa').fontSize(10)
      .text(`Generated on ${new Date().toLocaleDateString()}`, 50, 320, { align: 'center' });

    // Memory entries
    memories.forEach((memory, index) => {
      doc.addPage();
      doc.fill('#6366f1').rect(50, 40, doc.page.width - 100, 4).fill();

      doc.fill('#1a1a2e').fontSize(18).font('Helvetica-Bold')
        .text(memory.title, 50, 60);

      let yPos = 90;

      const metaParts = [];
      if (memory.memory_date) metaParts.push(new Date(memory.memory_date).toLocaleDateString());
      if (memory.location) metaParts.push(memory.location);
      if (memory.emotion) metaParts.push(memory.emotion.charAt(0).toUpperCase() + memory.emotion.slice(1));
      if (memory.category_name) metaParts.push(memory.category_name);

      if (metaParts.length > 0) {
        doc.fill('#6366f1').fontSize(10).font('Helvetica')
          .text(metaParts.join('  •  '), 50, yPos);
        yPos += 20;
      }

      if (memory.content) {
        doc.fill('#333').fontSize(12).font('Helvetica')
          .text(memory.content, 50, yPos + 10, { width: doc.page.width - 100, lineGap: 4 });
      }
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;
