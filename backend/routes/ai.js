const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

// Helper: call OpenRouter API
async function callOpenRouter(prompt, maxTokens = 1000) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Memory Book Creator'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens
    })
  });
  const data = await response.json();
  return data;
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

    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      parsedResult = result;
    }

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

module.exports = router;
