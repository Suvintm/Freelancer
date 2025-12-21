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
 * Geocode city name to coordinates using a simple lookup
 * (In production, use Google Maps Geocoding API)
 * @param {string} city
 * @param {string} state
 * @returns {{lat: number, lng: number} | null}
 */
export const geocodeCity = (city, state) => {
  // Simplified geocoding for major Indian cities
  const cityCoordinates = {
    "mumbai": { lat: 19.076, lng: 72.877 },
    "delhi": { lat: 28.704, lng: 77.102 },
    "bangalore": { lat: 12.971, lng: 77.594 },
    "hyderabad": { lat: 17.385, lng: 78.486 },
    "chennai": { lat: 13.082, lng: 80.270 },
    "kolkata": { lat: 22.572, lng: 88.363 },
    "pune": { lat: 18.520, lng: 73.856 },
    "ahmedabad": { lat: 23.022, lng: 72.571 },
    "jaipur": { lat: 26.912, lng: 75.787 },
    "surat": { lat: 21.170, lng: 72.831 },
  };

  const cityKey = city.toLowerCase().trim();
  return cityCoordinates[cityKey] || null;
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
