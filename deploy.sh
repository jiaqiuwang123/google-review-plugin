#!/bin/bash

# Google Cloud Run Deployment Script for Google Reviews Plugin
# Make sure you have gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID:-"your-project-id"}
SERVICE_NAME="google-reviews-api"
REGION="us-central1"
GOOGLE_API_KEY_SECRET="google-api-key"
GOOGLE_PLACE_ID=${GOOGLE_PLACE_ID:-"your_place_id_here"}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-"https://yourdomain.com"}

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if required environment variables are set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo "❌ Please set GOOGLE_CLOUD_PROJECT_ID environment variable"
    exit 1
fi

if [ "$GOOGLE_PLACE_ID" = "your_place_id_here" ]; then
    echo "❌ Please set GOOGLE_PLACE_ID environment variable"
    exit 1
fi

# Set the project
echo "📋 Setting Google Cloud project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Check if the secret exists, create if it doesn't
echo "🔐 Checking Google API Key secret..."
if ! gcloud secrets describe $GOOGLE_API_KEY_SECRET --quiet 2>/dev/null; then
    echo "Creating secret: $GOOGLE_API_KEY_SECRET"
    echo "Please enter your Google Places API Key:"
    read -s api_key
    echo -n "$api_key" | gcloud secrets create $GOOGLE_API_KEY_SECRET --data-file=-
else
    echo "Secret $GOOGLE_API_KEY_SECRET already exists"
fi

# Deploy to Cloud Run
echo "🐳 Deploying to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "GOOGLE_PLACE_ID=$GOOGLE_PLACE_ID,ALLOWED_ORIGINS=$ALLOWED_ORIGINS" \
    --set-secrets "GOOGLE_API_KEY=$GOOGLE_API_KEY_SECRET:latest" \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔗 API Endpoint: $SERVICE_URL/api/google-reviews"
echo "💚 Health Check: $SERVICE_URL/health"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend component's data-api-url to: $SERVICE_URL/api/google-reviews"
echo "2. Test your deployment by visiting: $SERVICE_URL/health"
echo "3. Configure your domain's CORS settings if needed"