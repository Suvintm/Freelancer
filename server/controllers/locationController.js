import asyncHandler from "express-async-handler";
import EditorLocation from "../models/EditorLocation.js";
import User from "../models/User.js";
import { Profile } from "../models/Profile.js";
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
      // ✅ Use GeoJSON format: {type: "Point", coordinates: [lng, lat]}
      location.location.approxCoordinates = {
        type: "Point",
        coordinates: [roundedCoords.lng, roundedCoords.lat], // [longitude, latitude]
      };

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
          // ✅ Use GeoJSON format
          approxCoordinates: {
            type: "Point",
            coordinates: [roundedCoords.lng, roundedCoords.lat],
          },
        },
        visibility: {
          enabled: visibility?.enabled || false,
          level: visibility?.level || "city",
        },
      });
    }

    console.log("✅ Location saved successfully");
    
    // ✅ DEBUG: Log what was saved to database
    console.log("📝 Saved location details:", {
      userId: location.userId,
      city: location.location.city,
      state: location.location.state,
      coordinates: location.location.approxCoordinates,
      visibility: location.visibility,
    });

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

  console.log("🔍 Nearby editors query:", {
    userLocation: { lat: userLat, lng: userLng },
    searchRadius: `${searchRadius}km (${searchRadius * 1000}m)`,
    query: JSON.stringify(query, null, 2),
  });

  // First get locations with just user ID
  const locations = await EditorLocation.find(query).populate({
    path: "userId",
    select: "name profilePicture suvixScore availability isVerified",
  });

  console.log(`📍 Found ${locations.length} location records from database`);
  
  if (locations.length === 0) {
    console.warn("⚠️ No editors found! Checking all editor locations in database...");
    const allEditors = await EditorLocation.find({});
    console.log(`Total editors in database: ${allEditors.length}`);
    allEditors.forEach((ed, idx) => {
      console.log(`Editor ${idx + 1}:`, {
        visibility: ed.visibility,
        coordinates: ed.location?.approxCoordinates,
        city: ed.location?.city,
      });
    });
  }

  // Get user IDs for profile and user lookup
  const userIds = locations
    .filter((loc) => loc.userId)
    .map((loc) => loc.userId._id);

  // Fetch profiles for all these users
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user skills ratingStats");
  
  // ✅ Also fetch Users directly to get profilePicture (populate might not include it)
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id name profilePicture isVerified suvixScore availability");
  
  // Create maps for quick lookup
  const profileMap = {};
  profiles.forEach((profile) => {
    profileMap[profile.user.toString()] = profile;
  });

  const userMap = {};
  users.forEach((user) => {
    userMap[user._id.toString()] = user;
  });


  // Build editor list with combined data
  let editors = locations
    .filter((loc) => loc.userId)
    .map((loc) => {
      const populatedUser = loc.userId;
      const profile = profileMap[populatedUser._id.toString()] || {};
      // ✅ Use direct user query result to get profilePicture
      const directUser = userMap[populatedUser._id.toString()] || {};
      
      // ✅ Extract coordinates from GeoJSON format
      const [editorLng, editorLat] = loc.location.approxCoordinates.coordinates;
      
      const distance = calculateDistance(
        { lat: userLat, lng: userLng },
        { lat: editorLat, lng: editorLng }
      );

      // 🔍 DEBUG: Log profile picture from both sources
      console.log(`📸 Editor ${populatedUser.name}:`, {
        populatedProfilePic: populatedUser.profilePicture,
        directProfilePic: directUser.profilePicture,
        userId: populatedUser._id,
      });

      // Use direct query result as it's more reliable
      const profilePicture = directUser.profilePicture || populatedUser.profilePicture || null;

      return {
        _id: populatedUser._id,
        name: populatedUser.name,
        profilePicture: profilePicture,
        skills: profile.skills || [],
        suvixScore: directUser.suvixScore?.total || 0,
        availability: directUser.availability?.status || "unknown",
        rating: profile.ratingStats?.averageRating || 0,
        isVerified: directUser.isVerified || false,
        approxLocation: {
          city: loc.location.city,
          state: loc.location.state,
          distance: parseFloat(distance.toFixed(1)),
          lat: editorLat,
          lng: editorLng,
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
