const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  iconUrl: {
    type: String // URL to neon icon or SVG string
  },
  criteria: {
    type: String // e.g., 'solve_10', 'first_bug'
  }
}, { timestamps: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
module.exports = Achievement;
