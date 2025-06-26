const Query = require('../models/Query');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');
const Log = require('../models/Log');

// @desc    Create a new query
// @route   POST /api/queries
// @access  Private/Student
const createQuery = async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admins cannot create queries.' });
  }
  try {
    const queryData = {
      student: req.user._id,
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      priority: req.body.priority || 'medium',
      isPublic: req.body.isPublic !== false,
      tags: req.body.tags || []
    };

    const query = await Query.create(queryData);
    await query.populate('student', 'name email role profileImageUrl');
    // Log query creation
    await Log.create({
      type: 'query_create',
      actor: req.user.email,
      target: query._id.toString(),
      message: `User ${req.user.email} created a query`,
      meta: { queryId: query._id, title: query.title }
    });
    return successResponse(res, query, 'Query created successfully');
  } catch (error) {
    console.error('Create query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get all queries with pagination
// @route   GET /api/queries
// @access  Public
const getQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { isPublic: true };
    
    if (req.query.category) {
      query.category = req.query.category;
    }

    const queries = await Query.find(query)
      .populate('student', 'name email role profileImageUrl')
      .populate('assignedAlumni', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Query.countDocuments(query);

    return successResponse(res, {
      queries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Queries retrieved successfully');
  } catch (error) {
    console.error('Get queries error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get single query
// @route   GET /api/queries/:id
// @access  Public
const getQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('student', 'name email role profileImageUrl')
      .populate('assignedAlumni', 'name email role profileImageUrl');

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    return successResponse(res, query, 'Query retrieved successfully');
  } catch (error) {
    console.error('Get query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Update query
// @route   PUT /api/queries/:id
// @access  Private/Student
const updateQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    if (query.student.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to update this query');
    }

    const allowedFields = ['title', 'content', 'category', 'priority', 'isPublic', 'tags'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        query[field] = req.body[field];
      }
    });

    await query.save();
    return successResponse(res, query, 'Query updated successfully');
  } catch (error) {
    console.error('Update query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Delete query
// @route   DELETE /api/queries/:id
// @access  Private/Student
const deleteQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    if (query.student.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to delete this query');
    }

    await Query.deleteOne({ _id: req.params.id });
    return successResponse(res, null, 'Query deleted successfully');
  } catch (error) {
    console.error('Delete query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Add answer to query
// @route   PUT /api/queries/:id/answer
// @access  Private/Alumni
const addAnswer = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    const answer = {
      alumni: req.user._id,
      content: req.body.content,
      attachments: req.body.attachments || [],
      createdAt: new Date()
    };

    query.answers.push(answer);
    query.status = 'answered';
    await query.save();

    return successResponse(res, answer, 'Answer added successfully');
  } catch (error) {
    console.error('Add answer error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Accept answer
// @route   PUT /api/queries/:id/accept-answer/:answerId
// @access  Private/Student
const acceptAnswer = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    if (query.student.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'Not authorized to accept answer for this query');
    }

    const answer = query.answers.id(req.params.answerId);
    if (!answer) {
      return notFoundResponse(res, 'Answer not found');
    }

    answer.isAccepted = true;
    query.status = 'resolved';
    await query.save();

    return successResponse(res, answer, 'Answer accepted successfully');
  } catch (error) {
    console.error('Accept answer error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Upvote query
// @route   POST /api/queries/:id/upvote
// @access  Private
const upvoteQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    const userId = req.user._id.toString();
    const hasUpvoted = query.upvotes.includes(userId);

    if (hasUpvoted) {
      query.upvotes = query.upvotes.filter(id => id.toString() !== userId);
    } else {
      query.upvotes.push(userId);
    }

    await query.save();
    // Log upvote/unupvote
    await Log.create({
      type: hasUpvoted ? 'query_unupvote' : 'query_upvote',
      actor: req.user.email,
      target: query._id.toString(),
      message: `User ${req.user.email} ${hasUpvoted ? 'removed upvote from' : 'upvoted'} a query`,
      meta: { queryId: query._id }
    });
    return successResponse(res, { 
      hasUpvoted: !hasUpvoted,
      upvotesCount: query.upvotes.length
    }, hasUpvoted ? 'Query upvote removed' : 'Query upvoted');
  } catch (error) {
    console.error('Upvote query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Downvote query
// @route   POST /api/queries/:id/downvote
// @access  Private
const downvoteQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);

    if (!query) {
      return notFoundResponse(res, 'Query not found');
    }

    const userId = req.user._id.toString();
    const hasDownvoted = query.downvotes.includes(userId);

    if (hasDownvoted) {
      query.downvotes = query.downvotes.filter(id => id.toString() !== userId);
    } else {
      query.downvotes.push(userId);
    }

    await query.save();
    // Log downvote/undownvote
    await Log.create({
      type: hasDownvoted ? 'query_undownvote' : 'query_downvote',
      actor: req.user.email,
      target: query._id.toString(),
      message: `User ${req.user.email} ${hasDownvoted ? 'removed downvote from' : 'downvoted'} a query`,
      meta: { queryId: query._id }
    });
    return successResponse(res, { 
      hasDownvoted: !hasDownvoted,
      downvotesCount: query.downvotes.length
    }, hasDownvoted ? 'Query downvote removed' : 'Query downvoted');
  } catch (error) {
    console.error('Downvote query error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get student queries
// @route   GET /api/queries/student/:studentId
// @access  Public
const getStudentQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queries = await Query.find({ student: req.params.studentId })
      .populate('student', 'name email role profileImageUrl')
      .populate('assignedAlumni', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Query.countDocuments({ student: req.params.studentId });

    return successResponse(res, {
      queries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Student queries retrieved successfully');
  } catch (error) {
    console.error('Get student queries error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get alumni queries
// @route   GET /api/queries/alumni/:alumniId
// @access  Public
const getAlumniQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const queries = await Query.find({ 'answers.alumni': req.params.alumniId })
      .populate('student', 'name email role profileImageUrl')
      .populate('assignedAlumni', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Query.countDocuments({ 'answers.alumni': req.params.alumniId });

    return successResponse(res, {
      queries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Alumni queries retrieved successfully');
  } catch (error) {
    console.error('Get alumni queries error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get trending queries
// @route   GET /api/queries/trending
// @access  Public
const getTrendingQueries = async (req, res) => {
  try {
    const queries = await Query.find({ isPublic: true })
      .populate('student', 'name email role profileImageUrl')
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(10);

    return successResponse(res, queries, 'Trending queries retrieved successfully');
  } catch (error) {
    console.error('Get trending queries error:', error);
    return badRequestResponse(res, error.message);
  }
};

module.exports = {
  createQuery,
  getQueries,
  getQuery,
  updateQuery,
  deleteQuery,
  addAnswer,
  acceptAnswer,
  upvoteQuery,
  downvoteQuery,
  getStudentQueries,
  getAlumniQueries,
  getTrendingQueries
}; 