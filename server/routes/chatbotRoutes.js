import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import ChatMessage from '../models/ChatMessage.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import ChatbotSettings, { DEFAULT_ALLOWED_CUSTOMER_FIELDS } from '../models/ChatbotSettings.js';
import { protect, authorizeRole, attachOptionalCustomer } from '../middleware/auth.js';
import { retrieve, generateResponse, addChunk, queryNeedsLogin, personalizeStructuredResponse } from '../utils/ragAgent.js';

const router = express.Router();
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

function formatStructuredResponse(summary, details = [], nextStep = 'Ask another question if you want more help.') {
  return [
    `Summary: ${summary}`,
    '',
    'Details:',
    ...(details.length > 0 ? details : ['I am here to help with seed cycling, laddus, and your customer data.']).map((detail) => `- ${detail}`),
    '',
    `Next step: ${nextStep}`
  ].join('\n');
}

function formatDate(value) {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDeliveryDate(value) {
  if (!value) return 'not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'not set';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatOrderId(orderId) {
  if (!orderId) return 'N/A';
  return String(orderId).startsWith('#') ? String(orderId) : `#${orderId}`;
}

function formatOrderListResponse(customerName, orders) {
  const orderedList = [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const recentOrders = orderedList.slice(0, 5);

  return formatStructuredResponse(
    `Here is the order list for ${customerName || 'your account'}.`,
    [
      `Total orders found: ${orderedList.length}.`,
      ...recentOrders.map((order, index) => (
        `Order ${index + 1}: ${formatOrderId(order.orderId)}\nStatus: ${order.orderStatus || 'N/A'}\nPhase: ${order.phase || 'N/A'}\nDelivery Date: ${formatDeliveryDate(order.deliveryDate)}`
      ))
    ],
    'Ask me if you want the latest order status or details for a specific order.'
  );
}

// Fallback responses when RAG is unavailable
const simulatedResponses = {
  'seed cycling': {
    summary: 'Seed cycling is a natural method used to support hormone balance through different seeds in each phase of the menstrual cycle.',
    details: [
      'Days 1-14 usually focus on flax and pumpkin seeds for the follicular phase.',
      'Days 15-28 usually focus on sesame and sunflower seeds for the luteal phase.'
    ],
    nextStep: 'Ask me about Phase 1, Phase 2, benefits, or how to take the laddus.'
  },
  'phase 1': {
    summary: 'Phase I Laddu is designed for days 1-14 of the cycle.',
    details: [
      'It contains flaxseeds and pumpkin seeds.',
      'It supports healthy estrogen balance and regular ovulation.'
    ],
    nextStep: 'Ask me about Phase 2 or how to take the laddus.'
  },
  'phase 2': {
    summary: 'Phase II Laddu is designed for days 15-28 of the cycle.',
    details: [
      'It contains sesame and sunflower seeds.',
      'It supports healthy progesterone levels and may help reduce PMS symptoms.'
    ],
    nextStep: 'Ask me about benefits or how to switch between phases.'
  },
  'benefits': {
    summary: 'Cycle Harmony laddus are designed to support hormone balance naturally.',
    details: [
      'They may help with PMS symptoms, regular cycles, fertility support, and energy.',
      'They are based on the seed cycling approach for different cycle phases.'
    ],
    nextStep: 'Ask me about ingredients, Phase 1, or Phase 2.'
  },
  'ingredients': {
    summary: 'The laddus use different seeds depending on the phase of the cycle.',
    details: [
      'Phase I includes flaxseeds and pumpkin seeds.',
      'Phase II includes sesame seeds and sunflower seeds.'
    ],
    nextStep: 'Ask me about benefits or how to take the laddus.'
  },
  'how to take': {
    summary: 'Take one laddu daily according to your cycle phase.',
    details: [
      'Use Phase I for days 1-14, starting from the first day of your period.',
      'Then switch to Phase II for days 15-28.'
    ],
    nextStep: 'Ask me if you want help understanding which phase you are in.'
  }
};

function getFallbackResponse(userQuery) {
  const lowerQuery = userQuery.toLowerCase();
  for (const [key, value] of Object.entries(simulatedResponses)) {
    if (lowerQuery.includes(key)) {
      return formatStructuredResponse(value.summary, value.details, value.nextStep);
    }
  }
  return formatStructuredResponse(
    'I can help with seed cycling and Cycle Harmony laddus.',
    [
      'You can ask about seed cycling, Phase 1, Phase 2, benefits, ingredients, or how to take the laddus.',
      'If you are logged in, you can also ask about your order or cycle-related details.'
    ],
    'Ask one of the suggested questions to get started.'
  );
}

function getQuickResponse(userQuery, isLoggedIn = false) {
  const normalizedQuery = String(userQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  if (GREETING_QUERY_PATTERN.test(normalizedQuery)) {
    return formatStructuredResponse(
      'How can I help you today?',
      isLoggedIn
        ? [
          'I can help with seed cycling, laddus, your orders, and your cycle-related details.',
          'You can ask about your latest order, delivery status, or general product questions.'
        ]
        : [
          'I can help with seed cycling, laddus, shipping, and product questions.',
          'Log in if you want personal help with your orders and cycle information.'
        ],
      'Ask your question and I will help right away.'
    );
  }

  if (THANKS_QUERY_PATTERN.test(normalizedQuery)) {
    return formatStructuredResponse(
      'You are welcome.',
      [
        'I am here whenever you need help.',
        'You can ask another question about seed cycling, laddus, or your account.'
      ],
      'Send your next question whenever you are ready.'
    );
  }

  for (const key of Object.keys(simulatedResponses)) {
    if (normalizedQuery.includes(key)) {
      return getFallbackResponse(userQuery);
    }
  }

  return null;
}

async function getChatbotSettings() {
  let settings = await ChatbotSettings.findOne();

  if (!settings) {
    settings = await ChatbotSettings.create({
      allowedCustomerFields: DEFAULT_ALLOWED_CUSTOMER_FIELDS
    });
  }

  return settings;
}

function buildOrderQuery(customer) {
  const clauses = [];

  if (customer.customerId) clauses.push({ customerId: customer.customerId });
  if (customer.phone) clauses.push({ phone: customer.phone });
  if (customer.email) clauses.push({ email: customer.email });

  return clauses.length > 0 ? { $or: clauses } : null;
}

function mapOrderDetails(order) {
  return {
    orderId: order.orderId,
    phase: order.phase,
    totalQuantity: order.totalQuantity,
    totalWeight: order.totalWeight,
    totalPrice: order.totalPrice,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    deliveryDate: order.deliveryDate
  };
}

function mapOrderStatus(order) {
  return {
    orderId: order.orderId,
    orderStatus: order.orderStatus,
    phase: order.phase,
    createdAt: order.createdAt,
    deliveryDate: order.deliveryDate
  };
}

function buildCustomerContext(customer, orders, allowedFields) {
  if (!customer) {
    return null;
  }

  const context = {
    customerName: customer.name,
    orderCount: orders.length
  };

  if (allowedFields.includes('lastPeriodDate') && customer.lastPeriodDate) {
    context.lastPeriodDate = customer.lastPeriodDate;
  }

  if (allowedFields.includes('averageCycleLength') && customer.averageCycleLength) {
    context.averageCycleLength = customer.averageCycleLength;
  }

  if (allowedFields.includes('nextDeliveryDate') && customer.nextDeliveryDate) {
    context.nextDeliveryDate = customer.nextDeliveryDate;
  }

  if (allowedFields.includes('planType') && customer.planType) {
    context.planType = customer.planType;
  }

  if (allowedFields.includes('subscriptionStatus') && customer.subscriptionStatus) {
    context.subscriptionStatus = customer.subscriptionStatus;
  }

  if (allowedFields.includes('orderDetails')) {
    context.orderDetails = orders.slice(0, 10).map(mapOrderDetails);
  }

  if (allowedFields.includes('orderStatus')) {
    context.orderStatus = orders.slice(0, 10).map(mapOrderStatus);
  }

  return Object.keys(context).length > 1 ? context : null;
}

function queryIsAboutOrders(query) {
  return ORDER_QUERY_PATTERN.test(query);
}

function queryIsForOrderList(query) {
  return ORDER_LIST_QUERY_PATTERN.test(query);
}

// Rate limit for public chat (20 req/15 min per IP)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many chat requests. Please try again later.' }
});

// POST /api/chatbot/chat - Public - Chat endpoint for homepage widget (saves to DB)
router.post('/chatbot/chat', chatLimiter, attachOptionalCustomer, async (req, res) => {
  let sessionId = null;
  const userContent = req.body?.message?.trim();

  try {
    const { message, sessionId: clientSessionId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    sessionId = clientSessionId?.trim() || crypto.randomUUID();

    const isLoggedIn = Boolean(req.customerAuth?.customerId);
    const settings = await getChatbotSettings();
    let customerContext = null;
    let customerOrders = [];
    let customerName = '';

    if (isLoggedIn) {
      const customer = await Customer.findById(req.customerAuth.customerId).lean();
      customerName = customer?.name || '';
      const orderQuery = customer ? buildOrderQuery(customer) : null;
      customerOrders = orderQuery
        ? await Order.find(orderQuery).sort({ createdAt: -1 }).lean()
        : [];

      customerContext = buildCustomerContext(
        customer,
        customerOrders,
        settings.allowedCustomerFields || DEFAULT_ALLOWED_CUSTOMER_FIELDS
      );
    }

    // Save user message to database (customer chat data persistence)
    await ChatMessage.create({
      sessionId,
      role: 'user',
      content: userContent,
      source: 'homepage',
      metadata: {
        customerId: req.customerAuth?.customerId || null,
        isLoggedIn
      }
    });

    // Generate response: use RAG if available, else fallback to keyword matching
    let responseContent;
    try {
      if (isLoggedIn && queryIsForOrderList(userContent) && customerOrders.length > 0) {
        responseContent = formatOrderListResponse(customerName, customerOrders);
      } else if (isLoggedIn && queryIsAboutOrders(userContent) && customerContext?.orderCount === 0) {
        responseContent = formatStructuredResponse(
          'You are logged in, but I could not find any saved orders on your account yet.',
          [
            'Your login is working correctly.',
            'I can only show order details after an order is placed and linked to your profile.'
          ],
          'Place an order first, then ask me about its status or details.'
        );
      } else if (!isLoggedIn && queryNeedsLogin(userContent)) {
        responseContent = formatStructuredResponse(
          'Can you log in first?',
          [
            'Then I can understand your order and customer details more easily.',
            'After login, I can help with your orders, cycle information, and account-related answers.'
          ],
          'Log in to your profile, then send your question again.'
        );
      } else {
        const quickResponse = getQuickResponse(userContent, isLoggedIn);

        if (quickResponse) {
          responseContent = quickResponse;
        } else if (process.env.GEMINI_API_KEY) {
          const chunkCount = await KnowledgeChunk.countDocuments();
          const chunks = chunkCount > 0 ? await retrieve(userContent, 3) : [];
          responseContent = await generateResponse(userContent, chunks, customerContext, customerName, isLoggedIn);
        } else {
          responseContent = getFallbackResponse(userContent);
        }
      }
    } catch (ragError) {
      console.warn('RAG fallback:', ragError?.message);
      responseContent = !isLoggedIn && queryNeedsLogin(userContent)
        ? formatStructuredResponse(
          'Can you log in first?',
          [
            'Then I can understand your order and customer details more easily.',
            'After login, I can help with your orders, cycle information, and account-related answers.'
          ],
          'Log in to your profile, then send your question again.'
        )
        : getFallbackResponse(userContent);
    }

    responseContent = personalizeStructuredResponse(responseContent, customerName, isLoggedIn);

    // Save assistant response to database (customer chat data persistence)
    await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: responseContent,
      source: 'homepage',
      metadata: {
        customerId: req.customerAuth?.customerId || null,
        isLoggedIn
      }
    });

    res.status(200).json({
      success: true,
      response: responseContent,
      sessionId
    });
  } catch (error) {
    console.error('Chatbot chat error:', error);
    // Save assistant error response so full conversation is in DB
    if (sessionId && userContent) {
      try {
        await ChatMessage.create({
          sessionId,
          role: 'assistant',
          content: formatStructuredResponse(
            'Something went wrong while processing your message.',
            [
              'Your message was received, but I could not complete the reply.',
              'This may be a temporary issue.'
            ],
            'Please try again in a moment.'
          ),
          source: 'homepage',
          metadata: { error: true }
        });
      } catch (saveErr) {
        console.error('Failed to save error response:', saveErr);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message'
    });
  }
});

