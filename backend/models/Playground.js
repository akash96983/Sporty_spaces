const mongoose = require('mongoose');

const playgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Football', 'Basketball', 'Tennis', 'Volleyball'],
    default: 'Football'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String, // Base64 string or URL
    required: false
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('playground_detail', playgroundSchema);
