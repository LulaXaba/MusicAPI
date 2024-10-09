const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(express.json());
app.use(cors());  // Enable CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Easy Music API!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', require('./routes/music'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/feedback', require('./routes/feedback'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
