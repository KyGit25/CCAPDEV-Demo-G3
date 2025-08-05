const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  seats: {
    type: [Number],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Lab', labSchema);
