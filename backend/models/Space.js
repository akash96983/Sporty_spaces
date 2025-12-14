const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide space name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide description'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  sportType: {
    type: String,
    required: [true, 'Please provide sport type'],
    enum: ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Hockey', 'Other']
  },
  address: {
    type: String,
    required: [true, 'Please provide address']
  },
  city: {
    type: String,
    required: [true, 'Please provide city']
  },
  state: {
    type: String,
    required: [true, 'Please provide state']
  },
  pincode: {
    type: String,
    required: [true, 'Please provide pincode']
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Please provide price per hour'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: String,
    publicId: String
  }],
  amenities: [{
    type: String
  }],
  operatingHours: {
    opening: {
      type: String,
      required: true
    },
    closing: {
      type: String,
      required: true
    }
  },
  size: String,
  surfaceType: String,
  capacity: Number,
  contactNumber: String,
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
  timestamps: true
});

module.exports = mongoose.model('Space', SpaceSchema);
