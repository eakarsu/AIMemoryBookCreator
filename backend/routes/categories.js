const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get category error:', error.message);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO categories (user_id, name, color, icon, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, name, color || '#6366f1', icon || '📁', description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error.message);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           icon = COALESCE($3, icon),
           description = COALESCE($4, description)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, color, icon, description, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error.message);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
