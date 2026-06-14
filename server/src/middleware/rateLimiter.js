const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false, trustProxy: false },
  skip: (req) => req.path === '/health' || req.originalUrl === '/api/health',
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

module.exports = apiLimiter;
