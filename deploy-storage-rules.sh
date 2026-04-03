#!/bin/bash

echo "🔧 Deploying Firebase Storage Rules..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Deploy storage rules only
echo "📤 Deploying storage.rules to Firebase..."
firebase deploy --only storage

echo "✅ Firebase Storage Rules deployed successfully!"
echo ""
echo "🔍 Storage Rules Summary:"
echo "- Users can upload to: properties/{userId}/{propertyId}/**"
echo "- Public read access for all authenticated users"
echo "- Write/delete access only for property owners"
echo "- User profile images: users/{userId}/**"
echo ""
echo "🚀 Now test the Add Property form with image uploads!"
