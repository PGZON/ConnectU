const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // Role and Verification
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    default: 'student'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  // Student-specific fields
  prn: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (this.role === 'student') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'PRN is required for students'
    }
  },
  department: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.role === 'student') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Department is required for students'
    }
  },
  batch: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (this.role === 'student') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Batch is required for students'
    }
  },
  
  // Alumni-specific fields
  alumniId: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (this.role === 'alumni') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Alumni ID is required for alumni'
    }
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  profileImage: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  
  // Contact Information
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  
  // Social Links
  linkedin: {
    type: String,
    match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, 'Please enter a valid LinkedIn URL']
  },
  github: {
    type: String,
    match: [/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/, 'Please enter a valid GitHub URL']
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    }
  },
  // Password reset fields
  resetToken: {
    type: String,
    default: undefined
  },
  resetTokenExpires: {
    type: Date,
    default: undefined
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;

// Virtual for full profile URL
userSchema.virtual('profileImageUrl').get(function() {
  if (this.profileImage && this.profileImage.startsWith('http')) {
    return this.profileImage;
  }
  if (this.profileImage && this.profileImage.length > 0) {
    return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${this.profileImage}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random&size=200`;
});

// Virtual for cover image URL
userSchema.virtual('coverImageUrl').get(function() {
  if (this.coverImage && this.coverImage.startsWith('http')) {
    return this.coverImage;
  }
  if (this.coverImage && this.coverImage.length > 0) {
    return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${this.coverImage}`;
  }
  return null;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ prn: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password for user:', this._id || 'new user');
    
    // First, ensure the password is a string and trim it
    this.password = String(this.password).trim();
    
    // Use salt rounds of 12 to match existing database
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('Password hash details:', {
      userId: this._id || 'new user',
      hashLength: this.password.length,
      isValidHash: this.password.startsWith('$2a$12$')
    });
    
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Starting password comparison for user:', this.email);
    
    // Basic validation
    if (!this.password || !candidatePassword) {
      console.error('Missing password data:', {
        email: this.email,
        hasStoredPassword: !!this.password,
        hasCandidatePassword: !!candidatePassword
      });
      return false;
    }

    // Ensure both are strings and trimmed
    const storedHash = String(this.password).trim();
    const inputPassword = String(candidatePassword).trim();

    // Log comparison attempt (but not the actual values)
    console.log('Password comparison details:', {
      email: this.email,
      storedHashLength: storedHash.length,
      inputPasswordLength: inputPassword.length,
      isStoredHashValid: storedHash.startsWith('$2a$12$')
    });

    // Validate hash format
    if (!storedHash.startsWith('$2a$12$')) {
      console.error('Invalid hash format for user:', this.email);
      return false;
    }

    // Compare using bcrypt
    const isMatch = await bcrypt.compare(inputPassword, storedHash);
    console.log('Password comparison result:', {
      email: this.email,
      isMatch: isMatch
    });

    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', {
      email: this.email,
      error: error.message
    });
    return false;
  }
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  
  return {
    id: userObject._id,
    name: userObject.name,
    email: userObject.email,
    role: userObject.role,
    isVerified: userObject.isVerified,
    verificationStatus: userObject.verificationStatus,
    profileImageUrl: this.profileImageUrl,
    coverImageUrl: this.coverImageUrl,
    bio: userObject.bio,
    department: userObject.department,
    batch: userObject.batch,
    graduationYear: userObject.graduationYear,
    currentCompany: userObject.currentCompany,
    designation: userObject.designation,
    experience: userObject.experience,
    linkedin: userObject.linkedin,
    github: userObject.github,
    isActive: userObject.isActive,
    lastActive: userObject.lastActive,
    preferences: userObject.preferences,
    createdAt: userObject.createdAt,
    updatedAt: userObject.updatedAt
  };
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true, isVerified: true });
};

// Static method to find verified users
userSchema.statics.findVerified = function() {
  return this.find({ isVerified: true, isActive: true });
};

module.exports = mongoose.model('User', userSchema); 