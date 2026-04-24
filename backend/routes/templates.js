const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates ORDER BY category ASC, name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error.message);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM templates WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error.message);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  try {
    const { name, description, structure, category, is_default } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO templates (name, description, structure, category, is_default) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || null, structure || null, category || null, is_default !== undefined ? is_default : true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error.message);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, structure, category, is_default } = req.body;

    const result = await pool.query(
      `UPDATE templates
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           structure = COALESCE($3, structure),
           category = COALESCE($4, category),
           is_default = COALESCE($5, is_default)
       WHERE id = $6
       RETURNING *`,
      [name, description, structure, category, is_default, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error.message);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM templates WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error.message);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
