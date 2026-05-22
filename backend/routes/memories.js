const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(auth);

// Multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `memory-${req.params.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'));
    }
  }
});

// GET /api/memories - list all memories for user with pagination
router.get('/', async (req, res) => {
  try {
    const { book_id, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let countQuery, dataQuery, params;

    if (book_id) {
      countQuery = `SELECT COUNT(*) FROM memories m WHERE m.user_id = $1 AND m.book_id = $2`;
      dataQuery = `SELECT m.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
               FROM memories m
               LEFT JOIN categories c ON c.id = m.category_id
               LEFT JOIN memory_tags mt ON mt.memory_id = m.id
               LEFT JOIN tags t ON t.id = mt.tag_id
               WHERE m.user_id = $1 AND m.book_id = $2
               GROUP BY m.id, c.name, c.color, c.icon
               ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC
               LIMIT $3 OFFSET $4`;
      params = [req.user.id, book_id];
    } else {
      countQuery = `SELECT COUNT(*) FROM memories m WHERE m.user_id = $1`;
      dataQuery = `SELECT m.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                      COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FILTER (WHERE t.id IS NOT NULL), '[]') AS tags
               FROM memories m
               LEFT JOIN categories c ON c.id = m.category_id
               LEFT JOIN memory_tags mt ON mt.memory_id = m.id
               LEFT JOIN tags t ON t.id = mt.tag_id
               WHERE m.user_id = $1
               GROUP BY m.id, c.name, c.color, c.icon
               ORDER BY m.memory_date DESC NULLS LAST, m.created_at DESC
               LIMIT $2 OFFSET $3`;
      params = [req.user.id];
    }

    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    const dataParams = book_id
      ? [...params, limitNum, offset]
      : [...params, limitNum, offset];

    const result = await pool.query(dataQuery, dataParams);

    // If no page param, return plain array for backwards compat
    if (!page) {
      return res.json(result.rows);
    }

    res.json({
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
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

// POST /api/memories/:id/upload-photo
router.post('/:id/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    // Verify memory belongs to user
    const memCheck = await pool.query('SELECT id FROM memories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (memCheck.rows.length === 0) return res.status(404).json({ error: 'Memory not found' });

    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const photoUrl = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE memories SET photo_url = $1, updated_at = NOW() WHERE id = $2', [photoUrl, req.params.id]);

    res.json({ success: true, photo_url: photoUrl });
  } catch (error) {
    console.error('Upload photo error:', error.message);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// POST /api/memories/:id/analyze-photo - AI vision analysis
router.post('/:id/analyze-photo', async (req, res) => {
  try {
    const memResult = await pool.query('SELECT * FROM memories WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (memResult.rows.length === 0) return res.status(404).json({ error: 'Memory not found' });

    const memory = memResult.rows[0];
    if (!memory.photo_url) return res.status(400).json({ error: 'No photo attached to this memory' });

    const photoPath = path.join(__dirname, '..', memory.photo_url);
    if (!fs.existsSync(photoPath)) return res.status(404).json({ error: 'Photo file not found' });

    const imageData = fs.readFileSync(photoPath);
    const base64Image = imageData.toString('base64');
    const mimeType = memory.photo_url.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Memory Book Creator'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate memory preservation specialist. Help users capture, enhance, and cherish their personal memories and life stories with warmth and emotional intelligence.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              },
              {
                type: 'text',
                text: 'Analyze this memory photo. Return JSON: { scene_description, estimated_date_period, people_count, mood, suggested_caption, memory_prompt }'
              }
            ]
          }
        ],
        max_tokens: 800
      })
    });

    if (!response.ok) throw new Error('OpenRouter error: ' + response.status);

    const data = await response.json();
    const resultText = data.choices[0].message.content;

    // Parse using robust JSON parser
    const codeBlockMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/);
    let parsed;
    try {
      parsed = JSON.parse(codeBlockMatch ? codeBlockMatch[1].trim() : resultText);
    } catch (_) {
      const jsonMatch = resultText.match(/(\{[\s\S]*\})/);
      try { parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : { raw: resultText }; } catch (_) { parsed = { raw: resultText }; }
    }

    res.json({ success: true, analysis: parsed });
  } catch (error) {
    console.error('Analyze photo error:', error.message);
    res.status(500).json({ error: 'Failed to analyze photo' });
  }
});

module.exports = router;
