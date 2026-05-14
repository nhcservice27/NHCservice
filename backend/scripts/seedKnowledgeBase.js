/**
 * Seed the RAG knowledge base with default FAQs for Cycle Harmony Laddus.
 * Run: node server/scripts/seedKnowledgeBase.js
 * Requires: MONGODB_URI and GEMINI_API_KEY in .env
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { addChunk } from '../utils/ragAgent.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';

const DEFAULT_CHUNKS = [
  {
    text: 'Seed cycling is a natural approach to hormonal balance using specific seeds during different phases of your menstrual cycle. During days 1-14 (follicular phase), flax and pumpkin seeds support estrogen production. During days 15-28 (luteal phase), sesame and sunflower seeds support progesterone.',
    source: 'seed',
    category: 'faq'
  },
  {
    text: 'Phase I Laddu is for days 1-14 of your cycle. It contains flaxseeds and pumpkin seeds that support healthy estrogen production, promote regular ovulation, and are rich in omega-3 fatty acids and natural lignans.',
    source: 'seed',
    category: 'product'
  },
  {
    text: 'Phase II Laddu is for days 15-28 of your cycle. It contains sesame and sunflower seeds that support healthy progesterone levels, reduce PMS symptoms, and are rich in vitamin E and magnesium.',
    source: 'seed',
    category: 'product'
  },
  {
    text: 'Our laddus help balance hormones naturally, reduce PMS symptoms, support regular cycles, improve fertility, boost energy levels, and promote glowing skin - all through the power of seed cycling!',
    source: 'seed',
    category: 'faq'
  },
  {
    text: 'Phase I contains flaxseeds and pumpkin seeds. Phase II contains sesame seeds and sunflower seeds. All our ingredients are organic, nutrient-dense, and carefully selected for maximum hormonal benefits.',
    source: 'seed',
    category: 'product'
  },
  {
    text: "Take one Phase I Laddu daily during days 1-14 of your cycle (from the first day of your period). Then switch to Phase II Laddu for days 15-28. It's that simple!",
    source: 'seed',
    category: 'faq'
  },
  {
    text: 'Phase I Laddus (Follicular Phase - Days 1-14): Ingredients: Flax seeds, Pumpkin seeds, Sesame seeds, Jaggery, Ghee. Benefits: Estrogen balance, Egg quality, Energy boost. Price: ₹399.',
    source: 'seed',
    category: 'product'
  },
  {
    text: 'Phase II Laddus (Luteal Phase - Days 15-28): Ingredients: Sunflower seeds, Sesame seeds, Jaggery, Ghee. Benefits: Progesterone support, PMS relief, Mood balance. Price: ₹399.',
    source: 'seed',
    category: 'product'
  },
  {
    text: 'Shipping: Delivery area Hyderabad only. Processing time 1-2 business days. Delivery time 2-5 business days. Free shipping on orders above ₹999.',
    source: 'seed',
    category: 'shipping'
  },
  {
    text: 'Contact: Email support@nhcservice.in, Phone +91 98765 43210, Location Hyderabad, India.',
    source: 'seed',
    category: 'contact'
  }
];

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is required for embeddings');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await KnowledgeChunk.countDocuments();
  if (existing > 0) {
    console.log(`Found ${existing} existing chunks. Skipping seed to avoid duplicates.`);
    console.log('To re-seed, delete all chunks first from Admin > Chat bot > Knowledge.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Adding default knowledge chunks...');
  for (const chunk of DEFAULT_CHUNKS) {
    await addChunk(chunk.text, chunk.source, chunk.category);
    console.log(`  Added: ${chunk.text.slice(0, 50)}...`);
  }

  console.log(`Done! Added ${DEFAULT_CHUNKS.length} chunks.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
