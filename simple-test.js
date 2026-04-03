// Simple test script using backend API
const fetch = require('node-fetch');

const TEST_CONFIG = {
  backendUrl: 'http://localhost:5000',
  ownerEmail: 'manejyoti17@gmail.com',
  testBookingId: null
};

async function createTestBooking() {
  console.log("🧪 CREATING TEST BOOKING VIA API...");
  
  try {
    const testBookingData = {
      ownerId: "UzHHwEdDXFdaO7D7zDFwjU8NCgn2",
      tenantId: "test-tenant-id",
      propertyId: "test-property-id", 
      status: "pending",
      proposedRent: 12000,
      proposedDeposit: 40000,
      agreementType: "builtin",
      tenantDetails: {
        fullName: "Test Tenant",
        email: "test@example.com",
        moveInDate: "2026-03-01",
        leaseDuration: "12"
      },
      propertyDetails: {
        title: "Test Property for Workflow",
        rent: 12000,
        securityDeposit: 40000,
        address: "Test Address"
      }
    };

    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/rentals/create-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBookingData)
    });

    if (response.ok) {
      const result = await response.json();
      TEST_CONFIG.testBookingId = result.bookingId || result.id;
      
      console.log("✅ TEST BOOKING CREATED:");
      console.log("- ID:", TEST_CONFIG.testBookingId);
      console.log("- Status:", testBookingData.status);
      console.log("- Owner ID:", testBookingData.ownerId);
      console.log("- Response:", result);
      
      return TEST_CONFIG.testBookingId;
    } else {
      const error = await response.text();
      console.error("❌ FAILED TO CREATE TEST BOOKING:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ FAILED TO CREATE TEST BOOKING:", error);
    return null;
  }
}

async function deleteTestBooking(bookingId) {
  console.log("🗑️ DELETING TEST BOOKING...");
  
  try {
    // Try to delete via Firestore REST API
    const response = await fetch(`${TEST_CONFIG.backendUrl}/api/test/delete-booking/${bookingId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log("✅ TEST BOOKING DELETED:", bookingId);
      return true;
    } else {
      console.log("⚠️ Could not auto-delete. Please manually delete booking:", bookingId);
      return false;
    }
  } catch (error) {
    console.error("❌ FAILED TO DELETE TEST BOOKING:", error);
    return false;
  }
}

async function runTest() {
  console.log("🚀 STARTING RENT AGREEMENT WORKFLOW TEST");
  console.log("=" .repeat(50));
  
  try {
    // Step 1: Create test booking
    const bookingId = await createTestBooking();
    
    if (!bookingId) {
      console.log("❌ TEST FAILED - Could not create test booking");
      process.exit(1);
    }
    
    console.log("\n🎯 TEST INSTRUCTIONS:");
    console.log("1. Open Owner Dashboard → Rental Requests tab");
    console.log("2. You should see 'Test Property for Workflow' with status 'pending'");
    console.log("3. Click 'Accept' - should change status to 'pending_signature'");
    console.log("4. Check Tenant Dashboard - should show 'Generate Agreement' button");
    console.log("5. After testing, this script will auto-delete the test booking");
    
    // Wait for testing
    console.log("\n⏰ Waiting 60 seconds for testing...");
    console.log("   Test booking ID:", bookingId);
    
    setTimeout(async () => {
      await deleteTestBooking(bookingId);
      console.log("🧪 TEST COMPLETED");
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  }
}

// Run the test
runTest();
