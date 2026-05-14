const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    // Normalize IPv6 mapped IPv4
    const ip = req.ip || '';
    return ip.replace(/^::ffff:/, '');
  },
  validate: { trustProxy: false, xForwardedForHeader: false, keyGeneratorIpFallback: false },
  message: { error: 'Too many AI requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
