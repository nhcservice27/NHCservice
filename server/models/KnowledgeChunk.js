import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  source: {
    type: String,
    default: 'manual',
    trim: true
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient similarity search (embedding field used in application-level cosine similarity)
knowledgeChunkSchema.index({ category: 1 });

export default mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
