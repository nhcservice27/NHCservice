import { GoogleGenAI } from '@google/genai';
import KnowledgeChunk from '../models/KnowledgeChunk.js';

// text-embedding-004 is Vertex AI only; Gemini API (Google AI Studio) uses gemini-embedding-001
const EMBEDDING_MODEL = 'gemini-embedding-001';
const GENERATION_MODEL = 'gemini-2.0-flash';
const PERSONAL_QUERY_PATTERN = /\b(my|me|mine|order|orders|delivery|period|cycle|subscription|plan)\b/i;

let ai = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Embed text using Gemini embeddings API
 */
export async function embedText(text) {
  const client = getAI();
  const response = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text]
  });
  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding response');
  }
  return embedding;
}

/**
 * Retrieve top K knowledge chunks by cosine similarity
 */
export async function retrieve(query, topK = 5) {
  const queryEmbedding = await embedText(query);
  const chunks = await KnowledgeChunk.find({}).lean();
  if (chunks.length === 0) return [];

  const scored = chunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(({ text, source, category }) => ({ text, source, category }));
}

/**
 * Generate response using retrieved context and Gemini
 */
function formatCustomerContext(customerContext) {
  if (!customerContext) {
    return 'No customer-specific data is available for this request.';
  }

  return JSON.stringify(customerContext, null, 2);
}

function ensureStructuredResponse(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    return [
      'Summary: I could not prepare a response.',
      '',
      'Details:',
      '- Please try asking again.',
      '',
      'Next step: Ask another question or contact support if the issue continues.'
    ].join('\n');
  }

  if (cleanText.includes('Summary:') && cleanText.includes('Details:')) {
    return cleanText;
  }

  const normalized = cleanText.replace(/\s+/g, ' ').trim();
  const sentenceParts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const summary = sentenceParts[0] || normalized;
  const detailParts = sentenceParts.slice(1, 4);
  const details = detailParts.length > 0 ? detailParts : [normalized];

  return [
    `Summary: ${summary}`,
    '',
    'Details:',
    ...details.map((detail) => `- ${detail}`),
    '',
    'Next step: Ask another question if you want more details.'
  ].join('\n');
}

export function queryNeedsLogin(query) {
  return PERSONAL_QUERY_PATTERN.test(query);
}

export async function generateResponse(query, chunks, customerContext = null, isLoggedIn = false) {
  const client = getAI();
  const contextText = chunks.length > 0
    ? chunks.map((c) => c.text).join('\n\n')
    : 'No specific knowledge available.';
  const requiresLogin = queryNeedsLogin(query);
  const accessGuidance = !isLoggedIn && requiresLogin
    ? 'The user appears to be asking about personal information. Tell them clearly: "Can you log in first? Then I can understand your order and customer details more easily."'
    : isLoggedIn && !customerContext && requiresLogin
      ? 'The user is logged in, but no customer data was supplied for this request. Explain that their personal data is not currently available in chat and offer general help instead.'
      : 'If the user asks for personal order or cycle data and you do not have customer-specific context, explain what is missing before answering.';
  const customerContextText = formatCustomerContext(customerContext);

  const systemPrompt = `You are a helpful AI assistant for Cycle Harmony Laddus, a brand that sells seed cycling laddus for hormonal balance.

Use ONLY the following context to answer the user's question. If the answer is not in the context, politely say you don't have that information and suggest they contact support at support@nhcservice.in.

Context:
${contextText}

Customer data (use only for this specific user and only if present):
${customerContextText}

Rules:
- Never invent customer details, order history, period dates, or cycle information.
- Only use customer data that is provided in the customer data block.
- If the user is asking for personal information and the customer data block is empty, follow the access guidance below.
- Keep responses concise, friendly, and focused on seed cycling, the products, and the user's available data.
- Always use this exact response format:
  Summary: one short sentence

  Details:
  - bullet point 1
  - bullet point 2

  Next step: one short helpful action
- Use plain text only. Do not use markdown headings, bold text, or numbered lists.

Access guidance:
${accessGuidance}`;

  const response = await client.models.generateContent({
    model: GENERATION_MODEL,
    contents: query,
    config: {
      systemInstruction: systemPrompt
    }
  });

  const text = response?.text;
  return ensureStructuredResponse(
    (typeof text === 'string' ? text : text?.trim?.()) || "I'm sorry, I couldn't generate a response. Please try again or contact support."
  );
}

/**
 * Add a text chunk to the knowledge base (embeds and saves)
 */
export async function addChunk(text, source = 'manual', category = 'general') {
  const embedding = await embedText(text);
  const chunk = await KnowledgeChunk.create({
    text: text.trim(),
    embedding,
    source,
    category
  });
  return chunk;
}
