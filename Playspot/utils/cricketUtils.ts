import { EARTH_RADIUS_KM, VENUE_TYPES } from '../constants/cricketConstants';

// Helper functions for venue types
export const getVenueTypeDisplayName = (venueType: string): string => {
  const type = VENUE_TYPES.find(vt => vt.value === venueType);
  return type ? type.label : 'Unknown';
};

export const getVenueTypeIcon = (venueType: string): string => {
  const type = VENUE_TYPES.find(vt => vt.value === venueType);
  return type ? type.icon : 'help-outline';
};

// Distance calculation using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c; // Distance in kilometers
  return distance;
};

// Helper function to extract city from address
export const extractCityFromAddress = (address: string, cities: string[]): string => {
  if (!address) return '';

  // Try to match with known Pakistani cities
  const foundCity = cities.find(city =>
    address.toLowerCase().includes(city.toLowerCase())
  );

  if (foundCity) {
    return foundCity;
  }

  // Fallback: extract the last part of address as city
  const addressParts = address.split(',');
  if (addressParts.length > 1) {
    return addressParts[addressParts.length - 1].trim();
  }

  return '';
};

// Helper function to combine amenities arrays
export const combineAmenities = (groundAmenities: string[], predefinedAmenities: string[]): string[] => {
  const amenitiesSet = new Set<string>([...predefinedAmenities, ...groundAmenities]);
  return Array.from(amenitiesSet).sort();
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  return `Rs ${price}`;
};

// Helper function to format rating
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

// Helper function to get user display name
export const getUserDisplayName = (user: any): string => {
  return user?.displayName || user?.email?.split('@')[0] || 'Player';
};
