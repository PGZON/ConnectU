const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  message: { type: String, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('Announcement', announcementSchema); 