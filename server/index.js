const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();
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