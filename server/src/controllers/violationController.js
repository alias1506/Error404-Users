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

    // Ignore warnings for the admin
    if (user.role === 'admin' || (user.username === 'Error404 Admin' && user.email === 'error404@admin.com')) {
      return res.status(200).json({
        message: 'Admin user is immune to warnings',
        warnings: 0,
        disqualified: false
      });
    }

    // If user is already disqualified, just return the status
    if (user.warnings >= 3) {
      return res.status(200).json({ 
        message: 'User is already disqualified',
        warnings: user.warnings,
        disqualified: true
      });
    }

    const warningNumber = user.warnings + 1;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { warnings: 1 } },
      { new: true, select: 'warnings' }
    );

    if (!updatedUser) {
      res.status(404);
      throw new Error('User not found');
    }

    // Log the violation without delaying the warning response
    const violationPromise = Violation.create({
      user: user._id,
      violationType,
      warningNumber,
      severity: 'High',
      metadata
    });

    res.status(201).json({
      message: 'Violation recorded',
      warnings: warningNumber,
      disqualified: warningNumber >= 3
    });

    violationPromise.catch((error) => {
      console.error('Failed to log violation:', error);
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportViolation
};
