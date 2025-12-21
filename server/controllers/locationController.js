import asyncHandler from "express-async-handler";
import EditorLocation from "../models/EditorLocation.js";
import User from "../models/User.js";
import {
  roundCoordinates,
  calculateDistance,
  isValidCoordinates,
  geocodeCity,
} from "../utils/geoUtils.js";

// @desc    Update editor location settings
// @route   PATCH /api/location/settings
// @access  Private (Editor only)
export const updateLocationSettings = asyncHandler(async (req, res) => {
  const { city, state, country, visibility, coordinates } = req.body;
  const userId = req.user._id;

  console.log("📍 Location update request:", { city, state, country, visibility, coordinates, userId });

  // Verify user is an editor
  if (req.user.role !== "editor") {
    res.status(403);
    throw new Error("Only editors can set location visibility");
  }

  // Validate required fields
  if (!city || !state) {
    res.status(400);
    throw new Error("City and state are required");
  }

  let coords = coordinates;

  // If coordinates not provided, try to geocode city
  if (!coords || !coords.lat || !coords.lng) {
    console.log(`🗺️ Attempting to geocode: ${city}, ${state}`);
    coords = geocodeCity(city, state);
    
    // If geocoding fails, use default coordinates (center of India)
    if (!coords) {
      console.warn(`⚠️ Could not geocode ${city}. Using default coordinates.`);
      // Use approximate center coordinates - users can update later
      coords = { lat: 20.5937, lng: 78.9629 }; // Center of India
    } else {
      console.log(`✅ Geocoded to:`, coords);
    }
  }

  // Validate coordinates
  if (!isValidCoordinates(coords.lat, coords.lng)) {
    res.status(400);
    throw new Error("Invalid coordinates");
  }

  // Round coordinates for privacy (2 decimal places = ~1.1km accuracy)
  const roundedCoords = roundCoordinates(coords.lat, coords.lng, 2);

  console.log(`🔒 Rounded coordinates:`, roundedCoords);

  try {
    // Find or create location record
    let location = await EditorLocation.findOne({ userId });

    if (location) {
      // Update existing
      console.log("📝 Updating existing location record");
      location.location.city = city;
      location.location.state = state;
      location.location.country = country || "India";
      location.location.approxCoordinates = roundedCoords;

      if (visibility !== undefined) {
        location.visibility.enabled = visibility.enabled ?? location.visibility.enabled;
        location.visibility.level = visibility.level || location.visibility.level;
      }

      await location.save();
    } else {
      // Create new
      console.log("✨ Creating new location record");
      location = await EditorLocation.create({
        userId,
        location: {
          city,
          state,
          country: country || "India",
          approxCoordinates: roundedCoords,
        },
        visibility: {
          enabled: visibility?.enabled || false,
          level: visibility?.level || "city",
        },
      });
    }

    console.log("✅ Location saved successfully");

    res.status(200).json({
      success: true,
      message: "Location settings updated successfully",
      location: {
        city: location.location.city,
        state: location.location.state,
        country: location.location.country,
        visibility: location.visibility,
        // Don't send exact coordinates to frontend
        approxRegion: `${location.location.city}, ${location.location.state}`,
      },
    });
  } catch (error) {
    console.error("❌ Error saving location:", error);
    throw error;
  }
});

// @desc    Get editor location settings
// @route   GET /api/location/settings
// @access  Private (Editor only)
export const getLocationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const location = await EditorLocation.findOne({ userId });

  if (!location) {
    return res.status(200).json({
      success: true,
      location: null,
      message: "No location settings found",
    });
  }

  res.status(200).json({
    success: true,
    location: {
      city: location.location.city,
      state: location.location.state,
      country: location.location.country,
      visibility: location.visibility,
      approxRegion: `${location.location.city}, ${location.location.state}`,
    },
  });
});

