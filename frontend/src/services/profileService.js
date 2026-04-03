// frontend/src/services/profileService.js
import { getAuthToken } from "../utils/authToken";

// Generic API call function with authentication
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`, config);
    
    if (!response.ok) {
    const errorText = await response.text();
    console.error('Profile API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      url: `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`,
      headers: config.headers,
      body: errorText
    });
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'API call failed' };
    }
    
    console.error('Profile API Parsed Error:', errorData);
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      url: `${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}${endpoint}`
    });
    throw error;
  }
};

// Get current user profile
export const getUserProfile = async () => {
  try {
    console.log("Fetching user profile...");
    const response = await apiCall('/api/users/profile');
    console.log("User profile fetched successfully:", response);
    return response;
  } catch (error) {
    console.error('Get user profile error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    console.log("Updating user profile:", profileData);
    const response = await apiCall('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    console.log("User profile updated successfully:", response);
    return response;
  } catch (error) {
    console.error('Update user profile error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      profileData: profileData
    });
    throw error;
  }
};

// Update profile picture
export const updateProfilePicture = async (profilePictureUrl) => {
  try {
    console.log("Updating profile picture...");
    const response = await apiCall('/api/users/profile/picture', {
      method: 'POST',
      body: JSON.stringify({ profilePicture: profilePictureUrl })
    });
    console.log("Profile picture updated successfully:", response);
    return response;
  } catch (error) {
    console.error('Update profile picture error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      profilePictureUrl: profilePictureUrl
    });
    throw error;
  }
};

// Get user profile by ID (public profile)
export const getUserProfileById = async (userId) => {
  try {
    console.log("Fetching user profile by ID:", userId);
    const response = await apiCall(`/api/users/${userId}`);
    console.log("User profile by ID fetched successfully:", response);
    return response;
  } catch (error) {
    console.error('Get user profile by ID error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      userId: userId
    });
    throw error;
  }
};
