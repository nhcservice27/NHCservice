import express from 'express';
import rateLimit from 'express-rate-limit';
import ChatbotController from '../controllers/ChatbotController.js';
import { protect, authorizeRole, attachOptionalCustomer } from '../middlewares/auth.js';

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many chat requests. Please try again later.' }
});

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Assistant and RAG management
 */

/**
 * @swagger
 * /chatbot/chat:
 *   post:
 *     summary: Send a message to the AI chatbot
 *     tags: [Chatbot]
 */
router.post('/chatbot/chat', chatLimiter, attachOptionalCustomer, ChatbotController.chat);

/**
 * @swagger
 * /chatbot/settings:
 *   get:
 *     summary: Get chatbot settings
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/chatbot/settings', protect, authorizeRole('Admin'), ChatbotController.getSettings);

/**
 * @swagger
 * /chatbot/settings:
 *   patch:
 *     summary: Update chatbot settings
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/chatbot/settings', protect, authorizeRole('Admin'), ChatbotController.updateSettings);

/**
 * @swagger
 * /chatbot/knowledge:
 *   get:
 *     summary: Get knowledge chunks
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/chatbot/knowledge', protect, authorizeRole('Admin'), ChatbotController.getKnowledge);

/**
 * @swagger
 * /chatbot/knowledge:
 *   post:
 *     summary: Add knowledge chunk
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
router.post('/chatbot/knowledge', protect, authorizeRole('Admin'), ChatbotController.addKnowledge);

/**
 * @swagger
 * /chatbot/chats:
 *   get:
 *     summary: Get chat history
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
router.get('/chatbot/chats', protect, authorizeRole('Admin'), ChatbotController.getAllChats);

export default router;
