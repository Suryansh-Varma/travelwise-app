const axios = require('axios');
const express = require('express');
const router = express.Router();
const Trip = require('../../../models/Trip');
require('dotenv').config();

// Validation helper
function isValidISODateString(str) {
  const d = new Date(str);
  return !isNaN(d.getTime());
}

router.post('/', async (req, res) => {
  const {
    from,
    to,
    startDate,
    deadline,
    budget,
    userID,
    travelSelection,
    budgetRemaining,
    sideLocations,
    avoidNightTravel
  } = req.body;

  // ---------- 1. VALIDATION ----------
  if (!from || !to || !startDate || !deadline || !budget || !userID) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!isValidISODateString(startDate) || !isValidISODateString(deadline)) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  // ---------- 2. GEMINI PROMPT ----------
  const today = new Date().toISOString().split('T')[0];

  const geminiPrompt = `
Current Date for context: ${today}
Target Trip: ${from} to ${to}
Dates: From ${startDate} to ${deadline}
Total Budget: ₹${budget}
Calculated Remaining Budget for Stay/Food: ₹${budgetRemaining}

USER PREFERENCES:
- Side Locations to include: ${JSON.stringify(sideLocations)}
- Avoid Night Travel: ${avoidNightTravel}
- Outbound Transport: ${travelSelection.outboundId} (Cost: ₹${travelSelection.outboundCost})
- Return Transport: ${travelSelection.returnId} (Cost: ₹${travelSelection.returnCost})

STRICT INSTRUCTIONS:
1. Itinerary must include the requested Side Locations (${sideLocations.map(l => l.name).join(', ')}) for the specified number of days.
2. The "plan" array MUST use the exact transport costs and modes provided in the preferences above.
3. Return ONLY valid JSON as an ARRAY of one plan.
4. Use ISO-8601 strings for all date fields.

Schema:
[{
  "plan_name": string,
  "plan_rationale": string,
  "itinerary": [
    { "day": number, "date": string, "theme": string, "activities": string[], "accommodation": { "name": string, "estimated_cost_inr": number } }
  ],
  "plan": [
    { "mode": string, "source": string, "destination": string, "cost": number, "departureTime": string, "arrivalTime": string }
  ],
  "total_cost_accommodation_activities": number
}]
`;

  try {
    // ---------- 3. API CALL ----------
    const API_KEY = process.env.GEMINI_API_KEY;
    // Using gemini-1.5-flash for speed or gemini-1.5-pro for higher quality
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // ---------- 4. PARSING & CLEANING ----------
    let raw = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Safety check: Remove markdown code blocks if Gemini ignores the system instruction
    const cleanJson = raw.replace(/```json|```/g, "").trim();
    const parsedPlans = JSON.parse(cleanJson);

    const finalDocs = [];

    // Ensure we handle both single object or array responses
    const plansArray = Array.isArray(parsedPlans) ? parsedPlans : [parsedPlans];

    for (const plan of plansArray) {
      // Normalize itinerary
      const normalizedItinerary = (plan.itinerary || []).map(d => ({
        ...d,
        date: new Date(d.date).toISOString(),
        activities: Array.isArray(d.activities) ? d.activities : []
      }));
      let overnight = false;
      let transportCost = Number(travelSelection.outboundCost || 0) + Number(travelSelection.returnCost || 0);
      const transportSegments = plan.plan || [];
      for (const seg of transportSegments) {
        transportCost += Number(seg.cost || 0);
        const dep = new Date(seg.departureTime);
        const arr = new Date(seg.arrivalTime);
        if (dep.toDateString() !== arr.toDateString()) {
          overnight = true;
        }
      }
// Calculate true remaining based on what the AI spent on hotels/food
      const accommodationCost = Number(plan.total_cost_accommodation_activities || 0);
      const remaining =
        typeof budgetRemaining === 'number'
          ? budgetRemaining
          : budget - transportCost - accommodationCost;

      const warnings = [];
      if (overnight && avoidNightTravel) {
        warnings.push('Overnight travel detected despite avoidNightTravel preference');
      }

      finalDocs.push({
        from,
        to,
        startDate,
        deadline,
        budget,
        userID,
        plan_name: plan.plan_name,
        plan_rationale: plan.plan_rationale,
        itinerary: normalizedItinerary,
        total_cost_accommodation_activities: accommodationCost,
        plan: transportSegments,
        totalCost: transportCost,
        budgetRemaining: remaining,
        travelSelection,
        sideLocations,
        warnings
      });
    }

    // ---------- 5. DATABASE SAVE ----------
    const saved = await Trip.insertMany(finalDocs);
    res.status(201).json(saved);

  } catch (err) {
    console.error("Error generating trip:", err.response?.data || err.message);
    res.status(500).json({ 
      error: 'Trip generation failed', 
      message: err.response?.data?.error?.message || err.message 
    });
  }
});

module.exports = router;