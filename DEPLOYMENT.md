# Google Cloud Run Deployment Instructions

## Prerequisites

1. **Google Cloud Account**: Ensure you have a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install and authenticate the gcloud CLI tool
3. **Google Places API**: Enable the Google Places API and obtain an API key
4. **Business Place ID**: Get your business's Google Place ID

## Quick Deployment

### Option 1: Using the Deployment Script (Recommended)

1. **Set Environment Variables**:
   ```bash
   export GOOGLE_CLOUD_PROJECT_ID="your-project-id"
   export GOOGLE_PLACE_ID="your_business_place_id"  
   export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
   ```

2. **Run Deployment Script**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   The script will:
   - Enable required Google Cloud APIs
   - Create/update the API key secret
   - Deploy the service to Cloud Run
   - Display the service URL

### Option 2: Manual Deployment

1. **Enable APIs**:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

2. **Create API Key Secret**:
   ```bash
   echo -n "YOUR_GOOGLE_PLACES_API_KEY" | gcloud secrets create google-api-key --data-file=-
   ```

3. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy google-reviews-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "GOOGLE_PLACE_ID=your_place_id,ALLOWED_ORIGINS=https://yourdomain.com" \
     --set-secrets "GOOGLE_API_KEY=google-api-key:latest"
   ```

## Post-Deployment

1. **Get Service URL**:
   ```bash
   gcloud run services describe google-reviews-api --region=us-central1 --format='value(status.url)'
   ```

2. **Test the Deployment**:
   ```bash
   curl https://YOUR_SERVICE_URL/health
   curl https://YOUR_SERVICE_URL/api/google-reviews
   ```

3. **Update Frontend Configuration**:
   Update your website's Google Reviews component:
   ```html
   <google-reviews 
     data-api-url="https://YOUR_SERVICE_URL/api/google-reviews"
     data-max-reviews="10"
     data-reviews-per-page="5"
   ></google-reviews>
   ```

## GitHub Repository Setup

Since GitHub CLI is not available in this environment, please manually:

1. **Create GitHub Repository**:
   - Go to GitHub.com
   - Create a new repository named "google-reviews-plugin"
   - Copy the repository URL

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/google-reviews-plugin.git
   git branch -M main
   git push -u origin main
   ```

## Configuration Options

### Environment Variables
- `GOOGLE_API_KEY`: Your Google Places API key (stored as secret)
- `GOOGLE_PLACE_ID`: Your business place ID from Google
- `ALLOWED_ORIGINS`: Comma-separated list of allowed domains
- `PORT`: Server port (default: 8080, automatically set by Cloud Run)

### Frontend Options
- `data-api-url`: Your Cloud Run service endpoint
- `data-max-reviews`: Maximum reviews to display (default: 10)
- `data-reviews-per-page`: Reviews per carousel page (default: 5)
- `data-star-color`: Star rating color (default: #FFC107)
- `data-autoplay`: Enable auto-scrolling (default: true)

## Troubleshooting

### Common Issues

1. **"Missing configuration" Error**:
   - Verify GOOGLE_API_KEY secret exists
   - Check GOOGLE_PLACE_ID environment variable

2. **CORS Errors**:
   - Update ALLOWED_ORIGINS to include your domain
   - Ensure protocol (https/http) matches

3. **No Reviews Showing**:
   - Verify Google Places API is enabled
   - Check if your business has reviews on Google
   - Test API endpoint directly: `curl YOUR_SERVICE_URL/api/google-reviews`

### Logs and Monitoring

```bash
# View logs
gcloud run services logs read google-reviews-api --region=us-central1

# Monitor performance
gcloud run services describe google-reviews-api --region=us-central1
```

## Security Notes

- API keys are stored in Google Secret Manager
- Environment variables don't contain sensitive data
- CORS is configured to restrict access to specified domains
- No user data is stored or logged

## Cost Optimization

- Service scales to zero when not in use
- Memory limit set to 512Mi (adjust if needed)
- CPU allocation: 1 vCPU (adjust based on traffic)
- Max instances: 10 (adjust based on expected load)