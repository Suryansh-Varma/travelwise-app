const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local first, then fall back to .env
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config(); // This will override with .env if it exists
const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from the Next client and include cookies
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: clientOrigin, credentials: true }));

// JSON body parser with standard options
app.use(express.json());

// Return JSON on invalid JSON parse instead of HTML
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next(err);
});

app.use(cookieParser());
const tripRoutes = require('./routes/trips');
const generateTripRoute = require('./api/trips/generate/trips');
const authRoutes = require('./routes/auth');

app.use('/api/trips', tripRoutes);
app.use('/api/trips/generate', generateTripRoute);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('TravelWise API is running...');
});

// Check if MONGO_URI is set
if (!process.env.MONGO_URI) {
  console.error('❌ ERROR: MONGO_URI is not set in environment variables!');
  console.error('Please create a .env.local file in the server directory with MONGO_URI=mongodb://...');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check your MONGO_URI in .env.local file');
  process.exit(1);
});