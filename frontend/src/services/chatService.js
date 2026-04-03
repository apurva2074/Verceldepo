// Frontend service for chat API calls
import { getAuthToken } from '../utils/authToken';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// API helper with auth
const apiCall = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      url: `${API_BASE}/api${endpoint}`,
      headers: headers,
      body: errorText
    });
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'API call failed' };
    }
    
    console.error('Chat API Parsed Error:', errorData);
    throw new Error(errorData.message || 'API call failed');
  }

  return response.json();
};

// Create or get existing chat
export const createOrGetChat = async (propertyId, ownerId) => {
  try {
    return await apiCall('/chats', {
      method: 'POST',
      body: JSON.stringify({ propertyId, ownerId }),
    });
  } catch (error) {
    console.error('Create/get chat error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      propertyId: propertyId,
      ownerId: ownerId
    });
    throw error;
  }
};

// Get user's chats
export const getUserChats = async () => {
  try {
    console.log("Fetching user chats...");
    const response = await apiCall('/chats');
    console.log("Received chats:", response);
    return response;
  } catch (error) {
    console.error('Get user chats error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get specific chat with messages
export const getChatById = async (chatId) => {
  try {
    return await apiCall(`/chats/${chatId}`);
  } catch (error) {
    console.error('Get chat by ID error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      chatId: chatId
    });
    throw error;
  }
};

// Send message
export const sendMessage = async (chatId, message) => {
  try {
    return await apiCall(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  } catch (error) {
    console.error('Send message error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      chatId: chatId,
      messageLength: message?.length
    });
    throw error;
  }
};

// Send typing indicator
export const sendTypingIndicator = async (chatId, isTyping) => {
  try {
    return await apiCall(`/chats/${chatId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ isTyping }),
    });
  } catch (error) {
    console.error('Typing indicator error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      chatId: chatId,
      isTyping: isTyping
    });
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId) => {
  try {
    return await apiCall(`/chats/${chatId}/read`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Mark as read error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      chatId: chatId
    });
    throw error;
  }
};

// Add reaction to message
export const addMessageReaction = async (chatId, messageId, emoji) => {
  try {
    return await apiCall(`/chats/${chatId}/messages/${messageId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  } catch (error) {
    console.error('Reaction error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      chatId: chatId,
      messageId: messageId,
      emoji: emoji
    });
    throw error;
  }
};
