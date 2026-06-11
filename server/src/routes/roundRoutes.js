const express = require('express');
const {
  getRounds,
  createRound,
  updateRound,
  deleteRound,
  startRound
} = require('../controllers/roundController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getRounds)
  .post(createRound);

router.route('/:id')
  .put(updateRound)
  .delete(deleteRound);

router.post('/:id/start', protect, startRound);

module.exports = router;
