import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

// Ensure JWT secret is present before continuing
if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import orderRoutes from './routes/orderRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import ingredientRoutes from './routes/ingredientRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { startTelegramListener } from './utils/telegramListener.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
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

// Apply payload limits to prevent large payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate Limiting — Issue #7 fix
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased from 10
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased from 5
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use(globalLimiter);
app.use('/api/orders', strictLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', customerRoutes);
app.use('/api', ingredientRoutes);
app.use('/api', contactRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.status(200).json({
    status: 'OK',
    db: dbStatus,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cycle Harmony Laddus API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      orders: {
        create: 'POST /api/orders',
        getAll: 'GET /api/orders',
        getById: 'GET /api/orders/:id',
        updateStatus: 'PATCH /api/orders/:id/status',
        delete: 'DELETE /api/orders/:id'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log full error stack on the server
  console.error("Server Error Log:", err.stack);
  import('fs').then(fs => fs.appendFileSync('error.log', new Date().toISOString() + ' ' + err.stack + '\\n')).catch(e => {});
  
  // Return a generic error message to clients to avoid leaking sensitive information
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred!',
    error: isDev ? err.message : 'Internal Server Error'
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
  console.log(`🌐 API available at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);

  // Start Telegram AI Agent Listener
  startTelegramListener();
});

