const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const { verifyTokenMiddleware } = require('../middleware/auth');

// Razorpay integration
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
console.log("🔍 RAZORPAY DEBUG: Key ID from env:", process.env.RAZORPAY_KEY_ID);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
// Create Razorpay order for payment
router.post('/create-order', verifyTokenMiddleware, async (req, res) => {
  try {
    console.log('🔍 RAZORPAY DEBUG: Creating order for user:', req.auth?.uid);
    
    const { bookingId } = req.body;
    const userId = req.auth.uid;

    console.log('🔍 RAZORPAY DEBUG: Request data:', { bookingId, userId });

    // Validate required fields
    if (!bookingId) {
      console.log('🔍 RAZORPAY DEBUG: Missing booking ID');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Fetch booking from Firestore
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      console.log('🔍 RAZORPAY DEBUG: Booking not found:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookingDoc.data();
    console.log('🔍 RAZORPAY DEBUG: Found booking:', { 
      id: bookingId, 
      status: booking.status, 
      tenantId: booking.tenantId 
    });

    // Ensure booking is in correct status
    if (booking.status !== "pending_payment") {
      console.log('🔍 RAZORPAY DEBUG: Invalid booking status:', booking.status);
      return res.status(400).json({
        success: false,
        message: `Booking is ${booking.status}. Payment is not required.`
      });
    }

    // Ensure only tenant can pay
    if (req.auth.uid !== booking.tenantId) {
      console.log('🔍 RAZORPAY DEBUG: Access denied. Tenant:', booking.tenantId, 'User:', req.auth.uid);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only pay for your own bookings.'
      });
    }

    // Calculate amount - only charge security deposit for initial payment
    const amount = booking.proposedDeposit || booking.propertyDetails?.securityDeposit || 0;
    
    if (amount <= 0) {
      console.log('🔍 RAZORPAY DEBUG: Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    console.log('🔍 RAZORPAY DEBUG: Creating order for security deposit amount:', amount);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        tenantId: booking.tenantId,
        ownerId: booking.ownerId,
        propertyId: booking.propertyId
      }
    });

    console.log('🔍 RAZORPAY DEBUG: Order created successfully:', order.id);

    return res.json({
      success: true,
      orderId: order.id,
      amount: amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('🚨 RAZORPAY ERROR: Failed to create order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// POST /api/payments/verify
// Verify Razorpay payment and update booking status
router.post('/verify', verifyTokenMiddleware, async (req, res) => {
  try {
    console.log('🔍 RAZORPAY DEBUG: Verifying payment for user:', req.auth?.uid);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    console.log('🔍 RAZORPAY DEBUG: Payment verification data:', {
      razorpay_order_id,
      razorpay_payment_id,
      bookingId
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      console.log('🔍 RAZORPAY DEBUG: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Fetch booking to get details
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      console.log('🔍 RAZORPAY DEBUG: Booking not found:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookingDoc.data();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    console.log('🔍 RAZORPAY DEBUG: Signature verification:', {
      body,
      expectedSignature,
      receivedSignature: razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.log('🔍 RAZORPAY DEBUG: Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Signature is valid - store payment and update booking
    console.log('🔍 RAZORPAY DEBUG: Storing security deposit payment:', amount);

    // Use security deposit amount for payment record
    const amount = booking.proposedDeposit || booking.propertyDetails?.securityDeposit || 0;

    // Store payment in Firestore
    const paymentData = {
      bookingId,
      tenantId: booking.tenantId,
      ownerId: booking.ownerId,
      propertyId: booking.propertyId,
      razorpay_order_id,
      razorpay_payment_id,
      amount,
      currency: "INR",
      status: "completed",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('payments').add(paymentData);
    console.log('🔍 RAZORPAY DEBUG: Payment stored:', paymentData);

    // Update booking status to confirmed
    await db.collection('bookings').doc(bookingId).update({
      status: 'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('🔍 RAZORPAY DEBUG: Booking updated to confirmed');

    // Update property availability to rented
    await db.collection('properties').doc(booking.propertyId).update({
      status: 'rented',
      rentedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('🔍 RAZORPAY DEBUG: Property updated to rented');

    // Update agreement status to confirmed
    const agreementQuery = await db.collection('agreements')
      .where('bookingId', '==', bookingId)
      .get();

    if (!agreementQuery.empty) {
      const agreementDoc = agreementQuery.docs[0];
      await agreementDoc.ref.update({
        status: 'confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('🔍 RAZORPAY DEBUG: Agreement updated to confirmed');
    }

    // Create notification for owner
    await db.collection('notifications').add({
      userId: booking.ownerId,
      type: 'payment_completed',
      title: 'Payment Completed',
      message: `Payment received for booking ${bookingId}`,
      bookingId: bookingId,
      propertyId: booking.propertyId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      bookingId: bookingId,
      paymentId: razorpay_payment_id,
      amount: amount
    });

  } catch (error) {
    console.error('🚨 RAZORPAY ERROR: Failed to verify payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

module.exports = router;
