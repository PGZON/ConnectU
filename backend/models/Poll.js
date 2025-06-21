const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
});

const pollVoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  option: { type: mongoose.Schema.Types.ObjectId, required: true },
});

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [pollOptionSchema],
  deadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  votes: [pollVoteSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Poll', pollSchema); 