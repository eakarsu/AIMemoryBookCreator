const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/memories - list all memories for user (optional ?book_id= filter)
router.get('/', async (req, res) => {
  try {
    const { book_id } = req.query;
    let query, params;

    if (book_id) {
      query = `SELECT m.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
               FROM memories m
               LEFT JOIN categories c ON c.id = m.category_id
               LEFT JOIN memory_tags mt ON mt.memory_id = m.id
               LEFT JOIN tags t ON t.id = mt.tag_id
               WHERE m.user_id = $1 AND m.book_id = $2
               GROUP BY m.id, c.name, c.color, c.icon
               ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC`;
      params = [req.user.id, book_id];
    } else {
      query = `SELECT m.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
               FROM memories m
               LEFT JOIN categories c ON c.id = m.category_id
               LEFT JOIN memory_tags mt ON mt.memory_id = m.id
               LEFT JOIN tags t ON t.id = mt.tag_id
               WHERE m.user_id = $1
               GROUP BY m.id, c.name, c.color, c.icon
               ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC`;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get memories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// GET /api/memories/:id - get single memory with tags
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
              COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
       FROM memories m
       LEFT JOIN categories c ON c.id = m.category_id
       LEFT JOIN memory_tags mt ON mt.memory_id = m.id
       LEFT JOIN tags t ON t.id = mt.tag_id
       WHERE m.id = $1 AND m.user_id = $2
       GROUP BY m.id, c.name, c.color, c.icon`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get memory error:', error.message);
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// POST /api/memories - create new memory
router.post('/', async (req, res) => {
  try {
    const { book_id, title, content, memory_date, location, emotion, category_id, image_url, is_favorite, tag_ids } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      `INSERT INTO memories (book_id, user_id, title, content, memory_date, location, emotion, category_id, image_url, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [book_id || null, req.user.id, title, content || null, memory_date || null, location || null, emotion || null, category_id || null, image_url || null, is_favorite || false]
    );

    const memory = result.rows[0];

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagValues = tag_ids.map((tagId, i) => `($1, $${i + 2})`).join(', ');
      const tagParams = [memory.id, ...tag_ids];
      await pool.query(`INSERT INTO memory_tags (memory_id, tag_id) VALUES ${tagValues}`, tagParams);
    }

    res.status(201).json(memory);
  } catch (error) {
    console.error('Create memory error:', error.message);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// PUT /api/memories/:id - update memory
router.put('/:id', async (req, res) => {
  try {
    const { title, content, memory_date, location, emotion, category_id, image_url, is_favorite, book_id, tag_ids } = req.body;

    const result = await pool.query(
      `UPDATE memories
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           memory_date = COALESCE($3, memory_date),
           location = COALESCE($4, location),
           emotion = COALESCE($5, emotion),
           category_id = $6,
           image_url = COALESCE($7, image_url),
           is_favorite = COALESCE($8, is_favorite),
           book_id = COALESCE($9, book_id),
           updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [title, content, memory_date, location, emotion, category_id || null, image_url, is_favorite, book_id, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      await pool.query('DELETE FROM memory_tags WHERE memory_id = $1', [req.params.id]);
      if (tag_ids.length > 0) {
        const tagValues = tag_ids.map((tagId, i) => `($1, $${i + 2})`).join(', ');
        const tagParams = [req.params.id, ...tag_ids];
        await pool.query(`INSERT INTO memory_tags (memory_id, tag_id) VALUES ${tagValues}`, tagParams);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update memory error:', error.message);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

// DELETE /api/memories/:id - delete memory
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM memories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ success: true, message: 'Memory deleted' });
  } catch (error) {
    console.error('Delete memory error:', error.message);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

module.exports = router;
