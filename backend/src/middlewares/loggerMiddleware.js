import logger from '../utils/logger.js';

const maskFields = ['password', 'token', 'refreshToken', 'otp', 'aadhaar', 'bankDetails'];

const maskData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const masked = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in masked) {
    if (maskFields.includes(key)) {
      masked[key] = '********';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskData(masked[key]);
    }
  }
  
  return masked;
};

const requestResponseLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  const { method, url, params, query, body, headers } = req;
  const maskedHeaders = maskData(headers);
  const maskedBody = maskData(body);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    logger.info({
      type: 'API_LOG',
      method,
      url,
      params,
      query,
      body: maskedBody,
      headers: maskedHeaders,
      status: statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

export default requestResponseLogger;
