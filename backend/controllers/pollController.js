const Poll = require('../models/Poll');
const { successResponse, badRequestResponse, forbiddenResponse, notFoundResponse } = require('../utils/responseHandler');

// Admin only: Create a new poll
exports.createPoll = async (req, res) => {
  try {
    const { question, options, deadline } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return badRequestResponse(res, 'Poll must have a question and at least 2 options');
    }
    if (!deadline || isNaN(Date.parse(deadline))) {
      return badRequestResponse(res, 'Invalid deadline');
    }
    const poll = await Poll.create({
      question,
      options: options.map(text => ({ text })),
      deadline,
      createdBy: req.user._id,
    });
    return successResponse(res, poll, 'Poll created');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
};

// Get the latest active poll (not expired)
exports.getActivePoll = async (req, res) => {
  try {
    const now = new Date();
    const poll = await Poll.findOne({ deadline: { $gt: now } }).sort({ createdAt: -1 });
    if (!poll) return notFoundResponse(res, 'No active poll');
    return successResponse(res, poll, 'Active poll');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
};

// Student: Vote for a poll option (one vote per user)
exports.votePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFoundResponse(res, 'Poll not found');
    if (new Date(poll.deadline) < new Date()) return forbiddenResponse(res, 'Poll has ended');
    const alreadyVoted = poll.votes.find(v => v.user.toString() === req.user._id.toString());
    if (alreadyVoted) return forbiddenResponse(res, 'You have already voted');
    const { optionId } = req.body;
    const option = poll.options.id(optionId);
    if (!option) return badRequestResponse(res, 'Invalid option');
    option.votes += 1;
    poll.votes.push({ user: req.user._id, option: optionId });
    await poll.save();
    return successResponse(res, poll, 'Vote submitted');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
};

// Get poll results (all users)
exports.getPollResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return notFoundResponse(res, 'Poll not found');
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const results = poll.options.map(opt => ({
      id: opt._id,
      text: opt.text,
      votes: opt.votes,
      percent: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
    }));
    return successResponse(res, { question: poll.question, results, totalVotes, deadline: poll.deadline }, 'Poll results');
  } catch (error) {
    return badRequestResponse(res, error.message);
  }
}; 