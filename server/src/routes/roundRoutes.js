const express = require('express');
const {
  getRounds,
  createRound,
  updateRound,
  deleteRound
} = require('../controllers/roundController');

const router = express.Router();

router.route('/')
  .get(getRounds)
  .post(createRound);

router.route('/:id')
  .put(updateRound)
  .delete(deleteRound);

module.exports = router;
