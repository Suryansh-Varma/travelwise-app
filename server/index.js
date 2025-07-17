const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const tripRoutes = require('./routes/trips');
const generateTripRoute = require('./api/trips/generate/trips');

app.use('/api/trips', tripRoutes);
app.use('/api/trips/generate', generateTripRoute);

app.get('/', (req, res) => {
  res.send('TravelWise API is running...');
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((err) => console.error('MongoDB connection error:', err));