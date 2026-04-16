import React from 'react';
import { formatVerificationStatus, getStatusDescription, getStatusProgress } from '../services/enhancedDocumentService';

/**
 * Document Status Display Component
 * Shows AI verification status with progress and details
 */
const DocumentStatusDisplay = ({ documentStatus, documentType, uploadProgress }) => {
  // If no document status and no upload in progress, show nothing
  if (!documentStatus && uploadProgress === 0) {
    return null;
  }

  // If upload is in progress, show upload status
  if (uploadProgress > 0 && uploadProgress < 100) {
    return (
      <div className="document-status-container">
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          <span className="progress-text">
            {uploadProgress <= 25 ? '📤 Uploading...' : '⏳ Verifying document...'} {uploadProgress}%
          </span>
        </div>
      </div>
    );
  }

  // If we have document status, show verification status
  if (documentStatus) {
    const status = formatVerificationStatus(documentStatus.status, documentStatus.createdAt);
    const progress = getStatusProgress(documentStatus.status);
    const description = getStatusDescription(documentStatus.status, documentStatus.reason);

    return (
      <div className="document-status-container">
        <div 
          className="verification-status"
          style={{
            backgroundColor: status.bgColor,
            color: status.color,
            border: `1px solid ${status.color}20`,
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px'
          }}
        >
          <div className="status-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-icon" style={{ fontSize: '16px' }}>
              {status.icon}
            </span>
            <span className="status-text" style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {status.text}
            </span>
          </div>
          
          {documentStatus.reason && (
            <div className="status-reason" style={{ 
              fontSize: '12px', 
              marginTop: '4px',
              opacity: 0.8,
              lineHeight: '1.3'
            }}>
              {description}
            </div>
          )}

          {/* Progress bar for visual feedback */}
          <div className="status-progress" style={{ marginTop: '8px' }}>
            <div 
              className="progress-bar" 
              style={{ 
                width: `${progress}%`,
                backgroundColor: status.color,
                height: '4px',
                borderRadius: '2px'
              }}
            ></div>
          </div>

          {/* Timestamp for completed verification */}
          {documentStatus.verifiedAt && (
            <div className="status-timestamp" style={{ 
              fontSize: '11px', 
              marginTop: '6px',
              opacity: 0.6
            }}>
              Verified: {new Date(documentStatus.verifiedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default DocumentStatusDisplay;
