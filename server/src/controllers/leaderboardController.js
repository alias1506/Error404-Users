const User = require('../models/User');
const { getRankTitle } = require('../utils/xpCalculator');

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Public
const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('username xp level solvedQuestions attemptedQuestions');

    // Composite ranking:
    //   Score = (xp * 0.5) + (solvedCount * 30 * 0.3) + (attemptCount * 20 * 0.2)
    //   XP      = 50% weight  (rewards quality)
    //   Solved  = 30% weight  (rewards completion)
    //   Attempt = 20% weight  (rewards participation)
    const leaderboard = users.map(user => {
      const solvedCount = user.solvedQuestions?.length || 0;
      const attemptCount = user.attemptedQuestions?.length || 0;
      const rankScore = (user.xp * 0.5) + (solvedCount * 30 * 0.3) + (attemptCount * 20 * 0.2);
      return {
        _id: user._id,
        username: user.username,
        xp: user.xp,
        level: user.level,
        rankTitle: getRankTitle(user.level),
        solvedCount,
        attemptCount,
        rankScore: Math.round(rankScore * 100) / 100
      };
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 100);

    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGlobalLeaderboard
};
