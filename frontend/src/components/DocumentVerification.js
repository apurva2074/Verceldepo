import React, { useState } from 'react';
import { verifyDocument, verifyMultipleDocuments, formatVerificationStatus, validateDocumentFile } from '../services/documentService';

/**
 * Document Verification Component
 * Provides UI for AI-powered document verification
 */
const DocumentVerification = () => {
  const [files, setFiles] = useState([]);
  const [verificationResults, setVerificationResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    const validFiles = [];
    const errors = [];

    Array.from(selectedFiles).forEach(file => {
      const validation = validateDocumentFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Verify documents
  const handleVerify = async () => {
    if (files.length === 0) {
      setError('Please select at least one document to verify');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationResults([]);

    try {
      let result;
      
      if (files.length === 1) {
        result = await verifyDocument(files[0]);
        setVerificationResults([result]);
      } else {
        result = await verifyMultipleDocuments(files);
        setVerificationResults(result.documents || []);
      }
    } catch (err) {
      setError(err.message || 'Document verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Clear all
  const handleClear = () => {
    setFiles([]);
    setVerificationResults([]);
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🆔 AI Document Verification</h2>
        <p>Upload your documents (Aadhaar, PAN, Passport, Driving License) for AI-powered verification</p>
      </div>

      {/* File Upload Area */}
      <div
        style={{
          ...styles.uploadArea,
          ...(dragActive ? styles.uploadAreaActive : {})
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div style={styles.uploadContent}>
          <div style={styles.uploadIcon}>📄</div>
          <h3>Drop documents here or click to browse</h3>
          <p>Supported formats: JPEG, PNG, PDF (Max 10MB)</p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            style={styles.fileInput}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong>
          <pre style={styles.errorText}>{error}</pre>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div style={styles.filesSection}>
          <h3>Selected Files ({files.length})</h3>
          <div style={styles.filesList}>
            {files.map((file, index) => (
              <div key={index} style={styles.fileItem}>
                <span style={styles.fileName}>📎 {file.name}</span>
                <span style={styles.fileSize}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                <button
                  onClick={() => removeFile(index)}
                  style={styles.removeButton}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {files.length > 0 && (
        <div style={styles.actionButtons}>
          <button
            onClick={handleVerify}
            disabled={loading}
            style={{
              ...styles.verifyButton,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? '🔄 Verifying...' : '🔍 Verify Documents'}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            style={{
              ...styles.clearButton,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            🗑️ Clear All
          </button>
        </div>
      )}

      {/* Verification Results */}
      {verificationResults.length > 0 && (
        <div style={styles.resultsSection}>
          <h3>Verification Results</h3>
          <div style={styles.resultsList}>
            {verificationResults.map((result, index) => {
              const status = formatVerificationStatus(result.status);
              return (
                <div key={index} style={styles.resultItem}>
                  <div style={styles.resultHeader}>
                    <span style={styles.resultFileName}>
                      📄 {result.fileName || `Document ${index + 1}`}
                    </span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: status.bgColor,
                        color: status.color
                      }}
                    >
                      {status.icon} {status.text}
                    </span>
                  </div>
                  <div style={styles.resultMessage}>
                    <strong>Message:</strong> {result.message}
                  </div>
                  {result.verifiedAt && (
                    <div style={styles.resultTimestamp}>
                      <strong>Verified:</strong> {new Date(result.verifiedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.instructions}>
        <h3>📋 Instructions</h3>
        <ul>
          <li>Upload clear, high-quality images of your documents</li>
          <li>Ensure the document is not blurry or cropped</li>
          <li>For ID cards, make sure your face is clearly visible</li>
          <li>Supported documents: Aadhaar Card, PAN Card, Passport, Driving License</li>
          <li>AI will verify authenticity and extract information</li>
        </ul>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  uploadArea: {
    border: '2px dashed #ccc',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px'
  },
  uploadAreaActive: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff'
  },
  uploadContent: {
    pointerEvents: 'none'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  fileInput: {
    display: 'none'
  },
  errorBox: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '20px'
  },
  errorText: {
    margin: '5px 0 0 0',
    whiteSpace: 'pre-wrap',
    fontSize: '14px'
  },
  filesSection: {
    marginBottom: '20px'
  },
  filesList: {
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px'
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },
  fileName: {
    flex: 1,
    fontSize: '14px'
  },
  fileSize: {
    color: '#666',
    fontSize: '12px',
    margin: '0 10px'
  },
  removeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  clearButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  resultsSection: {
    marginBottom: '20px'
  },
  resultsList: {
    border: '1px solid #ddd',
    borderRadius: '5px',
    padding: '10px'
  },
  resultItem: {
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '5px',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  resultFileName: {
    fontWeight: 'bold',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  resultMessage: {
    fontSize: '14px',
    marginBottom: '5px'
  },
  resultTimestamp: {
    fontSize: '12px',
    color: '#666'
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '5px',
    padding: '20px',
    marginTop: '30px'
  }
};

export default DocumentVerification;
