const express = require('express');
const Trip = require('../models/Trip'); // Ensure this path is correct relative to this file
const router = express.Router();
const generateRoutes = require('../api/trips/generate/trips'); // Adjust path if necessary

// This handles requests to /api/trips/generate (e.g., POST requests to plan a new trip)
router.use('/generate', generateRoutes);

// Handles POST requests to /api/trips (e.g., if you manually create a single trip)
router.post("/", async (req, res) => {
    try {
        // --- FIX 1: Change 'userId' to 'userID' to match schema ---
        const { userID, ...tripData } = req.body; // Expect userID (uppercase ID)
        if (!userID) { // Check for userID
            return res.status(400).json({ error: "userID is required" });
        }
        const newTrip = new Trip({ ...tripData, userID }); // Assign to userID
        // --------------------------------------------------------

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        console.error("Error creating trip:", error); // Added console.error for better logging
        res.status(500).json({ error: "Failed to create trip", MessageChannel: error.message });
    }
});

// Handles GET requests to /api/trips (e.g., to fetch saved trips)
router.get("/", async (req, res) => {
    try {
        // --- FIX 2: Change 'userId' to 'userID' to match schema ---
        const { userID } = req.query; // Extract userID (uppercase ID) from query parameters

        // --- FIX 3: Added explicit error for missing userID in GET for clarity ---
        if (!userID) {
            return res.status(400).json({ error: "userID query parameter is required to fetch user-specific trips." });
        }
        // ----------------------------------------------------------------------

        // Filter by userID and sort by creation date (newest first)
        const trips = await Trip.find({ userID: userID }).sort({ createdAt: -1 });
        console.log(`Fetched ${trips.length} trips for userID: ${userID}`); // Added log
        res.json(trips);
    } catch (err) {
        console.error("Error fetching trips:", err); // Added console.error for better logging
        res.status(500).json({ error: "Failed to fetch trips", MessageChannel: err.message });
    }
});

module.exports = router;