const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  violationType: {
    type: String,
    required: true,
    enum: [
      'TAB_SWITCH', 
      'WINDOW_BLUR', 
      'CONTEXT_MENU', 
      'KEYBOARD_SHORTCUT', 
      'DEVTOOLS_DETECTED', 
      'FULLSCREEN_EXIT'
    ]
  },
  warningNumber: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);
