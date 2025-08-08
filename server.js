const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration (simple in-memory for now)
const config = {
  max_reviews: 15,
  reviews_per_page: 5,
  show_review_text: true,
  star_color: '#FFC107',
  autoplay: false,
  autoplay_interval: 5000
};

app.use(express.json());

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const corsOrigins = [...allowedOrigins, 'http://localhost:8000', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  methods: ['GET', 'POST'],
  credentials: false
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Google Reviews API',
    status: 'running',
    endpoints: ['/health', '/debug', '/api/config', '/api/google-reviews']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Debug endpoint
app.get('/debug', (req, res) => {
  const placeId = process.env.GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_API_KEY;
  
  res.json({
    hasPlaceId: !!placeId,
    hasApiKey: !!apiKey,
    placeIdLength: placeId ? placeId.length : 0,
    apiKeyLength: apiKey ? apiKey.length : 0,
    nodeVersion: process.version,
    port: PORT,
    config: config
  });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
  res.json(config);
});

// Google reviews endpoint
app.get('/api/google-reviews', async (req, res) => {
  try {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!placeId || !apiKey) {
      return res.status(500).json({ 
        error: 'Missing configuration' 
      });
    }

    console.log('Fetching reviews...');

    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = {
      place_id: placeId,
      fields: 'name,rating,reviews,user_ratings_total',
      key: apiKey
    };

    const response = await axios.get(url, { 
      params: params,
      timeout: 10000 
    });

    console.log('API response status:', response.data.status);

    if (response.data.status !== 'OK') {
      throw new Error('Google API error: ' + response.data.status);
    }

    if (!response.data.result) {
      throw new Error('No result from Google API');
    }

    const result = response.data.result;
    const reviews = result.reviews || [];
    
    const limitedReviews = reviews.slice(0, config.max_reviews);
    
    const formattedReviews = limitedReviews.map(review => {
      return {
        author_name: review.author_name,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relative_time_description
      };
    });

    res.json({
      name: result.name || 'Business',
      rating: result.rating || 0,
      reviews: formattedReviews,
      user_ratings_total: result.user_ratings_total || 0,
      max_reviews_returned: config.max_reviews
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port', PORT);
});