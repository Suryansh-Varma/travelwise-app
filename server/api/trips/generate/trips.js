const axios = require('axios');
const Trip = require('../../../models/Trip'); // Adjust path as needed
const express = require('express');
const router = express.Router();

// Helper function to validate and parse date-time strings
function isValidISODateString(str) {
    if (!str) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
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
        // --- 1. Generate core itinerary using Gemini API ---
        const geminiPrompt = `Plan a trip from ${from} to ${to} between ${startDate} and ${deadline} with a budget of ₹${budget}.
Include all possible modes: bus, train, flight, cab, metro, etc.

Always include routes via all possible major hubs (e.g., Hyderabad, Mumbai, Chennai, etc.) and break the journey into multiple legs. Prioritize presenting diverse options (e.g., fastest, cheapest, specific mode combinations). For each leg, include layover time at the hub if applicable.

Provide **at least 2-3 distinct travel options/plans**. Each plan should be a complete itinerary.

**Return ONLY a JSON array, where each element is a JSON object representing a complete travel plan. Do NOT include any additional text, markdown, or explanation outside of the JSON array.**

Example of the expected JSON ARRAY structure:
\`\`\`json
[
  {
    "from": "String",
    "to": "String",
    "startDate": "String (ISO 8601 date, e.g., YYYY-MM-DD)",
    "deadline": "String (ISO 8601 date, e.g., YYYY-MM-DD)",
    "budget": "Number (in ₹)",
    "plan": [
      {
        "mode": "String",
        "source": "String",
        "destination": "String",
        "serviceNumber": "String or null",
        "departureTime": "String (ISO 8601 format)",
        "arrivalTime": "String (ISO 8601 format)",
        "cost": "Number",
        "durationHrs": "Number",
        "layover": "String or null",
        "bufferMins": "Number or null",
        "bufferNote": "String or null",
        "availability": "String",
        "warnings": "Array of strings or null"
      }
    ],
    "warnings": "Array of strings (overall plan warnings for this specific option)",
    "userID": "String",
    "totalCost": "Number (sum of costs for this specific plan)"
  }
]
\`\`\`

Ensure all date-time strings within the 'plan' array are in ISO 8601 format including timezone offset, and 'startDate'/'deadline' are YYYY-MM-DD. Be realistic with costs and durations for Indian travel.
`;

        // Prefer using Google service account (short-lived access token). If not available, fall back to API key.
        const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
        const geminiBody = { contents: [{ parts: [{ text: geminiPrompt }] }] };

        // Build axios config with either Authorization header (Bearer) or API key param
        const axiosConfig = { headers: { 'Content-Type': 'application/json' } };

        try {
            // Attempt to obtain Application Default Credentials access token
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
            const client = await auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse && (tokenResponse.token || tokenResponse);
            if (accessToken) {
                axiosConfig.headers.Authorization = `Bearer ${accessToken}`;
            } else if (process.env.GEMINI_API_KEY) {
                axiosConfig.params = { key: process.env.GEMINI_API_KEY };
            } else {
                throw new Error('No access token obtained and no GEMINI_API_KEY configured.');
            }
        } catch (authErr) {
            // If google-auth-library is not configured or fails, fall back to API key if present
            if (process.env.GEMINI_API_KEY) {
                axiosConfig.params = { key: process.env.GEMINI_API_KEY };
            } else {
                console.error('Auth error obtaining Google access token:', authErr.message);
                throw new Error('Could not obtain Google access token and GEMINI_API_KEY is not set.');
            }
        }

        const geminiResponse = await axios.post(geminiUrl, geminiBody, axiosConfig);

        let parsedTripPlans; // This will now be an array of plan objects
        const geminiOutput = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!geminiOutput) {
            throw new Error('Gemini API returned an empty or invalid response.');
        }

        try {
            parsedTripPlans = JSON.parse(geminiOutput);
            if (!Array.isArray(parsedTripPlans)) {
                throw new Error('Gemini output is not an array of trip plans as expected.');
            }
        } catch (jsonParseError) {
            console.error('Failed to parse Gemini output as JSON:', jsonParseError);
            console.error('Raw Gemini output:', geminiOutput);
            const jsonMatch = geminiOutput.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                try {
                    parsedTripPlans = JSON.parse(jsonMatch[1]);
                    if (!Array.isArray(parsedTripPlans)) {
                        throw new Error('Gemini output (from markdown) is not an array of trip plans.');
                    }
                } catch (innerJsonParseError) {
                    throw new Error('Gemini output could not be parsed as JSON even after markdown extraction. Please check Gemini prompt or response.');
                }
            } else {
                throw new Error('Gemini output is not a valid JSON string and does not contain a JSON markdown block.');
            }
        }

        // --- 2. Post-process EACH Gemini plan and potentially enrich with Google Maps data ---
        const finalTripDocs = []; // To store all processed trip documents

        for (const singleParsedPlan of parsedTripPlans) {
            let totalCostForThisPlan = 0;
            let overallWarningsForThisPlan = singleParsedPlan.warnings || [];
            let overnightTravelDetectedForThisPlan = false;

            // Ensure 'plan' array exists and is valid for this specific option
            if (!singleParsedPlan.plan || !Array.isArray(singleParsedPlan.plan)) {
                overallWarningsForThisPlan.push(`One generated option did not return a valid "plan" array.`);
                singleParsedPlan.plan = [];
            }

            // Process each segment within THIS specific plan
            for (const segment of singleParsedPlan.plan) {
                const segmentCost = Number(segment.cost) || 0;
                totalCostForThisPlan += segmentCost;

                if (segment.warnings && Array.isArray(segment.warnings)) {
                    overallWarningsForThisPlan.push(...segment.warnings.map(w => `Segment (${segment.mode} ${segment.source} to ${segment.destination}): ${w}`));
                }

                try {
                    const depTime = new Date(segment.departureTime);
                    const arrTime = new Date(segment.arrivalTime);
                    if (depTime.toDateString() !== arrTime.toDateString()) {
                        overnightTravelDetectedForThisPlan = true;
                    }
                } catch (e) {
                    console.warn(`Warning: Invalid date/time format for segment (${segment.mode}): ${e.message}`);
                    overallWarningsForThisPlan.push(`Segment: Invalid date/time format for ${segment.mode}.`);
                }

                // --- Google Maps Integration for specific modes ---
                const modeLower = segment.mode?.toLowerCase();
                let googleMapsMode = null;
                if (['cab', 'auto-rickshaw'].includes(modeLower)) {
                    googleMapsMode = 'driving';
                } else if (['bus', 'metro', 'train'].includes(modeLower)) {
                    googleMapsMode = 'transit';
                }

                if (googleMapsMode && segment.source && segment.destination) {
                    try {
                        const googleMapsResponse = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
                            params: {
                                origin: segment.source,
                                destination: segment.destination,
                                mode: googleMapsMode,
                                key: process.env.Maps_API_KEY, // Use your correct API key variable
                            },
                        });

                        if (googleMapsResponse.data.routes && googleMapsResponse.data.routes.length > 0) {
                            const leg = googleMapsResponse.data.routes[0].legs[0];
                            if (leg.duration && leg.duration.value) {
                               segment.durationHrs = (leg.duration.value / 3600);
                            }
                            if (leg.distance && leg.distance.value) {
                               segment.distanceKm = (leg.distance.value / 1000);
                            }

                            if (['cab', 'auto-rickshaw'].includes(modeLower) && (!segment.cost || segment.cost === 0) && segment.distanceKm) {
                                const estimatedCost = Math.max(50, Math.round(segment.distanceKm * 15));
                                // Only add to totalCost for this plan if we are setting the cost for the first time
                                if (!segment.cost) totalCostForThisPlan += estimatedCost;
                                segment.cost = estimatedCost;
                                overallWarningsForThisPlan.push(`Segment: ${segment.mode} cost for ${segment.source} to ${segment.destination} estimated by distance using Google Maps data.`);
                            }
                        } else {
                            overallWarningsForThisPlan.push(`Segment: Could not get Google Maps directions for ${segment.mode} from ${segment.source} to ${segment.destination}.`);
                        }
                    } catch (mapError) {
                        console.error('Error fetching Google Maps directions for segment:', mapError.message);
                        overallWarningsForThisPlan.push(`Segment: Failed to get detailed map data for ${segment.mode} (${segment.source} to ${segment.destination}).`);
                    }
                }

                // Default buffer if not provided
                if (segment.bufferMins === null || segment.bufferMins === undefined) {
                    if (segment.mode === 'flight') {
                        segment.bufferMins = 90;
                        segment.bufferNote = "Buffer time for airport check-in and security.";
                    } else if (segment.mode === 'train') {
                        segment.bufferMins = 45;
                        segment.bufferNote = "Buffer time for train station arrival.";
                    } else {
                        segment.bufferMins = 30;
                        segment.bufferNote = "General transfer buffer.";
                    }
                }
            }

            // --- 3. Add overall trip warnings based on constraints for THIS PLAN ---
            if (totalCostForThisPlan > singleParsedPlan.budget) {
                overallWarningsForThisPlan.push(`This plan's total cost ₹${totalCostForThisPlan.toFixed(2)} exceeds its budget of ₹${singleParsedPlan.budget}.`);
            }
            if (overnightTravelDetectedForThisPlan && avoidNightTravel) {
                overallWarningsForThisPlan.push('This plan includes overnight travel, which you opted to avoid. Please review.');
            }
            if (overnightTravelDetectedForThisPlan) {
                overallWarningsForThisPlan.push('Overnight journey detected. Female travelers should take extra precautions.');
            }

            // --- 4. Prepare the Trip document for this plan ---
            finalTripDocs.push({
                from: singleParsedPlan.from || from,
                to: singleParsedPlan.to || to,
                startDate: new Date(singleParsedPlan.startDate || startDate),
                deadline: new Date(singleParsedPlan.deadline || deadline),
                budget: singleParsedPlan.budget || budget,
                plan: singleParsedPlan.plan,
                warnings: overallWarningsForThisPlan,
                userID: userID, // Assuming userID is common for all plans of this request
                totalCost: totalCostForThisPlan,
            });
        }

        // --- 5. Save all generated plans to MongoDB ---
        // Option A: Save each plan as a separate document in the 'trips' collection
        if (finalTripDocs.length > 0) {
            await Trip.insertMany(finalTripDocs); // Requires mongoose's insertMany
        } else {
            // Handle case where no plans were generated
            return res.status(200).json({ message: "No suitable travel plans could be generated." });
        }


        // --- 6. Return all generated plans to frontend ---
        res.status(201).json(finalTripDocs);

    } catch (error) {
        console.error('Error generating or saving itineraries:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate itineraries', message: error.message });
    }
});

module.exports = router;