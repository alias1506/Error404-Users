const Round = require('../models/Round');
const User = require('../models/User');

// @desc    Get all rounds
// @route   GET /api/rounds
// @access  Public (or Admin, depending on auth rules)
exports.getRounds = async (req, res, next) => {
  try {
    const rounds = await Round.find({}).sort({ createdAt: -1 });
    res.status(200).json(rounds);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a round
// @route   POST /api/rounds
// @access  Public (or Admin)
exports.createRound = async (req, res, next) => {
  try {
    const { name, duration, status } = req.body;
    
    if (!name || !duration) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const round = await Round.create({
      name,
      duration,
      status: status || 'Upcoming'
    });

    res.status(201).json(round);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a round
// @route   PUT /api/rounds/:id
// @access  Public (or Admin)
exports.updateRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, duration, status } = req.body;

    const round = await Round.findById(id);

    if (!round) {
      res.status(404);
      throw new Error('Round not found');
    }

    if (status === 'Active' && round.status !== 'Active') {
      const User = require('../models/User');
      await User.updateMany(
        {},
        { $pull: { startedRounds: { roundId: round._id } } }
      );
    }

    round.name = name || round.name;
    round.duration = duration || round.duration;
    round.status = status || round.status;

    const updatedRound = await round.save();
    
    res.status(200).json(updatedRound);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a round
// @route   DELETE /api/rounds/:id
// @access  Public (or Admin)
exports.deleteRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const round = await Round.findById(id);
    
    if (!round) {
      res.status(404);
      throw new Error('Round not found');
    }

    await round.deleteOne();
    
    res.status(200).json({ message: 'Round removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Start an active round for a user
// @route   POST /api/rounds/:id/start
// @access  Private
exports.startRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const round = await Round.findById(id);
    if (!round || round.status !== 'Active') {
      res.status(400);
      throw new Error('Round not active or not found');
    }

    const user = await User.findById(userId);
    const alreadyStarted = user.startedRounds.find(r => r.roundId.toString() === id);
    
    if (alreadyStarted) {
      return res.status(200).json(alreadyStarted);
    }

    const newStart = { roundId: id, startTime: Date.now() };
    user.startedRounds.push(newStart);
    await user.save();

    res.status(200).json(newStart);
  } catch (error) {
    next(error);
  }
};
