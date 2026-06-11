const User = require('../models/User');
const Violation = require('../models/Violation');

// @desc    Report an anti-cheat violation
// @route   POST /api/violations
// @access  Private
const reportViolation = async (req, res, next) => {
  try {
    const { violationType, metadata } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // If user is already disqualified, just return the status
    if (user.warnings >= 3) {
      return res.status(200).json({ 
        message: 'User is already disqualified',
        warnings: user.warnings,
        disqualified: true
      });
    }

    // Increment warnings
    user.warnings += 1;
    await user.save();

    // Log the violation
    const violation = await Violation.create({
      user: user._id,
      violationType,
      warningNumber: user.warnings,
      severity: 'High',
      metadata
    });

    res.status(201).json({
      message: 'Violation recorded',
      warnings: user.warnings,
      disqualified: user.warnings >= 3,
      violation
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportViolation
};
