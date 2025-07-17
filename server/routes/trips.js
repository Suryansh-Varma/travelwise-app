const express = require('express');
const Trip = require('../models/Trip');
const router = express.Router();
const generateRoutes = require('../api/trips/generate/trips');
router.use('/generate', generateRoutes);


router.post("/", async (req, res) => {
    try {
        const { userId, ...tripData } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const newTrip = new Trip({ ...tripData, userId });
        const savedTrip = await newTrip.save();
        res.status(201).json(savedTrip);
    } catch (error) {
        res.status(500).json({ error: "Failed to create trip", MessageChannel: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        const filter = userId ? { userId } : {};
        const trips = await Trip.find(filter);
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch trips", MessageChannel: err.message });
    }
});
module.exports = router;