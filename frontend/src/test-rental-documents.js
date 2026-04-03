// Test script to verify Rental Documents component
import React from 'react';
import { createRoot } from 'react-dom/client';
import RentalDocuments from './pages/TenantDashboard/components/RentalDocuments';

// Mock user data for testing
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com'
};

function TestApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Rental Documents Component Test</h1>
      <p>Testing Rental Documents component with mock user data...</p>
      <RentalDocuments uid={mockUser.uid} />
    </div>
  );
}

// Test the component
const root = createRoot(document.getElementById('root'));
root.render(<TestApp />);
