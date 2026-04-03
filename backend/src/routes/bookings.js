// backend/src/routes/bookings.js

const express = require("express");
const { verifyTokenMiddleware } = require("../middleware/auth");
const { requireRole } = require("../middleware/roleBasedAccess");
const { validate, schemas } = require("../middleware/validation");

module.exports = ({ admin, db }) => {
  const router = express.Router();

  /* ================= CREATE BOOKING ================= */
  // POST /api/bookings
  router.post("/", verifyTokenMiddleware, requireRole('tenant'), async (req, res) => {
    try {
      const tenantId = req.auth.uid;
      const {
        propertyId,
        agreementType,
        rentAmount,
        securityDeposit,
        // Additional optional fields
        leaseDuration = 12,
        moveInDate = null
      } = req.body;

      console.log(`Tenant ${tenantId} creating booking for property ${propertyId}`);

      // Validate required fields
      if (!propertyId || !agreementType || !rentAmount) {
        return res.status(400).json({
          message: "Missing required fields: propertyId, agreementType, rentAmount"
        });
      }

      // Get property document
      const propertyRef = db.collection("properties").doc(propertyId);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      const property = propertySnap.data();

      // Check if property is available for rent
      const bookableStatuses = ['ACTIVE', 'active', 'approved', 'available', 'Available'];
      if (!bookableStatuses.includes(property.status)) {
        return res.status(400).json({
          message: 'Property is not available for rent',
          currentStatus: property.status
        });
      }

      // Check if booking already exists for this tenant and property
      const existingBooking = await db.collection("bookings")
        .where("propertyId", "==", propertyId)
        .where("tenantId", "==", tenantId)
        .where("status", "in", ["pending_payment", "pending", "confirmed", "active"])
        .get();
      
      if (!existingBooking.empty) {
        // Log existing booking details
        const existingBookingData = existingBooking.docs[0].data();
        console.log(`Existing booking found - tenantId: ${tenantId}, propertyId: ${propertyId}, status: ${existingBookingData.status}`);
        
        return res.status(400).json({ 
          message: "Booking already exists for this property" 
        });
      }

      // Create booking document
      const booking = {
        propertyId,
        tenantId,
        ownerId: property.owner_uid,
        agreementType,
        rentAmount: Number(rentAmount),
        securityDeposit: Number(securityDeposit || rentAmount * 2),
        leaseDuration: Number(leaseDuration),
        moveInDate,
        status: 'pending_payment',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const bookingRef = await db.collection("bookings").add(booking);
      const bookingId = bookingRef.id;

      console.log(`Booking created with ID: ${bookingId}`);

      // Create notification for property owner
      await db.collection("notifications").add({
        userId: property.owner_uid,
        type: 'new_booking',
        title: 'New Booking Request',
        message: `New booking request received for ${property.title}`,
        bookingId: bookingId,
        propertyId: propertyId,
        tenantId: tenantId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({
        message: "Booking created successfully",
        bookingId: bookingId,
        status: "pending_payment",
        propertyId: propertyId,
        nextStep: "payment"
      });

    } catch (err) {
      console.error("Create booking error:", err);
      return res.status(500).json({
        message: "Failed to create booking",
        error: err.message,
      });
    }
  });

  /* ================= GET BOOKING BY ID ================= */
  // GET /api/bookings/:id
  router.get("/:id", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.uid;

      const bookingRef = db.collection("bookings").doc(id);
      const bookingSnap = await bookingRef.get();
      
      if (!bookingSnap.exists) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = {
        id: bookingSnap.id,
        ...bookingSnap.data()
      };

      // Authorization check: only tenant or owner can view booking
      if (booking.tenantId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get property details
      const propertyRef = db.collection("properties").doc(booking.propertyId);
      const propertySnap = await propertyRef.get();
      
      if (propertySnap.exists) {
        booking.property = {
          id: propertySnap.id,
          title: propertySnap.data().title,
          address: propertySnap.data().address,
          type: propertySnap.data().type
        };
      }

      return res.json(booking);

    } catch (err) {
      console.error("Get booking error:", err);
      return res.status(500).json({
        message: "Failed to fetch booking",
        error: err.message,
      });
    }
  });

  /* ================= UPDATE BOOKING STATUS ================= */
  // PUT /api/bookings/:id/status
  router.put("/:id/status", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.auth.uid;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses = ['pending_payment', 'paid', 'confirmed', 'active', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status. Must be one of: " + validStatuses.join(', ')
        });
      }

      const bookingRef = db.collection("bookings").doc(id);
      const bookingSnap = await bookingRef.get();
      
      if (!bookingSnap.exists) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingSnap.data();

      // Authorization check
      if (booking.tenantId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update booking status
      await bookingRef.update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Property status should only change when deposit is paid, not when booking is confirmed

      // If booking is cancelled, make property available again
      if (status === 'cancelled') {
        await db.collection('properties').doc(booking.propertyId).update({
          status: 'approved',  // was 'ACTIVE' — Firestore rules only accept 'approved'
          bookedBy: null,
          bookedAt: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Create notification for the other party
      const notifyUserId = booking.tenantId === userId ? booking.ownerId : booking.tenantId;
      await db.collection("notifications").add({
        userId: notifyUserId,
        type: 'booking_status_update',
        title: 'Booking Status Updated',
        message: `Booking status changed to ${status}`,
        bookingId: id,
        propertyId: booking.propertyId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({
        message: "Booking status updated successfully",
        bookingId: id,
        status: status
      });

    } catch (err) {
      console.error("Update booking status error:", err);
      return res.status(500).json({
        message: "Failed to update booking status",
        error: err.message,
      });
    }
  });

  /* ================= GET TENANT BOOKINGS ================= */
  // GET /api/bookings/tenant/:tenantId
  router.get("/tenant/:tenantId", verifyTokenMiddleware, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const userId = req.auth.uid;

      console.log(`Fetching bookings for tenant: ${tenantId}`);
      console.log(`Request user ID: ${userId}`);

      // Authorization check: only the tenant can view their bookings
      if (tenantId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Helper function for safe timestamp conversion
      const safeDate = (timestamp) => {
        if (!timestamp) return null;
        if (typeof timestamp.toDate === "function") {
          return timestamp.toDate();
        }
        return timestamp;
      };

      const bookingsSnapshot = await db.collection("bookings")
        .where("tenantId", "==", tenantId)
        .orderBy("createdAt", "desc")
        .get();

      console.log(`Found ${bookingsSnapshot.size} bookings for tenant ${tenantId}`);

      const bookings = [];
      for (const doc of bookingsSnapshot.docs) {
        const bookingData = doc.data();
        
        // Convert Firestore timestamps to JavaScript dates safely
        const booking = {
          id: doc.id,
          ...bookingData,
          createdAt: safeDate(bookingData.createdAt),
          updatedAt: safeDate(bookingData.updatedAt),
          approvedAt: safeDate(bookingData.approvedAt)
        };

        // Fetch property details for each booking
        if (booking.propertyId) {
          const propertyRef = db.collection("properties").doc(booking.propertyId);
          const propertySnap = await propertyRef.get();
          
          if (propertySnap.exists) {
            booking.propertySnapshot = propertySnap.data();
          }
        }

        bookings.push(booking);
      }

      console.log('Returning bookings:', bookings);
      return res.json(bookings);

    } catch (err) {
      console.error("Get tenant bookings error:", err);
      return res.status(500).json({
        message: "Failed to fetch tenant bookings",
        error: err.message,
      });
    }
  });

  /* ================= GET OWNER BOOKINGS ================= */
  // GET /api/bookings/owner/:ownerId
  router.get("/owner/:ownerId", verifyTokenMiddleware, async (req, res) => {
    try {
      const { ownerId } = req.params;
      const userId = req.auth.uid;

      // Authorization check: only the owner can view their bookings
      if (ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingsSnapshot = await db.collection("bookings")
        .where("ownerId", "==", ownerId)
        .orderBy("createdAt", "desc")
        .get();

      const bookings = [];
      
      for (const doc of bookingsSnapshot.docs) {
        const booking = {
          id: doc.id,
          ...doc.data()
        };

        // Get property details
        const propertyRef = db.collection("properties").doc(booking.propertyId);
        const propertySnap = await propertyRef.get();
        
        if (propertySnap.exists) {
          booking.property = {
            id: propertySnap.id,
            title: propertySnap.data().title,
            address: propertySnap.data().address,
            type: propertySnap.data().type,
            images: propertySnap.data().images || []
          };
        }

        bookings.push(booking);
      }

      return res.json(bookings);

    } catch (err) {
      console.error("Get owner bookings error:", err);
      return res.status(500).json({
        message: "Failed to fetch owner bookings",
        error: err.message,
      });
    }
  });

  /* ================= APPROVE RENTAL REQUEST ================= */
  // PUT /api/bookings/:id/approve
  router.put("/:id/approve", verifyTokenMiddleware, requireRole('owner'), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.auth.uid;

      const bookingRef = db.collection("bookings").doc(id);
      const bookingSnap = await bookingRef.get();
      
      if (!bookingSnap.exists) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingSnap.data();

      // Authorization check: only the property owner can approve
      if (booking.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied. Only property owner can approve rental requests." });
      }

      // Check if booking is in a status that can be approved
      if (booking.status !== 'pending') {
        return res.status(400).json({ 
          message: "Cannot approve booking in current status: " + booking.status 
        });
      }

      // Update booking status to approved_by_owner with timestamp
      await bookingRef.update({
        status: 'approved_by_owner',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Verify the update was applied
      const updatedBookingSnap = await bookingRef.get();
      const updatedBooking = updatedBookingSnap.data();
      console.log(`✅ Booking ${id} status updated to: ${updatedBooking.status}`);
      console.log(`✅ Booking ${id} approvedAt timestamp: ${updatedBooking.approvedAt}`);

      // Create notification for tenant
      await db.collection("notifications").add({
        userId: booking.tenantId,
        type: "rental_approved",
        bookingId: id,
        message: "Your rental request has been approved.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false
      });

      console.log(`Booking ${id} approved by owner ${userId} for tenant ${booking.tenantId}`);

      return res.json({
        message: "Rental request approved successfully",
        bookingId: id,
        status: "approved_by_owner"
      });

    } catch (err) {
      console.error("Approve rental request error:", err);
      return res.status(500).json({
        message: "Failed to approve rental request",
        error: err.message,
      });
    }
  });

  /* ================= CANCEL BOOKING ================= */
  // PUT /api/bookings/:bookingId/cancel
  router.put("/:bookingId/cancel", verifyTokenMiddleware, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const userId = req.auth.uid;

      console.log(`Cancelling booking: ${bookingId} by user: ${userId}`);

      // Get the booking
      const bookingRef = db.collection("bookings").doc(bookingId);
      const bookingSnap = await bookingRef.get();

      if (!bookingSnap.exists) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingSnap.data();

      // Authorization check: only tenant or owner can cancel booking
      if (booking.tenantId !== userId && booking.ownerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Only allow cancellation of pending, pending_payment, or confirmed bookings
      if (!["pending", "pending_payment", "confirmed"].includes(booking.status)) {
        return res.status(400).json({ 
          message: "Cannot cancel booking in current status: " + booking.status 
        });
      }

      // Update booking status to cancelled
      await bookingRef.update({
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancelledBy: userId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update property status back to available
      await db.collection("properties").doc(booking.propertyId).update({
        status: 'ACTIVE',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Booking ${bookingId} cancelled successfully`);

      return res.json({
        success: true,
        message: "Booking cancelled successfully"
      });

    } catch (err) {
      console.error("Cancel booking error:", err);
      return res.status(500).json({
        message: "Failed to cancel booking",
        error: err.message,
      });
    }
  });

  return router;
};
