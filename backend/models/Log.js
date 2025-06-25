const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'user_delete', 'user_deactivate', etc.
  actor: { type: String, required: true }, // admin email or id
  target: { type: String }, // target user email or id
  message: { type: String },
  meta: { type: Object },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema); 