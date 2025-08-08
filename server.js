// server.js - Backend service for Google Cloud Run
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize SQLite database
const db = new sqlite3.Database('reviews_config.db');

// Initialize database tables
db.serialize(() => {
  // Configuration table
  db.run(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Insert default configuration
  db.run(`INSERT OR IGNORE INTO config (key, value) VALUES 
    ('max_reviews', '15'),
    ('reviews_per_page', '5'),
    ('show_review_text', 'true'),
    ('star_color', '#FFC107'),
    ('autoplay', 'false'),
    ('autoplay_interval', '5000')`);
    
  // Create default admin user (username: admin, password: admin123)
  const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES ('admin', ?)`, [defaultPasswordHash]);
});

// Configure sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'google-reviews-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Parse JSON bodies
app.use(express.json());

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

// Middleware to check admin authentication
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// Admin login endpoint
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  db.get('SELECT * FROM admin_users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.adminId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  });
});

// Admin logout endpoint
app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check admin session status
app.get('/admin/status', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// Get configuration endpoint
app.get('/admin/config', requireAuth, (req, res) => {
  db.all('SELECT key, value FROM config', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const config = {};
    rows.forEach(row => {
      let value = row.value;
      // Try to parse as JSON for boolean/number values
      try {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = parseInt(value);
      } catch (e) {
        // Keep as string if parsing fails
      }
      config[row.key] = value;
    });
    
    res.json(config);
  });
});

// Update configuration endpoint
app.post('/admin/config', requireAuth, (req, res) => {
  const updates = req.body;
  
  const updatePromises = Object.entries(updates).map(([key, value]) => {
    return new Promise((resolve, reject) => {
      const stringValue = typeof value === 'boolean' ? value.toString() : value.toString();
      db.run(
        'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, stringValue],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
  
  Promise.all(updatePromises)
    .then(() => {
      res.json({ success: true, message: 'Configuration updated successfully' });
    })
    .catch((err) => {
      console.error('Error updating config:', err);
      res.status(500).json({ error: 'Failed to update configuration' });
    });
});

// Get public configuration (for frontend widget)
app.get('/api/config', (req, res) => {
  db.all('SELECT key, value FROM config', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    const config = {};
    rows.forEach(row => {
      let value = row.value;
      try {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(value)) value = parseInt(value);
      } catch (e) {
        // Keep as string if parsing fails
      }
      config[row.key] = value;
    });
    
    res.json(config);
  });
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

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
    
    // Get max_reviews from database configuration
    const maxReviews = await new Promise((resolve) => {
      db.get('SELECT value FROM config WHERE key = ?', ['max_reviews'], (err, row) => {
        if (err || !row) resolve(15); // fallback to 15
        else resolve(parseInt(row.value) || 15);
      });
    });
    
    const limitedReviews = reviews.slice(0, maxReviews);
    
    // Format reviews to include only necessary information and protect privacy
    const formattedReviews = limitedReviews.map(review => ({
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
      user_ratings_total,
      max_reviews_returned: maxReviews
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