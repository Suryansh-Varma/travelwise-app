const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  from: String,
  to: String,
  startDate: Date,
  deadline: Date,
  budget: Number,
  userID: String,

  plan_name: String,
  plan_rationale: String,

  itinerary: [{
    day: Number,
    date: String,
    theme: String,
    activities: [String],
    accommodation: {
      name: String,
      location: String,
      estimated_cost_inr: Number,
      booking_link: String
    }
  }],

  total_cost_accommodation_activities: Number,

  travelSelection: {
    outboundCost: Number,
    returnCost: Number,
    outboundId: String,
    returnId: String
  },

  sideLocations: [{
    name: String,
    days: Number,
    budget: Number
  }],

  plan: [mongoose.Schema.Types.Mixed],
  warnings: [String],

  totalCost: Number,
  budgetRemaining: Number

}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);
