const express = require('express');
const router = express.Router();
const { submitQuestion, getMySubmissions } = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:questionId', protect, submitQuestion);
router.get('/my', protect, getMySubmissions);

module.exports = router;
