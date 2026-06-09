const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a round name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Please provide a duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Active', 'Completed'],
      default: 'Upcoming',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Round', roundSchema);
