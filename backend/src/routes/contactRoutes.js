import express from 'express';
import rateLimit from 'express-rate-limit';
import ContactController from '../controllers/ContactController.js';
import { protect, authorizeRole } from '../middlewares/auth.js';

const router = express.Router();

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many contact submissions. Please try again later.' }
});

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form submissions
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, message]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/contact', contactFormLimiter, ContactController.submit);

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: Get all contact messages
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 */
router.get('/contact', protect, authorizeRole('Admin'), ContactController.getAll);

/**
 * @swagger
 * /contact/{id}/read:
 *   patch:
 *     summary: Mark message as read
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/contact/:id/read', protect, authorizeRole('Admin'), ContactController.markAsRead);

export default router;
