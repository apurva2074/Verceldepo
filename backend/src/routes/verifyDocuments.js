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
    const uploadDir = path.join(__dirname, '../../uploads/documents');
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
    // Accept common document formats
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
 * POST /api/ai/verify-document
 * Verify a single document
 */
router.post('/verify-document', verifyTokenMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const userId = req.auth.uid;
    const filePath = req.file.path;
    const originalName = req.file.originalname;

    console.log('🔍 AI VERIFICATION: Processing document for user:', userId);
    console.log('🔍 AI VERIFICATION: File:', originalName);

    // Verify document using AI service
    const verificationResult = await verificationService.verifyDocument(filePath);

    console.log('🔍 AI VERIFICATION: Result:', verificationResult);

    // Store verification result in Firestore
    const documentRecord = {
      userId: userId,
      fileName: originalName,
      filePath: filePath,
      status: verificationResult.status,
      message: verificationResult.message,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };

    const docRef = await db.collection('documents').add(documentRecord);
    
    console.log('🔍 AI VERIFICATION: Stored in Firestore with ID:', docRef.id);

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('🔍 AI VERIFICATION: Cleanup error:', cleanupError);
    }

    res.json({
      success: true,
      documentId: docRef.id,
      status: verificationResult.status,
      message: verificationResult.message,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 AI VERIFICATION ERROR:', error);

    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('🚨 AI VERIFICATION: Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Document verification failed'
    });
  }
});

/**
 * POST /api/ai/verify-multiple-documents
 * Verify multiple documents
 */
router.post('/verify-multiple-documents', verifyTokenMiddleware, upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No document files provided'
      });
    }

    const userId = req.auth.uid;
    const filePaths = req.files.map(file => file.path);
    const originalNames = req.files.map(file => file.originalname);

    console.log('🔍 AI VERIFICATION: Processing multiple documents for user:', userId);
    console.log('🔍 AI VERIFICATION: Files:', originalNames);

    // Verify documents using AI service
    const verificationResults = await verificationService.verifyMultipleDocuments(filePaths);

    console.log('🔍 AI VERIFICATION: Batch results:', verificationResults);

    // Store verification results in Firestore
    const documentRecords = [];
    
    for (let i = 0; i < verificationResults.length; i++) {
      const result = verificationResults[i];
      const file = req.files[i];
      
      const documentRecord = {
        userId: userId,
        fileName: file.originalname,
        filePath: file.path,
        status: result.status,
        message: result.message,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        fileSize: file.size,
        mimeType: file.mimetype
      };

      const docRef = await db.collection('documents').add(documentRecord);
      documentRecords.push({
        documentId: docRef.id,
        fileName: file.originalname,
        ...result
      });
    }

    // Clean up uploaded files
    for (const file of req.files) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('🚨 AI VERIFICATION: Cleanup error:', cleanupError);
      }
    }

    res.json({
      success: true,
      documents: documentRecords,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 AI VERIFICATION ERROR:', error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.error('🚨 AI VERIFICATION: Cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Document verification failed'
    });
  }
});

/**
 * GET /api/ai/verification-history
 * Get user's document verification history
 */
router.get('/verification-history', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.auth.uid;

    const documentsSnapshot = await db.collection('documents')
      .where('userId', '==', userId)
      .orderBy('verifiedAt', 'desc')
      .get();

    const documents = documentsSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data(),
      verifiedAt: doc.data().verifiedAt?.toDate()
    }));

    res.json({
      success: true,
      documents: documents
    });

  } catch (error) {
    console.error('🚨 AI VERIFICATION HISTORY ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch verification history'
    });
  }
});

/**
 * DELETE /api/ai/document/:documentId
 * Delete a document record
 */
router.delete('/document/:documentId', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.auth.uid;
    const { documentId } = req.params;

    const documentRef = db.collection('documents').doc(documentId);
    const documentDoc = await documentRef.get();

    if (!documentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const documentData = documentDoc.data();

    // Check ownership
    if (documentData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete document record
    await documentRef.delete();

    // Clean up file if it exists
    if (documentData.filePath && fs.existsSync(documentData.filePath)) {
      try {
        fs.unlinkSync(documentData.filePath);
      } catch (cleanupError) {
        console.error('🚨 AI VERIFICATION: File cleanup error:', cleanupError);
      }
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('🚨 AI VERIFICATION DELETE ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document'
    });
  }
});

module.exports = router;
