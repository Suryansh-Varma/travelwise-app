const express = require('express');
const Trip = require('../models/Trip'); 
const router = express.Router();
const generateRoutes = require('../api/trips/generate/trips'); 

// Plan a new trip via AI
router.use('/generate', generateRoutes);

// Create a single trip manually
router.post("/", async (req, res) => {
    try {
        const { userID, ...tripData } = req.body; 
        if (!userID) {
            return res.status(400).json({ error: "userID is required" });
        }
        const newTrip = new Trip({ ...tripData, userID }); 

        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        console.error("Error creating trip:", error);
        res.status(500).json({ error: "Failed to create trip", message: error.message });
    }
});

// Fetch saved trips for a user
router.get("/", async (req, res) => {
    try {
        const { userID } = req.query; 

        if (!userID) {
            return res.status(400).json({ error: "userID query parameter is required." });
        }

        const trips = await Trip.find({ userID: userID }).sort({ createdAt: -1 });
        console.log(`Fetched ${trips.length} trips for userID: ${userID}`);
        res.json(trips);
    } catch (err) {
        console.error("Error fetching trips:", err);
        res.status(500).json({ error: "Failed to fetch trips", message: err.message });
    }
});

// ADDED: Delete a specific trip
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTrip = await Trip.findByIdAndDelete(id);
        
        if (!deletedTrip) {
            return res.status(404).json({ error: "Trip not found" });
        }
        
        res.status(200).json({ message: "Trip deleted successfully" });
    } catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: "Failed to delete trip", message: error.message });
    }
});

module.exports = router;