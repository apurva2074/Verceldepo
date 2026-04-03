// src/api/index.js - Centralized API Layer Exports
export { default as authAPI } from './auth';
export { default as propertyAPI } from './property';
export { default as bookingAPI } from './booking';
export { default as chatAPI } from './chat';
export { api, apiRequest } from './base';

// Re-export for convenience
export default {
  auth: authAPI,
  property: propertyAPI,
  booking: bookingAPI,
  chat: chatAPI,
  api,
  apiRequest,
};
