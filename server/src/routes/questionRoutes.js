const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionBySlug, createQuestion } = require('../controllers/questionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getQuestions)
  .post(protect, admin, createQuestion);

router.get('/:slug', protect, getQuestionBySlug);

module.exports = router;
