// backend/src/routes/properties.js

const express = require("express");
const { verifyTokenMiddleware } = require('../middleware/auth');
const { getOwnerId, setOwnerId, standardizeStatus, isPropertyAvailable } = require('../utils/dataStandardization');

module.exports = ({ admin, db }) => {
  const router = express.Router();

  /* ================= GET ALL PROPERTIES ================= */
  // GET /api/properties
  router.get("/", async (req, res) => {
    try {
      const propertiesRef = db.collection("properties");
      const snapshot = await propertiesRef.where("status", "==", "approved").get();
      
      if (snapshot.empty) {
        return res.json([]);
      }

      const properties = [];
      snapshot.forEach(doc => {
        const propertyData = doc.data();
        properties.push({
          id: doc.id,
          ...propertyData,
          // Ensure consistent field names
          rent: propertyData.rent || propertyData.rentPerPerson || 0,
          address: propertyData.address || propertyData.location || '',
          status: propertyData.status || 'ACTIVE',
          // Include images/media for frontend
          images: propertyData.images || propertyData.media || []
        });
      });

      return res.json(properties);
    } catch (err) {
      console.error("GET properties error:", err);
      return res.status(500).json({
        message: "Failed to fetch properties",
        error: err.message,
      });
    }
  });

  /* ================= GET PROPERTY BY ID ================= */
  // GET /api/properties/:id
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const propertyRef = db.collection("properties").doc(id);
      const snapshot = await propertyRef.get();
      
      if (!snapshot.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      const propertyData = snapshot.data();
      
      // Increment view count
      await propertyRef.update({
        viewCount: (propertyData.viewCount || 0) + 1,
        lastViewedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({
        id: snapshot.id,
        ...propertyData,
        // Ensure consistent field names
        rent: propertyData.rent || propertyData.rentPerPerson || 0,
        address: propertyData.address || propertyData.location || '',
        status: propertyData.status || 'ACTIVE',
        // Include images/media for frontend
        images: propertyData.images || propertyData.media || []
      });
    } catch (err) {
      console.error("GET property by ID error:", err);
      return res.status(500).json({
        message: "Failed to fetch property",
        error: err.message,
      });
    }
  });

  /* ================= GET PROPERTY MEDIA ================= */
  // GET /api/properties/:id/media
  router.get("/:id/media", async (req, res) => {
    try {
      const { id } = req.params;
      
      const propertyRef = db.collection("properties").doc(id);
      const snapshot = await propertyRef.get();
      
      if (!snapshot.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      const propertyData = snapshot.data();
      
      // Return media/images if they exist in the property document
      const media = propertyData.images || propertyData.media || [];
      
      return res.json({
        propertyId: id,
        media: media,
        count: media.length
      });
    } catch (err) {
      console.error("GET property media error:", err);
      return res.status(500).json({
        message: "Failed to fetch property media",
        error: err.message,
      });
    }
  });

  /* ================= UPLOAD PROPERTY PHOTOS ================= */
  // POST /api/properties/:id/photos
  router.post("/:id/photos", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const owner_uid = req.auth.uid;
      const { photos } = req.body;
      
      console.log(`User ${owner_uid} uploading photos for property ${id}`);
      console.log("Received photos data:", photos);
      console.log("Photos type:", typeof photos);
      console.log("Photos is array:", Array.isArray(photos));
      console.log("Photos length:", photos ? photos.length : 'N/A');
      
      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ 
          message: "No photos provided" 
        });
      }
      
      // Validate photo data
      const validPhotos = photos.filter(photo => 
        photo && (photo.url || photo.data) && photo.type
      );
      
      console.log("Valid photos after filtering:", validPhotos);
      console.log("Valid photos count:", validPhotos.length);
      
      if (validPhotos.length === 0) {
        return res.status(400).json({ 
          message: "No valid photos provided" 
        });
      }
      
      // Get property to verify ownership
      const propertyRef = db.collection("properties").doc(id);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const property = propertySnap.data();
      
      // Verify ownership using helper (supports both ownerId and owner_uid)
      if (getOwnerId(property) !== owner_uid) {
        return res.status(403).json({ 
          message: "Only property owner can upload photos" 
        });
      }
      
      // Update property with photos
      console.log("Updating property with images:", validPhotos);
      await propertyRef.update({
        images: validPhotos,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Property ${id} updated with ${validPhotos.length} images successfully`);
      
      return res.json({
        message: "Photos uploaded successfully",
        photos: validPhotos,
        count: validPhotos.length
      });
      
    } catch (err) {
      console.error("Upload photos error:", err);
      return res.status(500).json({
        message: "Failed to upload photos",
        error: err.message,
      });
    }
  });

  /* ================= CREATE PROPERTY MEDIA ================= */
  // POST /api/properties/:id/media
  router.post("/:id/media", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const owner_uid = req.auth.uid;
      const mediaData = req.body;
      
      // Get property to verify ownership
      const propertyRef = db.collection("properties").doc(id);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const property = propertySnap.data();
      
      // Verify ownership using helper (supports both ownerId and owner_uid)
      if (getOwnerId(property) !== owner_uid) {
        return res.status(403).json({ 
          message: "Only property owner can add media" 
        });
      }
      
      // Add new media to existing images
      const existingImages = property.images || [];
      const updatedImages = [...existingImages, ...mediaData];
      
      await propertyRef.update({
        images: updatedImages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        message: "Media added successfully",
        media: updatedImages,
        count: updatedImages.length
      });
      
    } catch (err) {
      console.error("Create property media error:", err);
      return res.status(500).json({
        message: "Failed to create property media",
        error: err.message,
      });
    }
  });

  /* ================= UPDATE PROPERTY MEDIA ================= */
  // PUT /api/properties/:id/media
  router.put("/:id/media", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const owner_uid = req.auth.uid;
      const mediaData = req.body;
      
      // Get property to verify ownership
      const propertyRef = db.collection("properties").doc(id);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const property = propertySnap.data();
      
      // Verify ownership using helper (supports both ownerId and owner_uid)
      if (getOwnerId(property) !== owner_uid) {
        return res.status(403).json({ 
          message: "Only property owner can update media" 
        });
      }
      
      // Update property images
      await propertyRef.update({
        images: mediaData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        message: "Media updated successfully",
        media: mediaData,
        count: mediaData.length
      });
      
    } catch (err) {
      console.error("Update property media error:", err);
      return res.status(500).json({
        message: "Failed to update property media",
        error: err.message,
      });
    }
  });

  /* ================= ADD PROPERTY (OWNER) ================= */
  // POST /api/properties
  router.post("/", verifyTokenMiddleware, async (req, res) => {
    try {
      const owner_uid = req.auth.uid;

      const { 
        title, 
        address, 
        rent, 
        rentPerPerson,
        description, 
        amenities, 
        type,
        pgGender,
        securityDeposit,
        availableDate,
        leaseDuration,
        maintenanceCharge,
        parkingCharge,
        preferredTenants,
        bedrooms,
        bathrooms,
        toilets,
        balconies,
        squareFootage,
        furnishing,
        propertyAge,
        floors,
        floorNumber,
        nearbyPlaces,
        landmark
      } = req.body;

      // Enhanced validation
      if (!title || !address || !description) {
        return res.status(400).json({
          message: "Missing required fields: title, address, description",
        });
      }

      // Validate rent based on property type
      if (type !== "pg" && !rent) {
        return res.status(400).json({
          message: "Monthly rent is required for non-PG properties",
        });
      }

      if (type === "pg" && !rentPerPerson) {
        return res.status(400).json({
          message: "Rent per person is required for PG properties",
        });
      }

      // Validate address structure
      if (!address.line || !address.city || !address.state || !address.pincode) {
        return res.status(400).json({
          message: "Complete address is required (line, city, state, pincode)",
        });
      }

      const propertyDoc = {
        ...setOwnerId({}, owner_uid), // Use helper to set both ownerId and owner_uid
        title,
        address: {
          line: address.line,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          landmark: landmark || ""
        },
        rent: type === "pg" ? null : Number(rent),
        rentPerPerson: type === "pg" ? Number(rentPerPerson) : null,
        securityDeposit: Number(securityDeposit) || 0,
        availableDate: availableDate || "",
        leaseDuration: leaseDuration || "",
        maintenanceCharge: Number(maintenanceCharge) || 0,
        parkingCharge: Number(parkingCharge) || 0,
        preferredTenants: preferredTenants || "",
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        toilets: Number(toilets) || 0,
        balconies: Number(balconies) || 0,
        squareFootage: Number(squareFootage) || 0,
        furnishing: furnishing || "",
        propertyAge: Number(propertyAge) || 0,
        floors: Number(floors) || 0,
        floorNumber: Number(floorNumber) || 0,
        description: description || "",
        amenities: amenities || [],
        nearbyPlaces: nearbyPlaces || [],
        type: type || "apartment",
        pgGender: type === "pg" ? pgGender : null,

        // Standardize status value
        status: standardizeStatus("approved"),
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        
        // Additional metadata
        viewCount: 0,
        inquiryCount: 0,
        images: [], // Will be populated when photos are uploaded
        media: [], // For future video support
      };

      const propertiesRef = db.collection("properties");
      const newProperty = await propertiesRef.add(propertyDoc);

      console.log(`Property created successfully: ${newProperty.id} by owner: ${owner_uid}`);

      return res.status(201).json({
        success: true,
        message: "Property created successfully",
        propertyId: newProperty.id,
        status: "approved",
        property: {
          id: newProperty.id,
          ...propertyDoc
        }
      });
    } catch (err) {
      console.error("properties POST error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error creating property",
        error: err.message,
      });
    }
  });

  /* ================= DELETE PROPERTY ================= */
  // DELETE /api/properties/:id
  router.delete("/:id", verifyTokenMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const owner_uid = req.auth.uid;
      
      console.log(`User ${owner_uid} attempting to delete property ${id}`);
      
      // Get property to verify ownership
      const propertyRef = db.collection("properties").doc(id);
      const propertySnap = await propertyRef.get();
      
      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const property = propertySnap.data();
      
      // Verify ownership using helper (supports both ownerId and owner_uid)
      if (getOwnerId(property) !== owner_uid) {
        return res.status(403).json({ 
          message: "Only property owner can delete property" 
        });
      }
      
      // Delete the property
      await propertyRef.delete();
      
      console.log(`Property ${id} deleted successfully by owner ${owner_uid}`);
      
      return res.json({
        success: true,
        message: "Property deleted successfully"
      });
      
    } catch (err) {
      console.error("Delete property error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete property",
        error: err.message,
      });
    }
  });

  /* ================= ADMIN: APPROVE PROPERTY ================= */
  // POST /api/properties/approve/:propertyId
  router.post("/approve/:propertyId", verifyTokenMiddleware, async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      const adminSecret = req.headers['x-admin-secret'];
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: 'Admin access denied' });
      }

      const propertyRef = db.collection("properties").doc(propertyId);
      const propertySnap = await propertyRef.get();

      if (!propertySnap.exists) {
        return res.status(404).json({ message: "Property not found" });
      }

      await propertyRef.update({
        status: standardizeStatus("approved"),
        approved_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({
        message: "Property approved successfully",
        propertyId,
      });
    } catch (err) {
      console.error("approve property error:", err);
      return res.status(500).json({
        message: "Failed to approve property",
        error: err.message,
      });
    }
  });

  return router;
};
