// server.js - Backend service for Google Cloud Run
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS with appropriate configuration for your domain
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
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

    // Extract relevant data
    const { name, rating, reviews, user_ratings_total } = response.data.result;
    
    // Handle case where reviews might be undefined or empty
    if (!reviews || reviews.length === 0) {
      return res.json({
        name: name || 'Business',
        rating: rating || 0,
        reviews: [],
        user_ratings_total: user_ratings_total || 0
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});