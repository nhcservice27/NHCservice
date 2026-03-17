import express from 'express';
import rateLimit from 'express-rate-limit';
import ContactMessage from '../models/ContactMessage.js';
import { sendTelegramMessage } from '../utils/telegram.js';
import { protect, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many contact submissions. Please try again later.' }
});

// Escape Markdown special chars for Telegram
function escapeMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// POST /api/contact - Public (no auth) - Submit contact form
router.post('/contact', contactFormLimiter, async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and message are required'
      });
    }

    const contactMsg = await ContactMessage.create({
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim()
    });

    // Send to Telegram
    const escapedName = escapeMarkdown(name.trim());
    const escapedPhone = escapeMarkdown(phone.trim());
    const escapedMessage = escapeMarkdown(message.trim());
    const telegramMsg = `📩 *New Contact Form*

*Name:* ${escapedName}
*Phone:* ${escapedPhone}

*Message:*
${escapedMessage}`;

    try {
      await sendTelegramMessage(telegramMsg);
    } catch (tgErr) {
      console.error('Telegram notification error:', tgErr);
      // Don't fail the request - message is saved
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// GET /api/contact - Admin only - List all contact messages
router.get('/contact', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// PATCH /api/contact/:id/read - Admin only - Mark as read
router.patch('/contact/:id/read', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    console.error('Error marking message read:', error);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

export default router;
