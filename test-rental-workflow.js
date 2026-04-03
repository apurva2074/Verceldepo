// Test script to create and verify rent agreement workflow
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { collection, addDoc, doc, getDoc, deleteDoc } = require("firebase/firestore");
const { db } = require("./firebase/firestore");

// Test configuration
const TEST_CONFIG = {
  ownerEmail: "manejyoti17@gmail.com",
  tenantEmail: "test@example.com", // This would be a real tenant
  propertyId: "test-property-id", // This would be a real property
  testBookingId: null
};

async function createTestBooking() {
  console.log("🧪 CREATING TEST BOOKING...");
  
  try {
    // Create a test booking with pending status
    const testBookingData = {
      ownerId: "UzHHwEdDXFdaO7D7zDFwjU8NCgn2", // Real owner ID from logs
      tenantId: "test-tenant-id",
      propertyId: "test-property-id",
      status: "pending",
      proposedRent: 12000,
      proposedDeposit: 40000,
      agreementType: "builtin",
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantDetails: {
        fullName: "Test Tenant",
        email: "test@example.com",
        moveInDate: "2026-03-01",
        leaseDuration: "12"
      },
      propertyDetails: {
        title: "Test Property",
        rent: 12000,
        securityDeposit: 40000,
        address: "Test Address"
      }
    };

    const docRef = await addDoc(collection(db, "bookings"), testBookingData);
    TEST_CONFIG.testBookingId = docRef.id;
    
    console.log("✅ TEST BOOKING CREATED:");
    console.log("- ID:", docRef.id);
    console.log("- Status:", testBookingData.status);
    console.log("- Owner ID:", testBookingData.ownerId);
    console.log("- Created at:", testBookingData.createdAt);
    
    return docRef.id;
  } catch (error) {
    console.error("❌ FAILED TO CREATE TEST BOOKING:", error);
    throw error;
  }
}

async function verifyTestBooking(bookingId) {
  console.log("🔍 VERIFYING TEST BOOKING...");
  
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (bookingSnap.exists()) {
      const bookingData = bookingSnap.data();
      console.log("✅ TEST BOOKING FOUND:");
      console.log("- ID:", bookingId);
      console.log("- Status:", bookingData.status);
      console.log("- Owner ID:", bookingData.ownerId);
      console.log("- Created:", bookingData.createdAt?.toDate?.());
      return true;
    } else {
      console.log("❌ TEST BOOKING NOT FOUND");
      return false;
    }
  } catch (error) {
    console.error("❌ FAILED TO VERIFY TEST BOOKING:", error);
    return false;
  }
}

async function deleteTestBooking(bookingId) {
  console.log("🗑️ DELETING TEST BOOKING...");
  
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
    console.log("✅ TEST BOOKING DELETED:", bookingId);
    return true;
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
    
    // Wait a moment for real-time listeners to pick up
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Verify booking exists
    const exists = await verifyTestBooking(bookingId);
    
    if (exists) {
      console.log("\n🎯 TEST INSTRUCTIONS:");
      console.log("1. Open Owner Dashboard → Rental Requests tab");
      console.log("2. You should see the test booking with status 'pending'");
      console.log("3. Click 'Accept' - should change status to 'pending_signature'");
      console.log("4. Check Tenant Dashboard - should show 'Generate Agreement' button");
      console.log("5. After testing, this script will auto-delete the test booking");
      
      // Auto-delete after 30 seconds
      console.log("\n⏰ Auto-deleting test booking in 30 seconds...");
      setTimeout(async () => {
        await deleteTestBooking(bookingId);
        console.log("🧪 TEST COMPLETED - Test booking deleted");
        process.exit(0);
      }, 30000);
      
    } else {
      console.log("❌ TEST FAILED - Booking not found");
      process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  runTest();
}

module.exports = {
  createTestBooking,
  verifyTestBooking,
  deleteTestBooking,
  runTest
};
