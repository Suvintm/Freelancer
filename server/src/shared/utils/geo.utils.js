import { getDistance } from "geolib";

/**
 * Round coordinates to specified decimal places for privacy
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default 2 = ~1.1km accuracy)
 * @returns {{lat: number, lng: number}}
 */
export const roundCoordinates = (lat, lng, precision = 2) => {
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {object} coord1 - {lat, lng}
 * @param {object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  const distanceMeters = getDistance(
    { latitude: coord1.lat, longitude: coord1.lng },
    { latitude: coord2.lat, longitude: coord2.lng }
  );

  // Convert meters to kilometers
  return distanceMeters / 1000;
};

/**
 * Check if a point is within radius of another point
 * @param {object} userCoord - User's coordinates {lat, lng}
 * @param {object} editorCoord - Editor's coordinates {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean}
 */
export const isWithinRadius = (userCoord, editorCoord, radiusKm) => {
  const distance = calculateDistance(userCoord, editorCoord);
  return distance <= radiusKm;
};

/**
 * Validate coordinates
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Get approximate distance label for UI
 * @param {number} distanceKm
 * @returns {string}
 */
export const getDistanceLabel = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
};

/**
 * Geocode city to approximate coordinates
 * In production, use Google Maps Geocoding API
 * For now, using hardcoded major Indian cities
 */
export const geocodeCity = (city, state) => {
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();

  // Major Indian cities with approximate coordinates (rounded to 2 decimals for privacy)
  const indianCities = {
    // Karnataka
    bangalore: { lat: 12.97, lng: 77.59 },
    bengaluru: { lat: 12.97, lng: 77.59 },
    banglore: { lat: 12.97, lng: 77.59 }, // ✅ Common typo
    mysore: { lat: 12.30, lng: 76.65 },
    mangalore: { lat: 12.91, lng: 74.86 },
    
    // Maharashtra
    mumbai: { lat: 19.08, lng: 72.88 },
    pune: { lat: 18.52, lng: 73.86 },
    nagpur: { lat: 21.15, lng: 79.08 },
    
    // Delhi NCR
    delhi: { lat: 28.70, lng: 77.10 },
    "new delhi": { lat: 28.61, lng: 77.23 },
    gurgaon: { lat: 28.46, lng: 77.03 },
    noida: { lat: 28.58, lng: 77.33 },
    
    // Tamil Nadu
    chennai: { lat: 13.08, lng: 80.27 },
    coimbatore: { lat: 11.02, lng: 76.97 },
    madurai: { lat: 9.92, lng: 78.12 },
    
    // Telangana
    hyderabad: { lat: 17.39, lng: 78.49 },
    
    // West Bengal
    kolkata: { lat: 22.57, lng: 88.36 },
    
    // Gujarat
    ahmedabad: { lat: 23.02, lng: 72.57 },
    surat: { lat: 21.17, lng: 72.83 },
    
    // Rajasthan
    jaipur: { lat: 26.91, lng: 75.79 },
    
    // Kerala
    kochi: { lat: 9.93, lng: 76.27 },
    trivandrum: { lat: 8.52, lng: 76.95 },
    
    // Uttar Pradesh
    lucknow: { lat: 26.85, lng: 80.95 },
    kanpur: { lat: 26.45, lng: 80.33 },
  };

  const coords = indianCities[cityLower];
  
  if (coords) {
    console.log(`✅ Geocoded ${city} to:`, coords);
    return coords;
  }

  console.warn(`⚠️ City ${city} not in database. Returning null.`);
  return null;
};
/**
 * Adjust visibility radius based on level
 * @param {string} level - "city" | "region" | "country"
 * @returns {number} Radius in km
 */
export const getVisibilityRadius = (level) => {
  const radiusMap = {
    city: 25, // 25km radius
    region: 100, // 100km radius
    country: 1000, // 1000km radius
  };

  return radiusMap[level] || 25;
};
