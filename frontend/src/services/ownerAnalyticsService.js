// Owner Analytics Service
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

// Get owner analytics data
export const getOwnerAnalytics = async (timeRange = '30days') => {
  try {
    console.log("Fetching owner analytics for time range:", timeRange);
    const response = await apiCall(`/api/owner/analytics?timeRange=${timeRange}`);
    console.log("Owner analytics fetched successfully:", response);
    return response;
  } catch (error) {
    console.error('Get owner analytics error:', error);
    
    // Return empty analytics data structure for development
    return {
      revenueOverview: {
        totalRevenue: 0,
        monthlyGrowth: 0,
        yearlyGrowth: 0,
        averageRent: 0
      },
      propertyPerformance: [],
      occupancyMetrics: {
        occupancyRate: 0,
        totalProperties: 0,
        occupiedProperties: 0,
        vacantProperties: 0
      },
      tenantAnalytics: {
        totalTenants: 0,
        newTenantsThisMonth: 0,
        averageTenancyDuration: 0,
        tenantSatisfactionScore: 0
      },
      marketInsights: {
        averageMarketRent: 0,
        competitiveProperties: 0,
        demandScore: 0
      }
    };
  }
};

// Generate financial report
export const generateFinancialReport = async (timeRange, format = 'pdf') => {
  try {
    const response = await apiCall(`/api/owner/reports/financial?timeRange=${timeRange}&format=${format}`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Generate financial report error:', error);
    throw error;
  }
};

// Generate tenant report
export const generateTenantReport = async (timeRange, format = 'pdf') => {
  try {
    const response = await apiCall(`/api/owner/reports/tenants?timeRange=${timeRange}&format=${format}`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Generate tenant report error:', error);
    throw error;
  }
};

// Generate property performance report
export const generatePropertyReport = async (propertyId, timeRange, format = 'pdf') => {
  try {
    const response = await apiCall(`/api/owner/reports/property/${propertyId}?timeRange=${timeRange}&format=${format}`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Generate property report error:', error);
    throw error;
  }
};

// Get market insights
export const getMarketInsights = async (location) => {
  try {
    const response = await apiCall(`/api/owner/market-insights?location=${encodeURIComponent(location)}`);
    return response;
  } catch (error) {
    console.error('Get market insights error:', error);
    throw error;
  }
};
