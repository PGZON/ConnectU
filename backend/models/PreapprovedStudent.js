const mongoose = require('mongoose');

const preapprovedStudentSchema = new mongoose.Schema({
  prn: {
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

module.exports = mongoose.model('PreapprovedStudent', preapprovedStudentSchema); 