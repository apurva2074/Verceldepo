// Property status constants for consistency across the application

export const PROPERTY_STATUS = {
  ACTIVE: 'ACTIVE',
  RENTED: 'RENTED',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  DISABLED: 'DISABLED'
};

export const RENTAL_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const RENTAL_AGREEMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'expired',
  TERMINATED: 'terminated'
};

// Helper function to validate property status
export const isValidPropertyStatus = (status) => {
  return Object.values(PROPERTY_STATUS).includes(status);
};

// Helper function to validate rental request status
export const isValidRentalRequestStatus = (status) => {
  return Object.values(RENTAL_REQUEST_STATUS).includes(status);
};

// Helper function to check if property is available for rent
export const isPropertyAvailableForRent = (status) => {
  if (!status) return false;
  const normalizedStatus = status.toString().trim().toUpperCase();
  return normalizedStatus === PROPERTY_STATUS.ACTIVE || 
         normalizedStatus === 'AVAILABLE' || 
         normalizedStatus === 'APPROVED';
};

// Helper function to check if property is rented
export const isPropertyRented = (status) => {
  return status === PROPERTY_STATUS.RENTED;
};
