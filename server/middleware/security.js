/**
 * Security middleware for DnD Brand API
 */

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
  
  next();
};

// Log all requests
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

// Check for suspicious request patterns
const detectSuspiciousActivity = (req, res, next) => {
  // Check for SQL injection attempts
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)/i;
  const requestUrl = req.url;
  
  if (sqlInjectionPattern.test(requestUrl)) {
    console.warn(`Possible SQL injection attempt: ${requestUrl}`);
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
    'burp'
  ];
  
  const userAgent = req.headers['user-agent'] || '';
  
  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    console.warn(`Suspicious user agent detected: ${userAgent}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden'
    });
  }
  
  next();
};

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
  validateRequestParams
}; 