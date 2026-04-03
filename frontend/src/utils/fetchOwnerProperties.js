import api from "./api";

export async function fetchOwnerProperties(uid) {
  try {
    const response = await api.get(`/api/properties/owner/${uid}`);
    
    // Ensure we always return an array
    const properties = response.data || [];
    
    // Validate that it's an array
    if (!Array.isArray(properties)) {
      console.error("Expected array from API, got:", typeof properties, properties);
      return [];
    }
    
    return properties;
  } catch (error) {
    console.error("Error fetching owner properties:", error);
    // Return empty array on error to prevent .map() issues
    return [];
  }
}
