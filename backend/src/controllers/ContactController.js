import ContactMessage from '../models/ContactMessage.js';
import { sendTelegramMessage } from '../utils/telegram.js';

class ContactController {
    /**
     * @desc Submit contact form
     * @route POST /api/v1/contact
     */
    async submit(req, res) {
        try {
            const { name, phone, message } = req.body;

            if (!name?.trim() || !phone?.trim() || !message?.trim()) {
                return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
            }

            const contactMsg = await ContactMessage.create({
                name: name.trim(),
                phone: phone.trim(),
                message: message.trim()
            });

            // Send to Telegram (simplified escaped logic)
            const telegramMsg = `📩 *New Contact Form*\n*Name:* ${name}\n*Phone:* ${phone}\n\n*Message:*\n${message}`;
            try {
                await sendTelegramMessage(telegramMsg);
            } catch (tgErr) {
                console.error('Telegram notification error:', tgErr);
            }

            res.status(201).json({ success: true, message: 'Message sent successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to send message' });
        }
    }

    /**
     * @desc Get all contact messages
     * @route GET /api/v1/contact
     */
    async getAll(req, res) {
        try {
            const messages = await ContactMessage.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch messages' });
        }
    }

    /**
     * @desc Mark as read
     * @route PATCH /api/v1/contact/:id/read
     */
    async markAsRead(req, res) {
        try {
            const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
            if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
            res.status(200).json({ success: true, data: msg });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update' });
        }
    }
}

export default new ContactController();
