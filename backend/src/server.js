import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

// Ensure JWT secret is present before continuing
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

import express from 'express';
import dns from 'node:dns';

// Fix for MongoDB querySrv ECONNREFUSED on some networks/Windows
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/database.js';
import swaggerSpec from './config/swagger.js';
import requestResponseLogger from './middlewares/loggerMiddleware.js';
import logger from './utils/logger.js';

// Route imports
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import { startTelegramListener } from './utils/telegramListener.js';

// Initialize Express app
const app = express();
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Global Request-Response Logger
app.use(requestResponseLogger);

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173', // Vite default
  'http://localhost:8080',
  'http://localhost:8081',
  'https://remarkable-tarsier-af2904.netlify.app',
  'https://cycle-harmony-v2.netlify.app',
  'https://nhcservice.online',
  'https://nhcservice.in',
  'https://www.nhcservice.in',
  'http://nhcservice.in',
  'http://www.nhcservice.in'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true
}));

// Apply global security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(cookieParser());

// Apply payload limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use(globalLimiter);
app.use('/api/v1/auth', authLimiter);

// Routes with Versioning
const API_PREFIX = '/api/v1';
app.use(API_PREFIX, authRoutes);
app.use(API_PREFIX, orderRoutes);
app.use(API_PREFIX, customerRoutes);
app.use(API_PREFIX, ingredientRoutes);
app.use(API_PREFIX, contactRoutes);
app.use(API_PREFIX, chatbotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({
    success: true,
    status: 'OK',
    db: dbStatus,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Root redirect to Swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error with Winston
  logger.error({
    type: 'ERROR',
    status: statusCode,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred!' : message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);

  // Start Telegram AI Agent Listener
  startTelegramListener();
});
