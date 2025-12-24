const axios = require('axios');
const Trip = require('../../../models/Trip');
const express = require('express');
const router = express.Router();


function isValidISODateString(str) {
    if (!str) return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
}

router.post('/', async (req, res) => {
    const { from, to, startDate, deadline, budget, avoidNightTravel, includeLayovers, userID, travelSelection, budgetRemaining, sideLocations } = req.body;

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
        // If client requests a mock run (for testing), skip Gemini and return a simple generated plan
        if (req.headers['x-mock'] === 'true') {
            const mockPlan = {
                from: from,
                to: to,
                startDate: new Date(startDate),
                deadline: new Date(deadline),
                budget: budget,
                plan: [
                    {
                        mode: 'train',
                        source: from,
                        destination: to,
                        serviceNumber: 'TR123',
                        departureTime: startDate,
                        arrivalTime: deadline,
                        cost: Math.round((Number(budget) || 0) * 0.25),
                        durationHrs: 6,
                        layover: null,
                        bufferMins: 30,
                        bufferNote: 'Buffer',
                        availability: 'Available',
                    }
                ],
                warnings: [],
                userID: userID,
                totalCost: Math.round((Number(budget) || 0) * 0.25),
                travelSelection: travelSelection || {},
                budgetRemaining: typeof budgetRemaining === 'number' ? budgetRemaining : (Number(budget) - Math.round((Number(budget) || 0) * 0.25)),
                sideLocations: Array.isArray(sideLocations) ? sideLocations : [],
            };
            const saved = await Trip.create(mockPlan);
            return res.status(201).json([saved]);
        }
        const selectedTravelText = travelSelection ? `User selected travel options: Outbound=${travelSelection.outboundId || 'N/A'} (cost ₹${travelSelection.outboundCost || 0}), Return=${travelSelection.returnId || 'N/A'} (cost ₹${travelSelection.returnCost || 0}).` : '';
        const sideLocationsText = Array.isArray(sideLocations) && sideLocations.length > 0 ? `User wants to visit side locations: ${sideLocations.map(s => `${s.name} (${s.days} days, allocated ₹${s.budget||0})`).join('; ')}.` : '';

                const geminiPrompt = `Plan a trip from ${from} to ${to} between ${startDate} and ${deadline}. ${selectedTravelText} ${sideLocationsText} The user's ORIGINAL total budget is ₹${budget}. The user has ₹${budgetRemaining ?? 'unknown'} remaining (after chosen travel and side allocations) to spend on hotels, activities and local transport — plan accommodation and side activities accordingly. Provide multiple travel+stay options and include hotel suggestions with publicly accessible booking links (e.g., Booking.com) and approximate nightly costs. Be realistic with costs and durations for Indian travel. Include at least 2 distinct itinerary options that fit within the remaining budget for hotels/activities (if a remaining budget is provided). Each option should contain travel legs, hotels, estimated costs per night, and a brief rationale. Return ONLY a JSON array of plan objects (no extra text).`;

        const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
        const geminiBody = { contents: [{ parts: [{ text: geminiPrompt }] }] };

        const axiosConfig = { headers: { 'Content-Type': 'application/json' } };

        try {
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
            const client = await auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse && (tokenResponse.token || tokenResponse);
            if (accessToken) {
                axiosConfig.headers.Authorization = `Bearer ${accessToken}`;
                console.log('Using Google service account authentication for Gemini API');
            } else if (process.env.GEMINI_API_KEY) {
                axiosConfig.params = { key: process.env.GEMINI_API_KEY };
                console.log('Using GEMINI_API_KEY for authentication');
            } else {
                throw new Error('No access token obtained and no GEMINI_API_KEY configured. Please set GEMINI_API_KEY in your .env.local file.');
            }
        } catch (authErr) {
            // If google-auth-library is not configured or fails, fall back to API key if present
            if (process.env.GEMINI_API_KEY) {
                axiosConfig.params = { key: process.env.GEMINI_API_KEY };
                console.log('Falling back to GEMINI_API_KEY after service account auth failed');
            } else {
                console.error('Auth error obtaining Google access token:', authErr.message);
                throw new Error('Could not obtain Google access token and GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your .env.local file.');
            }
        }

        let geminiResponse;
        try {
            geminiResponse = await axios.post(geminiUrl, geminiBody, axiosConfig);
        } catch (apiError) {
            // Handle API errors with more detail
            if (apiError.response) {
                const status = apiError.response.status;
                const errorData = apiError.response.data;
                console.error('Gemini API Error:', {
                    status,
                    statusText: apiError.response.statusText,
                    data: errorData
                });
                
                if (status === 403) {
                    throw new Error(`Gemini API returned 403 Forbidden. This usually means: 1) Your API key is invalid or expired, 2) API key doesn't have access to Gemini API, 3) API key has restrictions. Check your GEMINI_API_KEY in .env.local. Error details: ${JSON.stringify(errorData)}`);
                } else if (status === 401) {
                    throw new Error(`Gemini API returned 401 Unauthorized. Your API key is invalid or missing. Check your GEMINI_API_KEY in .env.local.`);
                } else if (status === 404) {
                    throw new Error(`Gemini API returned 404 Not Found. The model 'gemini-2.5-pro' might not be available. Try using 'gemini-pro' instead.`);
                } else {
                    throw new Error(`Gemini API error (${status}): ${JSON.stringify(errorData)}`);
                }
            } else {
                throw new Error(`Failed to connect to Gemini API: ${apiError.message}`);
            }
        }

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
    
    // NEW FIELDS FROM GEMINI OUTPUT
    plan_name: singleParsedPlan.plan_name,
    plan_rationale: singleParsedPlan.plan_rationale,
    total_cost_accommodation_activities: singleParsedPlan.total_cost_accommodation_activities,
    
    // CAPTURING THE DAILY ITINERARY
    itinerary: singleParsedPlan.itinerary || [], 

    // YOUR EXISTING FIELDS
    plan: singleParsedPlan.plan,
    warnings: overallWarningsForThisPlan,
    userID: userID,
    totalCost: totalCostForThisPlan,
    travelSelection: travelSelection || {},
    budgetRemaining: typeof budgetRemaining === 'number' ? budgetRemaining : (budget - totalCostForThisPlan),
    sideLocations: Array.isArray(sideLocations) ? sideLocations : [],
});
        }

        // --- 5. Save all generated plans to MongoDB ---
        // Option A: Save each plan as a separate document in the 'trips' collection
        let savedTrips = [];
        if (finalTripDocs.length > 0) {
            savedTrips = await Trip.insertMany(finalTripDocs); // Requires mongoose's insertMany - returns saved documents with _id and timestamps
        } else {
            // Handle case where no plans were generated
            return res.status(200).json({ message: "No suitable travel plans could be generated." });
        }


        // --- 6. Return all generated plans to frontend (with _id and timestamps from database) ---
        res.status(201).json(savedTrips);

    } catch (error) {
        console.error('Error generating or saving itineraries:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate itineraries', message: error.message });
    }
});

module.exports = router;