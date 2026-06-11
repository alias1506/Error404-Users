const express = require('express');
const router = express.Router();
const { reportViolation } = require('../controllers/violationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, reportViolation);

module.exports = router;
