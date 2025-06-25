const Post = require('../models/Post');
const { successResponse, notFoundResponse, badRequestResponse, forbiddenResponse } = require('../utils/responseHandler');
const { uploadImage, uploadVideo, deleteFile } = require('../config/cloudinary');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    if (caption && caption.length > 1000) {
      return badRequestResponse(res, 'Caption cannot exceed 1000 characters');
    }

    let mediaArr = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('Received file:', file.originalname, file.mimetype, file.path);
        let result;
        let type = 'image';
        if (file.mimetype.startsWith('video/')) {
          console.log('Uploading video to Cloudinary...');
          result = await uploadVideo(file.path, 'connectu/posts');
          type = 'video';
          console.log('Video uploaded to Cloudinary:', result.url);
        } else {
          console.log('Uploading image to Cloudinary...');
          result = await uploadImage(file.path, 'connectu/posts', {
            width: 1200,
            height: 1200,
            crop: 'limit',
            quality: 'auto:good'
          });
          console.log('Image uploaded to Cloudinary:', result.url);
        }
        mediaArr.push({
          type,
          url: result.url,
          publicId: result.publicId,
          thumbnail: result.thumbnail || null
        });
      }
    } else if (Array.isArray(req.body.media) && req.body.media.length > 0) {
      console.warn('WARNING: Post created with req.body.media, not via file upload. This may store local URIs! req.body.media:', req.body.media);
      mediaArr = req.body.media;
    }
    console.log('mediaArr to be saved:', mediaArr);
    const postData = {
      author: req.user._id,
      caption: caption,
      media: mediaArr,
      tags: req.body.tags || [],
      isPublic: req.body.isPublic !== false
    };
    const post = await Post.create(postData);
    await post.populate('author', 'name email role profileImageUrl');
    // Simulate upload progress (for demo)
    res.setHeader('X-Upload-Progress', '100');
    console.log('Post created with media:', mediaArr);
    return successResponse(res, post, 'Post created successfully');
  } catch (error) {
    console.error('Create post error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get all posts with pagination
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Show all public posts to all users
    const query = { isPublic: true };

    const posts = await Post.find(query)
      .populate('author', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean({ virtuals: true });

    const total = await Post.countDocuments(query);

    return successResponse(res, {
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }, 'Posts retrieved successfully');
  } catch (error) {
    console.error('Get posts error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email role profileImageUrl');

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    return successResponse(res, post, 'Post retrieved successfully');
  } catch (error) {
    console.error('Get post error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    const allowedFields = ['caption', 'media', 'tags', 'isPublic'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field];
      }
    });

    await post.save();
    return successResponse(res, post, 'Post updated successfully');
  } catch (error) {
    console.error('Update post error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return forbiddenResponse(res, 'User not authorized to delete this post');
    }

    // Delete media from Cloudinary
    if (post.media && post.media.length > 0) {
      console.log(`Preparing to delete ${post.media.length} media item(s) for post ${post._id}.`);
      for (const mediaItem of post.media) {
        if (mediaItem.publicId) {
          console.log(`Deleting media: public_id=${mediaItem.publicId}, type=${mediaItem.type}`);
          // The resource type for Cloudinary videos is 'video', for images it's 'image'.
          await deleteFile(mediaItem.publicId, mediaItem.type);
        } else {
          console.log(`Skipping media deletion for item without publicId: ${mediaItem.url}`);
        }
      }
    }

    await Post.deleteOne({ _id: req.params.id });
    console.log(`Post ${post._id} deleted from database successfully.`);
    return successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    console.error(`Error deleting post ${req.params.id}:`, error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Like post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    const userId = req.user._id.toString();
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return successResponse(res, { 
      isLiked: !isLiked,
      likesCount: post.likes.length 
    }, isLiked ? 'Post unliked' : 'Post liked');
  } catch (error) {
    console.error('Like post error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Unlike post
// @route   DELETE /api/posts/:id/like
// @access  Private
const unlikePost = async (req, res) => {
  return likePost(req, res);
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    const comment = {
      user: req.user._id,
      content: req.body.content,
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    return successResponse(res, comment, 'Comment added successfully');
  } catch (error) {
    console.error('Add comment error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Remove comment from post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
const removeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return notFoundResponse(res, 'Post not found');
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return notFoundResponse(res, 'Comment not found');
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    return successResponse(res, null, 'Comment removed successfully');
  } catch (error) {
    console.error('Remove comment error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
const getTrendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isPublic: true })
      .populate('author', 'name email role profileImageUrl')
      .sort({ likes: -1, createdAt: -1 })
      .limit(10);

    return successResponse(res, posts, 'Trending posts retrieved successfully');
  } catch (error) {
    console.error('Get trending posts error:', error);
    return badRequestResponse(res, error.message);
  }
};

// @desc    Get user posts
// @route   GET /api/posts/user/:userId
// @access  Public
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { author: userId, isActive: true };

    const posts = await Post.find(query)
      .populate('author', 'name email role profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean({ virtuals: true });

    const total = await Post.countDocuments(query);

    return successResponse(res, {
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    }, 'User posts retrieved successfully');
  } catch (error) {
    console.error('Get user posts error:', error);
    return badRequestResponse(res, error.message);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  getTrendingPosts,
  getUserPosts
}; 