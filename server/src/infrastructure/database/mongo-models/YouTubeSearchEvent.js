import mongoose from 'mongoose';

const youtubeSearchEventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    index: true
  },
  userId: {
    type: String, // String UUID to match Postgres id
    index: true
  },
  query: {
    type: String,
    required: true,
    index: true
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  clickedVideoId: {
    type: String, // String UUID
    index: true
  },
  clickedPosition: {
    type: Number
  },
  timeToClickMs: {
    type: Number
  },
  lang: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // We use createdAt manually
  collection: 'youtube_search_events'
});

// Compound index for analytics
youtubeSearchEventSchema.index({ query: 1, createdAt: -1 });

const YouTubeSearchEvent = mongoose.model('YouTubeSearchEvent', youtubeSearchEventSchema);

export default YouTubeSearchEvent;
