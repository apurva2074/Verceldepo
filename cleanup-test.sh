#!/bin/bash

echo "🗑️ CLEANING UP TEST BOOKING..."

BACKEND_URL="http://localhost:5000"

# Try to delete the test booking
RESPONSE=$(curl -s -X DELETE "$BACKEND_URL/api/test/delete-booking/test-booking-1772089790" \
  -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo "✅ Test booking deleted successfully!"
else
    echo "⚠️ Could not auto-delete test booking"
    echo "   Please manually delete: test-booking-1772089790"
fi

echo "🧪 CLEANUP COMPLETE!"
