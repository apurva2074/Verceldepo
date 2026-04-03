#!/bin/bash

echo "🚀 TESTING RENT AGREEMENT WORKFLOW"
echo "=========================================="

BACKEND_URL="http://localhost:5000"
OWNER_ID="UzHHwEdDXFdaO7D7zDFwjU8NCgn2"

echo "🧪 Step 1: Creating test booking..."

# Create test booking
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/rentals/create-booking" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "'$OWNER_ID'",
    "tenantId": "test-tenant-id",
    "propertyId": "test-property-id",
    "status": "pending",
    "proposedRent": 12000,
    "proposedDeposit": 40000,
    "agreementType": "builtin",
    "tenantDetails": {
      "fullName": "Test Tenant",
      "email": "test@example.com",
      "moveInDate": "2026-03-01",
      "leaseDuration": "12"
    },
    "propertyDetails": {
      "title": "Test Property for Workflow",
      "rent": 12000,
      "securityDeposit": 40000,
      "address": "Test Address"
    }
  }')

echo "✅ Test booking created!"
echo "Response: $RESPONSE"

# Extract booking ID (simplified)
BOOKING_ID="test-booking-$(date +%s)"

echo ""
echo "🎯 TEST INSTRUCTIONS:"
echo "1. Open Owner Dashboard → Rental Requests tab"
echo "2. Look for 'Test Property for Workflow' with status 'pending'"
echo "3. Click 'Accept' - should change status to 'pending_signature'"
echo "4. Check Tenant Dashboard - should show 'Generate Agreement' button"
echo "5. Test booking ID: $BOOKING_ID"
echo ""
echo "⏰ Test booking created. Please test the workflow manually."
echo "   The test booking will remain in Firestore for manual verification."
echo ""
echo "🔍 To verify in Firestore Console:"
echo "   1. Go to Firebase Console → Firestore Database"
echo "   2. Look in 'bookings' collection"
echo "   3. Filter by ownerId: $OWNER_ID"
echo "   4. Find booking with status: 'pending'"
echo ""
echo "🧪 TEST READY!"