router.get('/chatbot/settings', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const settings = await getChatbotSettings();

    res.status(200).json({
      success: true,
      data: {
        enabled: settings.enabled,
        welcomeMessage: settings.welcomeMessage,
        allowedCustomerFields: settings.allowedCustomerFields,
        availableCustomerFields: CUSTOMER_FIELD_OPTIONS
      }
    });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chatbot settings' });
  }
});

router.patch('/chatbot/settings', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { allowedCustomerFields } = req.body;
    const validKeys = new Set(CUSTOMER_FIELD_OPTIONS.map((field) => field.key));
    const filteredFields = Array.isArray(allowedCustomerFields)
      ? [...new Set(allowedCustomerFields.filter((field) => validKeys.has(field)))]
      : DEFAULT_ALLOWED_CUSTOMER_FIELDS;

    const settings = await getChatbotSettings();
    settings.allowedCustomerFields = filteredFields;
    await settings.save();

    res.status(200).json({
      success: true,
      data: {
        enabled: settings.enabled,
        welcomeMessage: settings.welcomeMessage,
        allowedCustomerFields: settings.allowedCustomerFields,
        availableCustomerFields: CUSTOMER_FIELD_OPTIONS
      }
    });
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update chatbot settings' });
  }
});

// GET /api/chatbot/knowledge - Admin only - List knowledge chunks
router.get('/chatbot/knowledge', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const chunks = await KnowledgeChunk.find({})
      .select('text source category createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      data: chunks.map((c) => ({
        id: c._id,
        text: c.text,
        source: c.source,
        category: c.category,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch knowledge' });
  }
});

