const express = require('express');
const router = express.Router();
const { getGlobalLeaderboard } = require('../controllers/leaderboardController');

router.get('/', getGlobalLeaderboard);

module.exports = router;
