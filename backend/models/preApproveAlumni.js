const mongoose = require('mongoose');

const preApproveAlumniSchema = new mongoose.Schema({
  alumniId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  graduationYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PreApproveAlumni', preApproveAlumniSchema); 