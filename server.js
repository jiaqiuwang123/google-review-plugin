// server.js - Backend service for Google Cloud Run
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

/ Setup allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const corsOrigins = [...allowedOrigins, 'http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000'];

// Apply CORS BEFORE defining routes
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET'],
  credentials: false
}));

// Endpoint to fetch Google reviews
app.get('/api/google-reviews', async (req, res) => {
  try {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!placeId || !apiKey) {
      return res.status(500).json({ 
        error: 'Missing configuration. Please set GOOGLE_PLACE_ID and GOOGLE_API_KEY.' 
      });
    }

    // Make request to Google Places API
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`
    );

    console.log('Google API Response Status:', response.data.status);
    console.log('Google API Response:', JSON.stringify(response.data, null, 2));

    // Check if API returned an error
    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    // Check if result exists
    if (!response.data.result) {
      throw new Error('No result returned from Google Places API. Please check your Place ID.');
    }

    // Extract relevant data with fallbacks
    const result = response.data.result;
    const name = result.name || 'Business';
    const rating = result.rating || 0;
    const reviews = result.reviews || [];
    const user_ratings_total = result.user_ratings_total || 0;
    
    // Handle case where reviews might be undefined or empty
    if (!reviews || reviews.length === 0) {
      return res.json({
        name,
        rating,
        reviews: [],
        user_ratings_total
      });
    }
    
    // Format reviews to include only necessary information and protect privacy
    const formattedReviews = reviews.map(review => ({
      author_name: review.author_name,
      profile_photo_url: review.profile_photo_url,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description
    }));

    // Return formatted data
    res.json({
      name,
      rating,
      reviews: formattedReviews,
      user_ratings_total
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviews from Google API',
      details: error.message 
    });
  }
});

// Debug endpoint to test Google API configuration
app.get('/debug', async (req, res) => {
  try {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    res.json({
      hasPlaceId: !!placeId,
      hasApiKey: !!apiKey,
      placeIdLength: placeId ? placeId.length : 0,
      apiKeyLength: apiKey ? apiKey.length : 0,
      placeIdPrefix: placeId ? placeId.substring(0, 10) + '...' : 'Not set',
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});