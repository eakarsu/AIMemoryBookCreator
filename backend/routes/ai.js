const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const SYSTEM_PROMPT = 'You are a compassionate memory preservation specialist. Help users capture, enhance, and cherish their personal memories and life stories with warmth and emotional intelligence.';

router.use(auth);
router.use(aiRateLimiter);

// Helper: call OpenRouter API
async function callOpenRouter(prompt, maxTokens = 1000) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('LLM unavailable: OPENROUTER_API_KEY not configured');
    e.code = 'LLM_UNAVAILABLE';
    throw e;
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Memory Book Creator'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens
    })
  });

  if (!response.ok) throw new Error('OpenRouter error: ' + response.status);

  const data = await response.json();
  return data;
}

// Helper: robust JSON parser (3 strategies)
function parseAIJson(text) {
  // Strategy 1: direct parse
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Strategy 2: extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {}
  }

  // Strategy 3: find first { ... } or [ ... ] in the string
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (_) {}
  }

  // Return null if all strategies fail
  return null;
}

// Helper: save AI generation to database
async function saveGeneration(userId, type, inputText, outputText, memoryId = null) {
  await pool.query(
    'INSERT INTO ai_generations (user_id, type, input_text, output_text, memory_id) VALUES ($1, $2, $3, $4, $5)',
    [userId, type, inputText, outputText, memoryId]
  );
}

// POST /api/ai/generate-story
router.post('/generate-story', async (req, res) => {
  try {
    const { memoryText, tone } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Transform the following memory into a beautifully written narrative story with a ${tone || 'warm and nostalgic'} tone. Make it vivid and engaging while staying true to the original memory.\n\nMemory: ${memoryText}`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'story', memoryText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate story error:', error.message);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

// POST /api/ai/generate-caption
router.post('/generate-caption', async (req, res) => {
  try {
    const { memoryText, style } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Generate a ${style || 'heartfelt'} caption for this memory or photo description. Keep it concise and meaningful. Provide 3 caption options.\n\nMemory/Description: ${memoryText}`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'caption', memoryText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate caption error:', error.message);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
});

// POST /api/ai/generate-prompts
router.post('/generate-prompts', async (req, res) => {
  try {
    const { category, count } = req.body;
    const promptCount = count || 5;

    const prompt = `Generate ${promptCount} thoughtful and specific memory recall prompts for the category "${category || 'general'}". These should help someone remember and write about meaningful moments. Return them as a numbered list.`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'prompts', category || 'general', result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate prompts error:', error.message);
    res.status(500).json({ error: 'Failed to generate prompts' });
  }
});

// POST /api/ai/analyze-sentiment
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { memoryText } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Analyze the emotion and sentiment of this memory. Provide:\n1. Primary emotion (one word)\n2. Sentiment score (1-10, where 1 is very negative and 10 is very positive)\n3. Emotional tone description (one sentence)\n4. Key emotional themes (list 3-5)\n\nReturn the response as JSON with keys: emotion, score, tone, themes.\n\nMemory: ${memoryText}`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'sentiment', memoryText, result);

    const parsedResult = parseAIJson(result) || result;

    res.json({ success: true, result: parsedResult, raw: data });
  } catch (error) {
    console.error('Analyze sentiment error:', error.message);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// POST /api/ai/generate-poetry
router.post('/generate-poetry', async (req, res) => {
  try {
    const { memoryText, style } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Write a beautiful ${style || 'free verse'} poem inspired by this memory. The poem should capture the essence and emotion of the moment.\n\nMemory: ${memoryText}`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'poetry', memoryText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate poetry error:', error.message);
    res.status(500).json({ error: 'Failed to generate poetry' });
  }
});

// POST /api/ai/generate-quote
router.post('/generate-quote', async (req, res) => {
  try {
    const { theme } = req.body;

    const prompt = `Generate 3 unique, original inspirational quotes about ${theme || 'memories and cherishing moments'}. Each quote should be meaningful and thought-provoking. Format each quote on its own line with quotation marks.`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'quote', theme || 'memories', result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate quote error:', error.message);
    res.status(500).json({ error: 'Failed to generate quote' });
  }
});

