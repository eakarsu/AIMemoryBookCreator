const router = require('express').Router();

router.post('/analyze', (req, res) => {
  const { eras = [], people = [], places = [], artifacts = [] } = req.body || {};
  const missing = [];
  if (!eras.includes('childhood')) missing.push('childhood');
  if (!eras.includes('early-adulthood')) missing.push('early adulthood');
  if ((people || []).length < 3) missing.push('family voices');
  if ((places || []).length < 2) missing.push('important places');
  if ((artifacts || []).length < 2) missing.push('keepsake artifacts');
  const score = Math.max(0, 100 - missing.length * 18);
  res.json({
    feature: 'heritage_gap_finder',
    completenessScore: score,
    missing,
    prompts: missing.map((gap) => `Capture one memory about ${gap} with a date, place, and person.`),
  });
});

module.exports = router;