// POST /api/chatbot/knowledge - Admin only - Add text chunk (auto-embedded)
router.post('/chatbot/knowledge', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const { text, source = 'manual', category = 'general' } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }
    const chunk = await addChunk(text.trim(), String(source), String(category));
    res.status(201).json({
      success: true,
      data: {
        id: chunk._id,
        text: chunk.text,
        source: chunk.source,
        category: chunk.category,
        createdAt: chunk.createdAt
      }
    });
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to add knowledge' });
  }
});

// DELETE /api/chatbot/knowledge/:id - Admin only - Remove chunk
router.delete('/chatbot/knowledge/:id', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const deleted = await KnowledgeChunk.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Chunk not found' });
    }
    res.status(200).json({ success: true, message: 'Chunk deleted' });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ success: false, message: 'Failed to delete knowledge' });
  }
});

// GET /api/chatbot/chats - Admin only - List all chat sessions with messages
router.get('/chatbot/chats', protect, authorizeRole('admin'), async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$sessionId',
          messages: { $push: { role: '$role', content: '$content', createdAt: '$createdAt' } },
          lastActivity: { $max: '$createdAt' },
          messageCount: { $sum: 1 },
          customerId: { $max: '$metadata.customerId' }
        }
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 50 }
    ]);

    const customerIds = [...new Set(
      sessions
        .map((session) => session.customerId)
        .filter(Boolean)
    )];

    const customers = customerIds.length > 0
      ? await Customer.find({ _id: { $in: customerIds } })
        .select('name customerId')
        .lean()
      : [];

    const customerMap = new Map(
      customers.map((customer) => [String(customer._id), customer])
    );

    res.status(200).json({
      success: true,
      data: sessions.map(s => ({
        sessionId: s._id,
        messageCount: s.messageCount,
        lastActivity: s.lastActivity,
        customerName: s.customerId ? customerMap.get(String(s.customerId))?.name || null : null,
        customerCode: s.customerId ? customerMap.get(String(s.customerId))?.customerId || null : null,
        messages: s.messages
      }))
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
});

export default router;
