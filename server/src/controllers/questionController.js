const Question = require('../models/Question');

// @desc    Get all questions (with basic info)
// @route   GET /api/questions
// @access  Private
const getQuestions = async (req, res, next) => {
  try {
    // exclude hiddenTestCases and correctSolution from list view
    const questions = await Question.find({})
      .select('-hiddenTestCases -correctSolution');
    res.json(questions);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single question by slug
// @route   GET /api/questions/:slug
// @access  Private
const getQuestionBySlug = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (user.warnings >= 3) {
      return res.status(403).json({ message: 'Disqualified' });
    }

    const question = await Question.findOne({ slug: req.params.slug })
      .select('-correctSolution');

    if (question) {
      res.json(question);
    } else {
      res.status(404);
      throw new Error('Question not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin
const createQuestion = async (req, res, next) => {
  try {
    const question = new Question(req.body);
    const createdQuestion = await question.save();
    res.status(201).json(createdQuestion);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestions,
  getQuestionBySlug,
  createQuestion
};