// @desc    Get nearby editors
// @route   GET /api/location/nearby
// @access  Private (Client only)
export const getNearbyEditors = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 25, skills, minRating, availability } = req.query;

  // Validate coordinates
  if (!lat || !lng) {
    res.status(400);
    throw new Error("Latitude and longitude are required");
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  if (!isValidCoordinates(userLat, userLng)) {
    res.status(400);
    throw new Error("Invalid coordinates");
  }

  const searchRadius = Math.min(parseInt(radius) || 25, 100); // Cap at 100km

  // Find nearby editors using geospatial query
  let query = {
    "visibility.enabled": true,
    "location.approxCoordinates": {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [userLng, userLat], // [lng, lat] order for GeoJSON
        },
        $maxDistance: searchRadius * 1000, // Convert km to meters
      },
    },
  };

  const locations = await EditorLocation.find(query).populate({
    path: "userId",
    select: "name profilePhoto suvixScore availability rating completedOrders skills badges",
  });

  // Filter out invalid/deleted users and apply additional filters
  let editors = locations
    .filter((loc) => loc.userId) // Has valid user
    .map((loc) => {
      const user = loc.userId;
      const distance = calculateDistance(
        { lat: userLat, lng: userLng },
        {
          lat: loc.location.approxCoordinates.lat,
          lng: loc.location.approxCoordinates.lng,
        }
      );

      return {
        _id: user._id,
        name: user.name,
        profilePhoto: user.profilePhoto,
        skills: user.skills || [],
        suvixScore: user.suvixScore || 0,
        availability: user.availability || "unknown",
        rating: user.rating || 0,
        completedOrders: user.completedOrders || 0,
        badges: user.badges || [],
        approxLocation: {
          city: loc.location.city,
          state: loc.location.state,
          distance: parseFloat(distance.toFixed(1)), // km, rounded to 1 decimal
        },
      };
    });

  // Apply skill filter
  if (skills) {
    const skillsArray = skills.split(",").map((s) => s.trim().toLowerCase());
    editors = editors.filter((editor) =>
      editor.skills.some((skill) => skillsArray.includes(skill.toLowerCase()))
    );
  }

  // Apply rating filter
  if (minRating) {
    const minRatingNum = parseFloat(minRating);
    editors = editors.filter((editor) => editor.rating >= minRatingNum);
  }

  // Apply availability filter
  if (availability === "true" || availability === true) {
    editors = editors.filter((editor) => editor.availability === "available");
  }

  // Sort by distance (already sorted by MongoDB, but just to be sure)
  editors.sort((a, b) => a.approxLocation.distance - b.approxLocation.distance);

  // Log access for audit
  console.log(
    `📍 Location search: user=${req.user._id}, coords=[${userLat},${userLng}], radius=${searchRadius}km, found=${editors.length}`
  );

  res.status(200).json({
    success: true,
    count: editors.length,
    searchParams: {
      userLocation: { lat: userLat, lng: userLng },
      radius: searchRadius,
      filters: { skills, minRating, availability },
    },
    editors,
  });
});

// @desc    Log location access consent

// @route   POST /api/location/consent
// @access  Private
export const logLocationConsent = asyncHandler(async (req, res) => {
  const { consentGiven, userLocation } = req.body;

  // Simple logging (you can create a ConsentLog model if needed)
  console.log(
    `🔐 Location consent: user=${req.user._id}, consent=${consentGiven}, location=${JSON.stringify(userLocation)}`
  );

  res.status(200).json({
    success: true,
    message: "Consent logged",
    consentGiven,
    consentDate: new Date(),
  });
});

// @desc    Delete editor location (opt-out completely)
// @route   DELETE /api/location/settings
// @access  Private (Editor only)
export const deleteLocationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await EditorLocation.findOneAndDelete({ userId });

  if (!result) {
    res.status(404);
    throw new Error("No location settings found to delete");
  }

  res.status(200).json({
    success: true,
    message: "Location settings deleted successfully",
  });
});
