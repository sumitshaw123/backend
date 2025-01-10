const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  workExperience: [{
    jobTitle: String,
    company: String,
    startDate: String,
    endDate: String,
    jobDescription: String
  }],
  education: [{
    degree: String,
    institution: String,
    graduationYear: Number
  }],
  skills: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);