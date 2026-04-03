import React from 'react';
import DocumentVerification from '../components/DocumentVerification';

/**
 * Document Verification Test Page
 * Standalone page for testing AI document verification
 */
const DocumentVerificationTest = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            🤖 RentIt AI Document Verification
          </h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
            Test our AI-powered document verification system
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          <DocumentVerification />
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #dee2e6'
        }}>
          <p style={{ margin: 0, color: '#6c757d' }}>
            This is a test page for the AI Document Verification system
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
            Documents are processed securely and results are stored in your account
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentVerificationTest;
