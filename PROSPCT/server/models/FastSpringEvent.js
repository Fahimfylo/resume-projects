const mongoose = require('mongoose');

const fastSpringEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FastSpringEvent', fastSpringEventSchema);
