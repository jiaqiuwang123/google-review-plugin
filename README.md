# Google Reviews Plugin

A custom Google Reviews component that can be embedded into websites, with a backend service designed for Google Cloud Run deployment.

## Components

- **Frontend**: `google-reviews.js` - Custom HTML element for displaying Google reviews
- **Backend**: `server.js` - Express.js API service for fetching Google reviews
- **Docker**: `Dockerfile` - Container configuration for Google Cloud Run

## Setup

### Prerequisites
- Google Cloud account with billing enabled
- Google Places API key
- Google Place ID for your business

### Backend Deployment (Google Cloud Run)

1. Set up environment variables:
   ```bash
   GOOGLE_API_KEY=your_google_places_api_key
   GOOGLE_PLACE_ID=your_business_place_id
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

2. Deploy to Google Cloud Run:
   ```bash
   gcloud run deploy google-reviews-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "GOOGLE_PLACE_ID=your_place_id,ALLOWED_ORIGINS=https://yourdomain.com" \
     --set-secrets "GOOGLE_API_KEY=google-api-key:latest"
   ```

### Frontend Usage

Include the script and use the custom element:

```html
<script src="google-reviews.js"></script>

<google-reviews 
  data-api-url="https://your-cloud-run-service.run.app/api/google-reviews"
  data-max-reviews="10"
  data-reviews-per-page="5"
  data-show-review-text="true"
  data-star-color="#FFC107"
  data-autoplay="true"
  data-autoplay-interval="5000"
></google-reviews>
```

## Features

- Responsive carousel design
- Customizable styling via data attributes  
- Auto-play functionality
- Read more/less for long reviews
- Mobile-friendly responsive design
- CORS-enabled backend for cross-domain requests

## Configuration Options

### Frontend Component
- `data-api-url`: Backend API endpoint
- `data-max-reviews`: Maximum number of reviews to display
- `data-reviews-per-page`: Reviews visible per page
- `data-show-review-text`: Show/hide review text
- `data-star-color`: Color for star ratings
- `data-autoplay`: Enable/disable auto-scrolling
- `data-autoplay-interval`: Auto-scroll interval in milliseconds

### Environment Variables
- `GOOGLE_API_KEY`: Google Places API key
- `GOOGLE_PLACE_ID`: Business place ID from Google
- `ALLOWED_ORIGINS`: Comma-separated list of allowed domains
- `PORT`: Server port (default: 8080)# google-review-plugin
