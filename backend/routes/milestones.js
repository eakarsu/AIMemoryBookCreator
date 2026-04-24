const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/milestones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ms.*, m.title AS memory_title
       FROM milestones ms
       LEFT JOIN memories m ON m.id = ms.memory_id
       WHERE ms.user_id = $1
       ORDER BY ms.milestone_date DESC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get milestones error:', error.message);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// GET /api/milestones/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ms.*, m.title AS memory_title
       FROM milestones ms
       LEFT JOIN memories m ON m.id = ms.memory_id
       WHERE ms.id = $1 AND ms.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get milestone error:', error.message);
    res.status(500).json({ error: 'Failed to fetch milestone' });
  }
});

// POST /api/milestones
router.post('/', async (req, res) => {
  try {
    const { title, description, milestone_date, icon, memory_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO milestones (user_id, title, description, milestone_date, icon, memory_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, description || null, milestone_date || null, icon || '⭐', memory_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create milestone error:', error.message);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// PUT /api/milestones/:id
router.put('/:id', async (req, res) => {
  try {
    const { title, description, milestone_date, icon, memory_id } = req.body;

    const result = await pool.query(
      `UPDATE milestones
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           milestone_date = COALESCE($3, milestone_date),
           icon = COALESCE($4, icon),
           memory_id = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, milestone_date, icon, memory_id || null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update milestone error:', error.message);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// DELETE /api/milestones/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM milestones WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json({ success: true, message: 'Milestone deleted' });
  } catch (error) {
    console.error('Delete milestone error:', error.message);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

module.exports = router;
