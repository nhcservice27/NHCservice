import fetch from 'node-fetch';
import https from 'node:https';
import { processAiQuery } from './aiAgent.js';

// Use a keep-alive agent to help with ECONNRESET
const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    timeout: 60000,
});

let lastUpdateId = 0;

// ==================== CONVERSATION MEMORY ====================
// Stores recent messages per chat for context
const conversationHistory = new Map();
const MAX_HISTORY = 20; // Keep last 20 messages per chat

function addToHistory(chatId, role, content) {
    if (!conversationHistory.has(chatId)) {
        conversationHistory.set(chatId, []);
    }
    const history = conversationHistory.get(chatId);
    history.push({
        role,
        content,
        timestamp: new Date().toISOString()
    });
    // Keep only last MAX_HISTORY messages
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

function getHistory(chatId) {
    return conversationHistory.get(chatId) || [];
}

function clearHistory(chatId) {
    conversationHistory.delete(chatId);
}

/**
 * Starts long polling for Telegram updates
 */
export async function startTelegramListener() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn('⚠️ [TELEGRAM] TELEGRAM_BOT_TOKEN missing. AI Agent listener disabled.');
        return;
    }

    console.log('🤖 [TELEGRAM] AI Agent Listener Starting...');
    console.log(`🤖 [TELEGRAM] Token: ${token.substring(0, 10)}... (length: ${token.length})`);

    // Register bot commands so they show up in the menu
    await registerBotCommands(token);

    pollTelegram(token);
}

async function registerBotCommands(token, retryCount = 0) {
    try {
        const url = `https://api.telegram.org/bot${token}/setMyCommands`;
        const response = await fetch(url, {
            method: 'POST',
            agent: httpsAgent,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                commands: [
                    { command: 'orders', description: 'List recent orders (confirm orders, assign delivery boys)' },
                    { command: 'customer', description: 'Search customers' },
                    { command: 'report', description: 'Business daily report' },
                    { command: 'inventory', description: 'Check Phase-1 and Phase-2 raw material stock' },
                    { command: 'clear', description: 'Clear conversation' },
                    { command: 'start', description: 'Restart AI bot' }
                ]
            })
        });
        const data = await response.json();
        if (data.ok) {
            console.log('✅ [TELEGRAM] Bot commands registered successfully');
        } else {
            console.error('❌ [TELEGRAM] Failed to register commands:', data.description);
        }
    } catch (error) {
        console.error(`❌ [TELEGRAM] Error registering commands (Attempt ${retryCount + 1}):`, error.message);
        if (retryCount < 3) {
            console.log(`🔄 [TELEGRAM] Retrying command registration in 10s...`);
            setTimeout(() => registerBotCommands(token, retryCount + 1), 10000);
        } else {
            console.warn('⚠️ [TELEGRAM] Could not register menu commands after 3 attempts. Bot will still function.');
        }
    }
}

async function pollTelegram(token) {
    console.log('🤖 [TELEGRAM] Polling loop entered');
    let backoffTime = 5000;

    while (true) {
        try {
            const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
            const response = await fetch(url, { agent: httpsAgent });
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.ok) {
                // Reset backoff on success
                backoffTime = 5000;
                
                if (data.result.length > 0) {
                    for (const update of data.result) {
                        lastUpdateId = update.update_id;
                        if (update.message && update.message.text) {
                            handleIncomingMessage(token, update.message);
                        }
                    }
                }
            } else {
                throw new Error(data.description || 'Unknown Telegram Error');
            }
        } catch (error) {
            const isNetworkError = error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
            
            if (isNetworkError) {
                console.error(`⚠️ [TELEGRAM] Network error (${error.code}). Retrying in ${backoffTime/1000}s...`);
                // Incremental backoff up to 30 seconds
                backoffTime = Math.min(backoffTime + 5000, 30000);
            } else {
                console.error('❌ [TELEGRAM] Polling Error:', error.message);
            }
            
            await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
    }
}

async function handleIncomingMessage(token, message) {
    const chatId = message.chat.id;
    const userId = message.from.id;
    const userText = message.text;

    // ✅ SECURITY: Validate that the message is from the authorized admin chat
    const authorizedChatId = process.env.TELEGRAM_CHAT_ID;
    if (authorizedChatId && chatId.toString() !== authorizedChatId.toString()) {
        console.warn(`⚠️ [TELEGRAM] Unauthorized access attempt from chat ID: ${chatId} (user: ${userId})`);
        await sendReply(token, chatId, "⛔ Access Denied. You are not authorized to use this bot.");
        return;
    }

    // Handle simple commands directly, pass others to AI
    if (userText.startsWith('/')) {
        const command = userText.split(' ')[0].toLowerCase();

        if (command === '/start') {
            clearHistory(chatId);
            await sendReply(token, chatId, "Hello! I am your Cycle Harmony AI Assistant. 🤖\n\nI remember our conversation, so you can ask follow-up questions!\n\nAsk me anything about customers, orders, or inventory.\nI can also perform actions like changing order status, assigning delivery boys, and more!\n\nType /clear to reset our conversation memory.");
            return;
        } else if (command === '/clear') {
            clearHistory(chatId);
            await sendReply(token, chatId, "🧹 Conversation memory cleared! Starting fresh.");
            return;
        }

        // For other commands like /orders, /report, etc., we let the AI handle them
        // We'll strip the '/' so the AI sees it as a natural request or we can keep it
        console.log(`🤖 AI handling command: ${command}`);
    }

    console.log(`📩 Message from ${userId}: ${userText}`);

    // Save user message to history
    addToHistory(chatId, 'user', userText);

    // Show "typing" status (non-blocking)
    fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'typing' })
    }).catch(err => console.error('Typing indicator error:', err.message));

    // Get conversation history for context
    const history = getHistory(chatId);

    // Process with AI (pass history for memory)
    const aiResponse = await processAiQuery(userText, history);

    // Save AI response to history
    addToHistory(chatId, 'assistant', aiResponse);

    // Send reply
    await sendReply(token, chatId, aiResponse);
}

async function sendReply(token, chatId, text) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('❌ Telegram send error:', data.description);
            // Retry without Markdown if parsing fails
            if (data.description?.includes('parse')) {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: text })
                });
            }
        }
    } catch (error) {
        console.error('❌ Failed to send Telegram reply:', error.message);
    }
}
