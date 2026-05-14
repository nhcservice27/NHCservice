import crypto from 'crypto';
import ChatMessage from '../models/ChatMessage.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import ChatbotSettings, { DEFAULT_ALLOWED_CUSTOMER_FIELDS } from '../models/ChatbotSettings.js';
import { retrieve, generateResponse, addChunk, queryNeedsLogin, personalizeStructuredResponse } from '../utils/ragAgent.js';

const CUSTOMER_FIELD_OPTIONS = [
  { key: 'lastPeriodDate', label: 'Last period date' },
  { key: 'averageCycleLength', label: 'Average cycle length' },
  { key: 'orderDetails', label: 'Order details' },
  { key: 'orderStatus', label: 'Order status' },
  { key: 'nextDeliveryDate', label: 'Next delivery date' },
  { key: 'planType', label: 'Plan type' },
  { key: 'subscriptionStatus', label: 'Subscription status' }
];

const ORDER_QUERY_PATTERN = /\b(ord|order|orders|ordres|delivery|shipping|status|track)\b/i;
const ORDER_LIST_QUERY_PATTERN = /\b(list|show|give|all|recent|latest)\b.*\b(ord|order|orders|ordres)\b|\b(ord|order|orders|ordres)\b.*\b(list|show|give|all|recent|latest)\b/i;
const GREETING_QUERY_PATTERN = /^(hi|hello|hey|hii|helo|hy|good morning|good afternoon|good evening)\b[!. ]*$/i;
const THANKS_QUERY_PATTERN = /^(thanks|thank you|thx|ok thanks|okay thanks)\b[!. ]*$/i;

class ChatbotController {
    formatStructuredResponse(summary, details = [], nextStep = 'Ask another question if you want more help.') {
        return [
            `Summary: ${summary}`,
            '',
            'Details:',
            ...(details.length > 0 ? details : ['I am here to help with seed cycling, laddus, and your customer data.']).map((detail) => `- ${detail}`),
            '',
            `Next step: ${nextStep}`
        ].join('\n');
    }

