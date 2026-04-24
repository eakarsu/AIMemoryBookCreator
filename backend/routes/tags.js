const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/tags
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tags WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get tag error:', error.message);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// POST /api/tags
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, color || '#6366f1']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create tag error:', error.message);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/tags/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;

    const result = await pool.query(
      `UPDATE tags
       SET name = COALESCE($1, name),
           color = COALESCE($2, color)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name, color, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tag error:', error.message);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/tags/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    console.error('Delete tag error:', error.message);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// POST /api/tags/:id/memories/:memoryId - add tag to memory
router.post('/:id/memories/:memoryId', async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO memory_tags (memory_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.memoryId, req.params.id]
    );
    res.json({ success: true, message: 'Tag added to memory' });
  } catch (error) {
    console.error('Add tag to memory error:', error.message);
    res.status(500).json({ error: 'Failed to add tag to memory' });
  }
});

// DELETE /api/tags/:id/memories/:memoryId - remove tag from memory
router.delete('/:id/memories/:memoryId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM memory_tags WHERE memory_id = $1 AND tag_id = $2',
      [req.params.memoryId, req.params.id]
    );
    res.json({ success: true, message: 'Tag removed from memory' });
  } catch (error) {
    console.error('Remove tag from memory error:', error.message);
    res.status(500).json({ error: 'Failed to remove tag from memory' });
  }
});

module.exports = router;
