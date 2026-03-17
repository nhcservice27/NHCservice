import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    default: 'homepage',
    enum: ['homepage', 'admin']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries by session and time
chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
