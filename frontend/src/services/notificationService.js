// Notification Service
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

// Get owner notifications
export const getOwnerNotifications = async () => {
  try {
    console.log("Fetching owner notifications...");
    const response = await apiCall('/api/owner/notifications');
    console.log("Owner notifications fetched successfully:", response);
    return response;
  } catch (error) {
    console.error('Get owner notifications error:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiCall(`/api/owner/notifications/${notificationId}/read`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await apiCall('/api/owner/notifications/read-all', {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await apiCall(`/api/owner/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};

// Get notification settings
export const getNotificationSettings = async () => {
  try {
    const response = await apiCall('/api/owner/notification-settings');
    return response;
  } catch (error) {
    console.error('Get notification settings error:', error);
    throw error;
  }
};

// Update notification settings
export const updateNotificationSettings = async (settings) => {
  try {
    const response = await apiCall('/api/owner/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return response;
  } catch (error) {
    console.error('Update notification settings error:', error);
    throw error;
  }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (subscription) => {
  try {
    const response = await apiCall('/api/owner/push-notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });
    return response;
  } catch (error) {
    console.error('Subscribe to push notifications error:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async () => {
  try {
    const response = await apiCall('/api/owner/push-notifications/unsubscribe', {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Unsubscribe from push notifications error:', error);
    throw error;
  }
};
