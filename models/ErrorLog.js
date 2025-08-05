const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  error: {
    type: String,
    required: true
  },
  stack: {
    type: String
  },
  route: {
    type: String
  },
  method: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: {
    type: String
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },
  requestParams: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, { timestamps: true });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
