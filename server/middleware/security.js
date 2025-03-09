/**
 * Comprehensive Security middleware for DnD Brand API
 */
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Set secure HTTP headers
const setSecureHeaders = (req, res, next) => {
  // Set Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self'"
  );
  
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Enable XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent loading from other domains
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add Strict-Transport-Security header (HSTS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Log all requests
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.http(`${req.method} ${req.originalUrl} [IP: ${req.ip}]`);
  
  // Log response time on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  
  next();
};

// Check for suspicious request patterns
const detectSuspiciousActivity = (req, res, next) => {
  // Check for SQL injection attempts
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)/i;
  const requestUrl = req.url;
  
  if (sqlInjectionPattern.test(requestUrl)) {
    logger.warn(`Possible SQL injection attempt: ${requestUrl} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
  }
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    'sqlmap',
    'nikto',
    'nessus',
    'nmap',
    'acunetix',
    'burp',
    'masscan',
    'zgrab',
    'gobuster',
    'dirbuster'
  ];
  
  const userAgent = req.headers['user-agent'] || '';
  
  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    logger.warn(`Suspicious user agent detected: ${userAgent} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
  }
  
  // Additional checks for path traversal attacks
  const pathTraversalPattern = /(\.\.)|(\.\/)/i;
  if (pathTraversalPattern.test(requestUrl)) {
    logger.warn(`Possible path traversal attempt: ${requestUrl} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
  }
  
  next();
};

// Create login rate limiter
const loginRateLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.LOGIN_RATE_LIMIT_MAX || 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for login: ${req.ip}`);
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    });
  }
});

// Validate request parameters
const validateRequestParams = (req, res, next) => {
  // Validate MongoDB ObjectId format for ID parameters
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (req.params.id && !objectIdPattern.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  next();
};

module.exports = {
  setSecureHeaders,
  requestLogger,
  detectSuspiciousActivity,
  validateRequestParams,
  loginRateLimiter
}; 