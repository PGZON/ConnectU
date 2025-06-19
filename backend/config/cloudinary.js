const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'connectu/images') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

// Upload video to Cloudinary
const uploadVideo = async (file, folder = 'connectu/videos') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'video',
      transformation: [
        { width: 1280, height: 720, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      duration: result.duration,
      format: result.format,
      thumbnail: result.thumbnail_url
    };
  } catch (error) {
    console.error('Video upload error:', error);
    throw new Error('Failed to upload video');
  }
};

// Upload file to Cloudinary
const uploadFile = async (file, folder = 'connectu/files') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'raw'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};

// Generate thumbnail for video
const generateThumbnail = async (publicId, time = '00:00:01') => {
  try {
    const result = await cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { start_offset: time }
      ]
    });
    return result;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

// Optimize image for profile
const optimizeProfileImage = async (publicId) => {
  try {
    const result = await cloudinary.url(publicId, {
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Profile image optimization error:', error);
    throw new Error('Failed to optimize profile image');
  }
};

// Optimize image for cover
const optimizeCoverImage = async (publicId) => {
  try {
    const result = await cloudinary.url(publicId, {
      transformation: [
        { width: 1200, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Cover image optimization error:', error);
    throw new Error('Failed to optimize cover image');
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadFile,
  deleteFile,
  generateThumbnail,
  optimizeProfileImage,
  optimizeCoverImage
}; 