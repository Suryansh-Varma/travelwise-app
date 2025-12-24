const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  from: String,
  to: String,
  startDate: Date,
  deadline: Date,
  budget: Number,
  userID: String,
  plan_name: String,
  plan_rationale: String, // Maps to 'rationale' in Gemini output
  
  itinerary: [{
    day: Number,
    date: String,
    theme: String,      // Added to match latest Gemini output
    activities: [String],
    accommodation: {
      name: String,
      location: String,
      estimated_cost_inr: Number,
      booking_link: String
    }
  }],

  // Logistics
  travelSelection: { outboundCost: Number, returnCost: Number, outboundId: String, returnId: String },
  budgetRemaining: Number,
  sideLocations: [{ name: String, days: Number, budget: Number }],
  plan: [mongoose.Schema.Types.Mixed], // Flexible array for transport legs
  warnings: [String],
  totalCost: Number
}, { timestamps: true });

module.exports = mongoose.model('Trip', TripSchema);