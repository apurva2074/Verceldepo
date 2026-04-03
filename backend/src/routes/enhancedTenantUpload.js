const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { admin } = require('firebase-admin');
const db = admin.firestore();
const { verifyTokenMiddleware } = require('../middleware/auth');
const DocumentVerificationService = require('../services/documentVerificationService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/tenant-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.round(Math.random() * 1E9)}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
    }
  }
});

// Initialize document verification service
const verificationService = new DocumentVerificationService();

/**
 * POST /api/tenant/upload-document-enhanced
 * Enhanced document upload with AI verification status tracking
 */
router.post('/upload-document-enhanced', verifyTokenMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const { documentType } = req.body;
    const userId = req.auth.uid;
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log('🔍 ENHANCED UPLOAD: Processing document for user:', userId);
    console.log('🔍 ENHANCED UPLOAD: Document type:', documentType);
    console.log('🔍 ENHANCED UPLOAD: File:', originalName);

    // STEP 1: Store initial document record with "uploaded" status
    const documentRecord = {
      userId: userId,
      documentType: documentType,
      fileName: originalName,
      filePath: filePath,
      documentUrl: `/uploads/tenant-documents/${req.file.filename}`,
      status: 'uploaded',
      reason: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fileSize: req.file.size,
      mimeType: req.file.mimeType
    };

    const docRef = await db.collection('documents').add(documentRecord);
    console.log('🔍 ENHANCED UPLOAD: Stored initial record with ID:', docRef.id);

    // STEP 2: Update status to "verifying" before AI call
    await docRef.update({
      status: 'verifying',
      reason: 'AI verification in progress...'
    });

    console.log('🔍 ENHANCED UPLOAD: Status updated to "verifying"');

    // STEP 3: Trigger AI verification asynchronously (non-blocking)
    const triggerVerification = async () => {
      try {
        console.log('🔍 AI VERIFICATION: Starting for document:', docRef.id);
        
        // Verify document using AI service
        const verificationResult = await verificationService.verifyDocument(filePath);
        
        console.log('🔍 AI VERIFICATION: Result:', verificationResult);

        // STEP 4: Update status based on AI result
        let finalStatus = 'needs_review';
        let finalReason = verificationResult.message || 'Document processed';

        if (verificationResult.status === 'Approved') {
          finalStatus = 'approved';
        } else if (verificationResult.status === 'Rejected') {
          finalStatus = 'rejected';
        } else if (verificationResult.status === 'Needs Review') {
          finalStatus = 'needs_review';
        }

        await docRef.update({
          status: finalStatus,
          reason: finalReason,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('🔍 AI VERIFICATION: Final status updated:', finalStatus);

        // Also update the tenant's document record in their profile
        await updateTenantDocumentRecord(userId, documentType, {
          documentUrl: documentRecord.documentUrl,
          verificationStatus: finalStatus,
          verificationReason: finalReason,
          verifiedAt: new Date()
        });

      } catch (verificationError) {
        console.error('🚨 AI VERIFICATION ERROR:', verificationError);
        
        // Update status to verification failed
        await docRef.update({
          status: 'verification_failed',
          reason: verificationError.message || 'AI verification failed',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    };

    // Start verification without blocking the response
    triggerVerification();

    // Clean up temp file after verification is queued
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error('🔍 ENHANCED UPLOAD: Cleanup error:', cleanupError);
      }
    }, 5000); // Give AI service time to process

    res.json({
      success: true,
      documentId: docRef.id,
      documentUrl: documentRecord.documentUrl,
      status: 'verifying',
      message: 'Document uploaded successfully. AI verification in progress...',
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 ENHANCED UPLOAD ERROR:', error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('🚨 ENHANCED UPLOAD: Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Document upload failed'
    });
  }
});

/**
 * GET /api/tenant/documents-status
 * Get user's documents with verification status
 */
router.get('/documents-status', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.auth.uid;

    const documentsSnapshot = await db.collection('documents')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const documents = documentsSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      verifiedAt: doc.data().verifiedAt?.toDate()
    }));

    res.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('🚨 DOCUMENTS STATUS ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch documents status'
    });
  }
});

/**
 * Helper function to update tenant's document record
 */
async function updateTenantDocumentRecord(userId, documentType, verificationData) {
  try {
    const tenantRef = db.collection('tenants').doc(userId);
    const tenantDoc = await tenantRef.get();

    if (tenantDoc.exists) {
      const updateData = {};
      updateData[`${documentType}VerificationStatus`] = verificationData.verificationStatus;
      updateData[`${documentType}VerificationReason`] = verificationData.verificationReason;
      updateData[`${documentType}VerifiedAt`] = verificationData.verifiedAt;

      await tenantRef.update(updateData);
      console.log('🔍 TENANT RECORD: Updated verification status for', documentType);
    }
  } catch (error) {
    console.error('🚨 TENANT RECORD UPDATE ERROR:', error);
  }
}

module.exports = router;
