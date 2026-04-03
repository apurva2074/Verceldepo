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
    
    // Return mock data for development
    return getMockAnalyticsData(timeRange);
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

// Mock data for development
const getMockAnalyticsData = (timeRange) => {
  const multiplier = timeRange === '7days' ? 0.3 : timeRange === '90days' ? 3 : timeRange === '1year' ? 12 : 1;
  
  return {
    revenueOverview: {
      totalRevenue: Math.round(250000 * multiplier),
      monthlyGrowth: 12.5,
      yearlyGrowth: 28.3,
      averageRent: 15000
    },
    propertyPerformance: [
      {
        id: 'prop1',
        title: '2BHK Apartment in Koramangala',
        address: 'Koramangala, Bangalore',
        revenue: Math.round(18000 * multiplier),
        occupancyRate: 95,
        views: 245
      },
      {
        id: 'prop2',
        title: '3BHK Villa in Whitefield',
        address: 'Whitefield, Bangalore',
        revenue: Math.round(35000 * multiplier),
        occupancyRate: 88,
        views: 189
      },
      {
        id: 'prop3',
        title: '1BHK Studio in Indiranagar',
        address: 'Indiranagar, Bangalore',
        revenue: Math.round(12000 * multiplier),
        occupancyRate: 92,
        views: 156
      }
    ],
    occupancyMetrics: {
      occupancyRate: 91.7,
      totalProperties: 8,
      occupiedProperties: 7,
      vacantProperties: 1
    },
    tenantAnalytics: {
      totalTenants: 7,
      newTenantsThisMonth: 2,
      averageTenancyDuration: 18,
      tenantSatisfactionScore: 4.6
    },
    marketInsights: {
      averageMarketRent: 16000,
      competitiveProperties: 124,
      demandScore: 78
    }
  };
};
