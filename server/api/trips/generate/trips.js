const axios = require('axios');
const Trip = require('../../../models/Trip'); // Adjust path as needed
const express = require('express');
const router = express.Router();

// Helper function to validate and parse date-time strings
function isValidISODateString(str) {
    if (!str) return false;
    // This regex now broadly checks for YYYY-MM-DD format (with or without time/timezone)
    // and relies on Date object's parsing for deeper validity.
    const d = new Date(str);
    return !isNaN(d.getTime()); // Checks if the date object is a valid date
}

router.post('/', async (req, res) => {
    const { from, to, startDate, deadline, budget, avoidNightTravel, includeLayovers, userID } = req.body;

    // --- Input Validation ---
    if (!from || !to || !startDate || !deadline || !budget || !userID) {
        return res.status(400).json({ error: 'Missing required trip parameters: from, to, startDate, deadline, budget, userID.' });
    }
    if (isNaN(budget) || budget <= 0) {
        return res.status(400).json({ error: 'Budget must be a positive number.' });
    }
    if (!isValidISODateString(startDate) || !isValidISODateString(deadline)) {
        return res.status(400).json({ error: 'startDate and deadline must be valid date strings (ISO 8601 preferred).' });
    }
    const parsedStartDate = new Date(startDate);
    const parsedDeadline = new Date(deadline);
    if (parsedStartDate > parsedDeadline) {
        return res.status(400).json({ error: 'startDate cannot be after deadline.' });
    }

    try {
        const geminiPrompt = `Plan a trip from ${from} to ${to} between ${startDate} and ${deadline} with a budget of ₹${budget + 1000}.
        Include all possible modes: bus, train, flight, cab, metro, etc.
        
        Always include routes via all possible major hubs (e.g., Hyderabad, Mumbai, Chennai, etc.) and break the journey into multiple legs. For each leg, include layover time at the hub if applicable. Prioritize presenting diverse options, including those that might be faster via hubs, even if direct options exist.
        
        Provide multiple options if possible (e.g., both direct and indirect routes). Focus on practical, real-world travel options within India.
        
        **Return ONLY a single JSON object conforming to the following structure. Do NOT include any additional text, markdown, or explanation outside of the JSON.**
        
         json format:
        {
          "from": "String",
          "to": "String",
          "startDate": "String (ISO 8601 date, e.g., YYYY-MM-DD)",
          "deadline": "String (ISO 8601 date, e.g., YYYY-MM-DD)",
          "budget": "Number (in ₹)",
          "plan": [
            {
              "mode": "String (e.g., flight, train, bus, cab, metro, auto-rickshaw)",
              "source": "String (specific place, e.g., 'Hyderabad Begumpet Airport')",
              "destination": "String (specific place, e.g., 'Bengaluru City Junction')",
              "serviceNumber": "String or null (e.g., '6E-123', '12723')",
              "departureTime": "String (ISO 8601 format, e.g., YYYY-MM-DDTHH:mm:ss+ZZ:ZZ)",
              "arrivalTime": "String (ISO 8601 format, e.g., YYYY-MM-DDTHH:mm:ss+ZZ:ZZ)",
              "cost": "Number (in ₹)",
              "durationHrs": "Number (e.g., 1.5 for 1 hour 30 mins, 24 for 1 day)",
              "layover": "String (in minutes, e.g., '60' or '90', or null if direct)",
              "bufferMins": "Number (e.g., 30 for check-in/transfer, or null)",
              "bufferNote": "String (explanation for buffer, or null)",
              "availability": "String (high/medium/low/unknown)",
              "warnings": "Array of strings (e.g., 'Overcrowded', 'Low safety for females') or null"
            }
          ],
          "warnings": "Array of strings (overall trip warnings, e.g., 'Budget exceeded')",
          "userID": "String",
          "totalCost": "Number (sum of costs in plan)"
        }
        Example:
        
        {
        
          "from": "Hyderabad",
        
          "to": "Bangalore",
        
          "startDate": "2025-08-01",
        
          "deadline": "2025-08-05",
        
          "budget": 8000,
        
          "plan": [
        
            {
        
              "mode": "flight",
        
              "source": "Hyderabad",
        
              "destination": "Bangalore",
        
              "serviceNumber": "6E-123",
        
              "departureTime": "2025-08-01T09:00:00+05:30",
        
              "arrivalTime": "2025-08-01T10:30:00+05:30",
        
              "cost": 5000,
        
              "durationHrs": 1.5,
        
              "layover": null,
        
              "bufferMins": 45,
        
              "bufferNote": "Buffer time for airport check-in",
        
              "availability": "high"
        
            },
        
            {
        
              "mode": "cab",
        
              "source": "Bangalore Airport",
        
              "destination": "Bangalore City Center",
        
              "serviceNumber": null,
        
              "departureTime": "2025-08-01T11:00:00+05:30",
        
              "arrivalTime": "2025-08-01T12:00:00+05:30",
        
              "cost": 1000,
        
              "durationHrs": 1,
        
              "layover": null,
        
              "bufferMins": null,
        
              "bufferNote": null,
        
              "availability": "medium"
        
            }
        
          ],
        
          "warnings": [],
        
          "userID": "user123",
        
          "totalCost": 6000
        
        }
        
        Ensure all date-time strings within the 'plan' array are in ISO 8601 format including timezone offset, and 'startDate'/'deadline' are YYYY-MM-DD. Be realistic with costs and durations for Indian travel.
        `;


        const geminiResponse = await axios.post(
            'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-002:generateContent',
            {
                contents: [{ parts: [{ text: geminiPrompt }] }],
                // Removed generationConfig: { responseMimeType: "application/json" }
                // This was causing the "Unknown name responseMimeType" error.
                // We will rely on the prompt instructions for JSON output.
            },
            {
                headers: { 'Content-Type': 'application/json' },
                params: { key: process.env.GEMINI_API_KEY },
            }
        );

        let parsedTripPlan;
        const geminiOutput = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!geminiOutput) {
            throw new Error('Gemini API returned an empty or invalid response.');
        }

        try {
            // Attempt to parse the entire output as JSON
            parsedTripPlan = JSON.parse(geminiOutput);
        } catch (jsonParseError) {
            console.error('Failed to parse Gemini output as JSON:', jsonParseError);
            console.error('Raw Gemini output:', geminiOutput);
            // Attempt to extract JSON from markdown if Gemini wrapped it in ```json ... ```
            const jsonMatch = geminiOutput.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    parsedTripPlan = JSON.parse(jsonMatch[1]);
                } catch (innerJsonParseError) {
                    throw new Error('Gemini output could not be parsed as JSON even after markdown extraction. Please check Gemini prompt or response.');
                }
            } else {
                throw new Error('Gemini output is not a valid JSON string and does not contain a JSON markdown block.');
            }
        }

        // --- 2. Post-process Gemini plan and potentially enrich with Google Maps data ---
        let totalCost = 0;
        let overallWarnings = parsedTripPlan.warnings || []; // Start with any warnings Gemini provided
        let overnightTravelDetected = false;

        if (!parsedTripPlan.plan || !Array.isArray(parsedTripPlan.plan)) {
            overallWarnings.push('Gemini did not return a valid "plan" array. Generating a minimal plan.');
            parsedTripPlan.plan = []; // Ensure it's an array to avoid further errors
        }

        // Process each segment
        for (const segment of parsedTripPlan.plan) {
            const segmentCost = Number(segment.cost) || 0;
            totalCost += segmentCost;

            // Add segment-specific warnings from Gemini's output
            if (segment.warnings && Array.isArray(segment.warnings)) {
                overallWarnings.push(...segment.warnings.map(w => `Segment: ${segment.mode} from ${segment.source} to ${segment.destination}: ${w}`));
            }

            // Check for overnight travel based on departure/arrival times
            try {
                const depTime = new Date(segment.departureTime);
                const arrTime = new Date(segment.arrivalTime);
                // Check if the date part is different
                if (depTime.toDateString() !== arrTime.toDateString()) {
                    overnightTravelDetected = true;
                }
            } catch (e) {
                // If date parsing fails (e.g., Gemini gave invalid date string), log and continue
                console.warn(`Warning: Invalid date/time format for segment (${segment.mode}): ${e.message}`);
                overallWarnings.push(`Segment: Invalid date/time format for ${segment.mode}.`);
            }

            // --- Google Maps Integration for specific modes (e.g., Cab/Auto/Transit) ---
            const modeLower = segment.mode?.toLowerCase();
            let googleMapsMode = null;

            if (['cab', 'auto-rickshaw'].includes(modeLower)) {
                googleMapsMode = 'driving';
            } else if (['bus', 'metro', 'train'].includes(modeLower)) { // For general transit via Google Maps
                googleMapsMode = 'transit';
            }

            if (googleMapsMode && segment.source && segment.destination) {
                try {
                    const googleMapsResponse = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
                        params: {
                            origin: segment.source,
                            destination: segment.destination,
                            mode: googleMapsMode,
                            key: process.env.Maps_API_KEY,
                        },
                    });

                    if (googleMapsResponse.data.routes && googleMapsResponse.data.routes.length > 0) {
                        const leg = googleMapsResponse.data.routes[0].legs[0]; // Assuming a single leg for simple A-B

                        // Update segment with more accurate data from Google Maps
                        if (leg.duration && leg.duration.value) {
                           segment.durationHrs = (leg.duration.value / 3600); // Convert seconds to hours
                        }
                        if (leg.distance && leg.distance.value) {
                           segment.distanceKm = (leg.distance.value / 1000); // Store distance if useful
                        }


                        // Recalculate/Estimate cost for cabs/autos if Gemini didn't provide
                        if (['cab', 'auto-rickshaw'].includes(modeLower) && (!segment.cost || segment.cost === 0) && segment.distanceKm) {
                             // Example: ₹15/km base + ₹50 minimum
                            const estimatedCost = Math.max(50, Math.round(segment.distanceKm * 15));
                            // Only add to totalCost if we are setting the cost for the first time
                            if (!segment.cost) totalCost += estimatedCost;
                            segment.cost = estimatedCost;
                            overallWarnings.push(`Segment: ${segment.mode} cost for ${segment.source} to ${segment.destination} estimated by distance using Google Maps data.`);
                        }
                    } else {
                        overallWarnings.push(`Segment: Could not get Google Maps directions for ${segment.mode} from ${segment.source} to ${segment.destination}.`);
                    }
                } catch (mapError) {
                    console.error('Error fetching Google Maps directions:', mapError.message);
                    overallWarnings.push(`Segment: Failed to get detailed map data for ${segment.mode} (${segment.source} to ${segment.destination}).`);
                }
            }


            // Default buffer if not provided by Gemini or calculated by Maps
            if (segment.bufferMins === null || segment.bufferMins === undefined) {
                if (segment.mode === 'flight') {
                    segment.bufferMins = 90; // Airport check-in
                    segment.bufferNote = "Buffer time for airport check-in and security.";
                } else if (segment.mode === 'train') {
                    segment.bufferMins = 45; // Train station
                    segment.bufferNote = "Buffer time for train station arrival.";
                } else {
                    segment.bufferMins = 30; // General transfer
                    segment.bufferNote = "General transfer buffer.";
                }
            }
        }


        // --- 3. Add overall trip warnings based on constraints ---
        if (totalCost > budget) {
            overallWarnings.push(`Total cost ₹${totalCost.toFixed(2)} exceeds your budget of ₹${budget}.`);
        }
        if (overnightTravelDetected && avoidNightTravel) {
            overallWarnings.push('Your trip includes overnight travel, which you opted to avoid. Please review.');
        }
        if (overnightTravelDetected) {
            overallWarnings.push('Overnight journey detected. Female travelers should take extra precautions.');
        }

        // --- 4. Prepare and Save to MongoDB ---
        const tripDoc = {
            from: parsedTripPlan.from || from,
            to: parsedTripPlan.to || to,
            startDate: new Date(parsedTripPlan.startDate || startDate),
            deadline: new Date(parsedTripPlan.deadline || deadline),
            budget: parsedTripPlan.budget || budget,
            plan: parsedTripPlan.plan,
            warnings: overallWarnings,
            userID: userID,
            totalCost: totalCost,
        };

        await Trip.create(tripDoc);

        // --- 5. Return to frontend ---
        res.status(201).json(tripDoc);

    } catch (error) {
        console.error('Error generating or saving itinerary:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate itinerary', message: error.message });
    }
});

module.exports = router;