// POST /api/ai/generate-summary
router.post('/generate-summary', async (req, res) => {
  try {
    const { memories } = req.body;
    if (!memories || !memories.length) return res.status(400).json({ error: 'memories array is required' });

    const memoriesText = memories.map((m, i) => `${i + 1}. ${m.title || ''}: ${m.content || m}`).join('\n');
    const prompt = `Create a beautiful, cohesive summary that weaves together these memories into a narrative overview. Highlight common themes and the emotional journey.\n\nMemories:\n${memoriesText}`;

    const data = await callOpenRouter(prompt, 1500);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'summary', memoriesText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate summary error:', error.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/ai/generate-title
router.post('/generate-title', async (req, res) => {
  try {
    const { memoryText } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Generate 5 creative, evocative titles for this memory. Each title should capture the essence of the moment in a few words. Return them as a numbered list.\n\nMemory: ${memoryText}`;

    const data = await callOpenRouter(prompt);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'title', memoryText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Generate title error:', error.message);
    res.status(500).json({ error: 'Failed to generate title' });
  }
});

// POST /api/ai/enhance-memory
router.post('/enhance-memory', async (req, res) => {
  try {
    const { memoryText } = req.body;
    if (!memoryText) return res.status(400).json({ error: 'memoryText is required' });

    const prompt = `Enhance and expand this memory with more vivid sensory details, emotions, and descriptive language. Keep the core facts the same but make it more immersive and beautifully written. Add details about sights, sounds, smells, and feelings that might have been present.\n\nOriginal Memory: ${memoryText}`;

    const data = await callOpenRouter(prompt, 1500);
    const result = data.choices[0].message.content;

    await saveGeneration(req.user.id, 'enhance', memoryText, result);

    res.json({ success: true, result, raw: data });
  } catch (error) {
    console.error('Enhance memory error:', error.message);
    res.status(500).json({ error: 'Failed to enhance memory' });
  }
});

// POST /api/ai/generate-timeline — visualize memory chronology
router.post('/generate-timeline', async (req, res) => {
  try {
    const { memoryBookId } = req.body;
    let memories = [];
    try {
      const where = memoryBookId
        ? 'WHERE memory_book_id = $1 AND user_id = $2'
        : 'WHERE user_id = $1';
      const params = memoryBookId ? [memoryBookId, req.user.id] : [req.user.id];
      const r = await pool.query(`SELECT id, title, content, memory_date, tags FROM memories ${where} ORDER BY memory_date ASC NULLS LAST LIMIT 200`, params);
      memories = r.rows;
    } catch (e) { /* table shape may differ */ }

    const prompt = `Build a chronological timeline from these memories. If exact dates are missing, group by inferred eras and order them as best as possible.

Memories: ${JSON.stringify(memories).slice(0, 6000)}

Return ONLY JSON: { "timeline": [{ "memory_id": any, "title": string, "approx_date": string, "era": string, "summary": string }], "eras": [{ "name": string, "memory_ids": [any], "theme": string }], "narrative_arc": string }`;

    const data = await callOpenRouter(prompt, 1800);
    const result = data.choices[0].message.content;
    const structured = parseAIJson(result);
    await saveGeneration(req.user.id, 'timeline', `book:${memoryBookId || 'all'}`, result, null);
    res.json({ success: true, result, structured });
  } catch (error) {
    console.error('Generate timeline error:', error.message);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
});

// POST /api/ai/relationship-mapper — extract people/relationships from memories
router.post('/relationship-mapper', async (req, res) => {
  try {
    const { memoryBookId } = req.body;
    let memories = [];
    try {
      const where = memoryBookId
        ? 'WHERE memory_book_id = $1 AND user_id = $2'
        : 'WHERE user_id = $1';
      const params = memoryBookId ? [memoryBookId, req.user.id] : [req.user.id];
      const r = await pool.query(`SELECT id, title, content FROM memories ${where} LIMIT 200`, params);
      memories = r.rows;
    } catch (e) { /* table shape may differ */ }

    const prompt = `Extract people mentioned in these memories and the relationships between them.

Memories: ${JSON.stringify(memories).slice(0, 6000)}

Return ONLY JSON: { "people": [{ "name": string, "role": string, "first_mentioned_in_memory_id": any, "co_occurrences": [string] }], "relationships": [{ "from": string, "to": string, "type": string, "evidence_memory_ids": [any] }], "family_tree_hint": string }`;

    const data = await callOpenRouter(prompt, 1800);
    const result = data.choices[0].message.content;
    const structured = parseAIJson(result);
    await saveGeneration(req.user.id, 'relationship-map', `book:${memoryBookId || 'all'}`, result, null);
    res.json({ success: true, result, structured });
  } catch (error) {
    console.error('Relationship mapper error:', error.message);
    res.status(500).json({ error: 'Failed to map relationships' });
  }
});

// POST /api/ai/comparison-highlight — diff two memories: shared themes, divergences, emotional contrast
router.post('/comparison-highlight', async (req, res) => {
  try {
    const { memoryIdA, memoryIdB, textA, textB } = req.body;
    let a = textA || null;
    let b = textB || null;

    // Try DB lookup if IDs provided
    if (memoryIdA && !a) {
      try {
        const r = await pool.query(`SELECT id, title, content FROM memories WHERE id = $1 AND user_id = $2`, [memoryIdA, req.user.id]);
        if (r.rows[0]) a = `${r.rows[0].title || ''}\n${r.rows[0].content || ''}`.trim();
      } catch (_) { /* schema may differ */ }
    }
    if (memoryIdB && !b) {
      try {
        const r = await pool.query(`SELECT id, title, content FROM memories WHERE id = $1 AND user_id = $2`, [memoryIdB, req.user.id]);
        if (r.rows[0]) b = `${r.rows[0].title || ''}\n${r.rows[0].content || ''}`.trim();
      } catch (_) { /* schema may differ */ }
    }

    if (!a || !b) return res.status(400).json({ error: 'Provide textA + textB OR memoryIdA + memoryIdB' });

    const prompt = `Compare these two memories and highlight similarities, differences, and emotional contrast.

Memory A: ${String(a).slice(0, 3000)}

Memory B: ${String(b).slice(0, 3000)}

Return ONLY JSON: {
  "shared_themes": [string],
  "unique_to_a": [string],
  "unique_to_b": [string],
  "emotional_contrast": { "a_tone": string, "b_tone": string, "shift": string },
  "shared_people_or_places": [string],
  "highlight_summary": string
}`;

    const data = await callOpenRouter(prompt, 1500);
    const result = data.choices[0].message.content;
    const structured = parseAIJson(result);
    await saveGeneration(req.user.id, 'comparison-highlight', `${memoryIdA || 'A'}|${memoryIdB || 'B'}`, result, null);
    res.json({ success: true, result, structured });
  } catch (error) {
    if (error.code === 'LLM_UNAVAILABLE') {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    console.error('Comparison highlight error:', error.message);
    res.status(500).json({ error: 'Failed to generate comparison' });
  }
});

router.parseAIJson = parseAIJson;
module.exports = router;