    formatDeliveryDate(value) {
        if (!value) return 'not set';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'not set' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatOrderId(orderId) {
        if (!orderId) return 'N/A';
        return String(orderId).startsWith('#') ? String(orderId) : `#${orderId}`;
    }

    formatOrderListResponse(customerName, orders) {
        const orderedList = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const recentOrders = orderedList.slice(0, 5);
        return this.formatStructuredResponse(
            `Here is the order list for ${customerName || 'your account'}.`,
            [
                `Total orders found: ${orderedList.length}.`,
                ...recentOrders.map((order, index) => (
                    `Order ${index + 1}: ${this.formatOrderId(order.orderId)}\nStatus: ${order.orderStatus || 'N/A'}\nPhase: ${order.phase || 'N/A'}\nDelivery Date: ${this.formatDeliveryDate(order.deliveryDate)}`
                ))
            ],
            'Ask me if you want the latest order status or details for a specific order.'
        );
    }

    getFallbackResponse(userQuery) {
        const lowerQuery = userQuery.toLowerCase();
        const simulatedResponses = {
            'seed cycling': { summary: 'Seed cycling supports hormone balance.', details: ['Days 1-14: Flax & Pumpkin', 'Days 15-28: Sesame & Sunflower'] },
            'phase 1': { summary: 'Phase I is for days 1-14.', details: ['Estrogen support', 'Flax/Pumpkin'] },
            'phase 2': { summary: 'Phase II is for days 15-28.', details: ['Progesterone support', 'Sesame/Sunflower'] }
        };

        for (const [key, value] of Object.entries(simulatedResponses)) {
            if (lowerQuery.includes(key)) return this.formatStructuredResponse(value.summary, value.details, 'Ask me more!');
        }
        return this.formatStructuredResponse('I can help with seed cycling questions.', ['Ask about Phase 1, Phase 2, or benefits.'], 'Ask away!');
    }

    async getChatbotSettings() {
        let settings = await ChatbotSettings.findOne();
        if (!settings) settings = await ChatbotSettings.create({ allowedCustomerFields: DEFAULT_ALLOWED_CUSTOMER_FIELDS });
        return settings;
    }

    buildOrderQuery(customer) {
        const clauses = [];
        if (customer.customerId) clauses.push({ customerId: customer.customerId });
        if (customer.phone) clauses.push({ phone: customer.phone });
        if (customer.email) clauses.push({ email: customer.email });
        return clauses.length > 0 ? { $or: clauses } : null;
    }

    buildCustomerContext(customer, orders, allowedFields) {
        if (!customer) return null;
        const context = { customerName: customer.name, orderCount: orders.length };
        ['lastPeriodDate', 'averageCycleLength', 'nextDeliveryDate', 'planType', 'subscriptionStatus'].forEach(field => {
            if (allowedFields.includes(field) && customer[field]) context[field] = customer[field];
        });
        if (allowedFields.includes('orderDetails')) context.orderDetails = orders.slice(0, 10);
        return context;
    }

    /**
     * @desc Main chat endpoint
     * @route POST /api/v1/chatbot/chat
     */
    async chat(req, res) {
        let sessionId = req.body?.sessionId || crypto.randomUUID();
        const userContent = req.body?.message?.trim();

        try {
            if (!userContent) return res.status(400).json({ success: false, message: 'Message is required' });

            const isLoggedIn = Boolean(req.customerAuth?.customerId);
            const settings = await this.getChatbotSettings();
            let customerContext = null;
            let customerOrders = [];
            let customerName = '';

            if (isLoggedIn) {
                const customer = await Customer.findById(req.customerAuth.customerId).lean();
                customerName = customer?.name || '';
                const orderQuery = customer ? this.buildOrderQuery(customer) : null;
                customerOrders = orderQuery ? await Order.find(orderQuery).sort({ createdAt: -1 }).lean() : [];
                customerContext = this.buildCustomerContext(customer, customerOrders, settings.allowedCustomerFields);
            }

            await ChatMessage.create({ sessionId, role: 'user', content: userContent, metadata: { customerId: req.customerAuth?.customerId || null, isLoggedIn } });

            let responseContent;
            if (isLoggedIn && ORDER_LIST_QUERY_PATTERN.test(userContent) && customerOrders.length > 0) {
                responseContent = this.formatOrderListResponse(customerName, customerOrders);
            } else if (!isLoggedIn && queryNeedsLogin(userContent)) {
                responseContent = this.formatStructuredResponse('Please log in first to see your details.', ['Account security is important.'], 'Log in now.');
            } else if (process.env.GEMINI_API_KEY) {
                const chunks = await retrieve(userContent, 3);
                responseContent = await generateResponse(userContent, chunks, customerContext, customerName, isLoggedIn);
            } else {
                responseContent = this.getFallbackResponse(userContent);
            }

            responseContent = personalizeStructuredResponse(responseContent, customerName, isLoggedIn);

            await ChatMessage.create({ sessionId, role: 'assistant', content: responseContent, metadata: { customerId: req.customerAuth?.customerId || null, isLoggedIn } });

            res.status(200).json({ success: true, response: responseContent, sessionId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to process chat' });
        }
    }

    /**
     * @desc Get settings
     */
    async getSettings(req, res) {
        try {
            const settings = await this.getChatbotSettings();
            res.status(200).json({ success: true, data: { ...settings.toObject(), availableCustomerFields: CUSTOMER_FIELD_OPTIONS } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch settings' });
        }
    }

    /**
     * @desc Update settings
     */
    async updateSettings(req, res) {
        try {
            const { allowedCustomerFields } = req.body;
            const settings = await this.getChatbotSettings();
            settings.allowedCustomerFields = allowedCustomerFields || DEFAULT_ALLOWED_CUSTOMER_FIELDS;
            await settings.save();
            res.status(200).json({ success: true, data: settings });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update settings' });
        }
    }

    /**
     * @desc Get all knowledge
     */
    async getKnowledge(req, res) {
        try {
            const chunks = await KnowledgeChunk.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: chunks });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch knowledge' });
        }
    }

    /**
     * @desc Add knowledge
     */
    async addKnowledge(req, res) {
        try {
            const { text, source, category } = req.body;
            const chunk = await addChunk(text, source, category);
            res.status(201).json({ success: true, data: chunk });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add knowledge' });
        }
    }

    /**
     * @desc Get all chats
     */
    async getAllChats(req, res) {
        try {
            const sessions = await ChatMessage.aggregate([
                { $group: { _id: '$sessionId', messages: { $push: '$$ROOT' }, lastActivity: { $max: '$createdAt' } } },
                { $sort: { lastActivity: -1 } },
                { $limit: 50 }
            ]);
            res.status(200).json({ success: true, data: sessions });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch chats' });
        }
    }
}

export default new ChatbotController();
