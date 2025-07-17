const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  plan: [
    {
      mode: String,
      source: String,
      destination: String,
      serviceNumber: String,
      departureTime: String,
      arrivalTime: String,
      cost: Number,
      durationHrs: Number,
      layover: String,
      bufferMins: Number,
      bufferNote: String,
      availability: String,
    }
  ],
  warnings: [String],
  userID: {
    type: String,
    required: true,
  },
  totalCost: Number, 
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);