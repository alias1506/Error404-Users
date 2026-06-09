const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  buggyCode: {
    type: String,
    required: true
  },
  correctSolution: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  language: {
    type: String,
    required: true // e.g., 'python', 'javascript', 'c', 'cpp', 'java'
  },
  judge0LanguageId: {
    type: Number,
    required: false // e.g., 63 for JavaScript, 71 for Python
  },
  hiddenTestCases: [{
    input: { type: String },
    expectedOutput: { type: String, required: true }
  }],
  xpReward: {
    type: Number,
    required: true,
    default: 10
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
