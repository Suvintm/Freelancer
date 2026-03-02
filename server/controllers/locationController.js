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

// @desc    Update editor location settings (Verified Static Presence)
// @route   PATCH /api/location/settings
// @access  Private (Editor only)
export const updateLocationSettings = asyncHandler(async (req, res) => {
  const { coordinates, accuracy, serviceRadius } = req.body;
  const userId = req.user._id;

  // 1. Verify user is an editor
  if (req.user.role !== "editor") {
    res.status(403);
    throw new Error("Only editors can set work location");
  }

  // 2. Anti-Spam Guard: 30-minute cooldown
  const user = await User.findById(userId);
  const now = new Date();
  if (user.locationUpdatedAt && (now - user.locationUpdatedAt) < 30 * 60 * 1000) {
    res.status(429);
    throw new Error("Location can only be updated once every 30 minutes");
  }

  // 3. Accuracy Guard: Reject > 500m
  if (!accuracy || accuracy > 500) {
    res.status(400);
    throw new Error("GPS accuracy too low. Please ensure you are in an open area.");
  }

  // 4. Validate Coordinates
  if (!coordinates || !isValidCoordinates(coordinates.lat, coordinates.lng)) {
    res.status(400);
    throw new Error("Invalid GPS coordinates");
  }

  // 5. Update User Record
  user.location = {
    type: "Point",
    coordinates: [coordinates.lng, coordinates.lat],
  };
  user.locationAccuracy = accuracy;
  user.locationUpdatedAt = now;
  if (serviceRadius) user.serviceRadius = Math.min(Math.max(serviceRadius, 5), 400);

  await user.save();

  res.status(200).json({
    success: true,
    message: "Work location verified and updated",
    data: {
      locationUpdatedAt: user.locationUpdatedAt,
      serviceRadius: user.serviceRadius,
    },
  });
});

// @desc    Toggle editor map visibility (persisted to DB)
// @route   PATCH /api/location/visibility
// @access  Private (Editor only)
export const toggleVisibility = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const userId = req.user._id;

  if (req.user.role !== "editor") {
    res.status(403);
    throw new Error("Only editors can toggle map visibility");
  }

  if (typeof isAvailable !== "boolean") {
    res.status(400);
    throw new Error("isAvailable must be a boolean");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isAvailable },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    message: isAvailable ? "You are now live on the map!" : "You have gone offline from the map.",
    isAvailable: user.isAvailable,
  });
});

// @desc    Update editor service radius only (no GPS cooldown)
// @route   PATCH /api/location/radius
// @access  Private (Editor only)
export const updateServiceRadius = asyncHandler(async (req, res) => {
  const { serviceRadius } = req.body;
  const userId = req.user._id;

  if (req.user.role !== "editor") {
    res.status(403);
    throw new Error("Only editors can update service radius");
  }

  if (!serviceRadius || typeof serviceRadius !== "number") {
    res.status(400);
    throw new Error("serviceRadius must be a valid number");
  }

  const clampedRadius = Math.min(Math.max(serviceRadius, 5), 400);

  const user = await User.findByIdAndUpdate(
    userId,
    { serviceRadius: clampedRadius },
    { new: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    message: `Discovery reach updated to ${clampedRadius}km`,
    serviceRadius: user.serviceRadius,
  });
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

// @desc    Get nearby editors (5-Tier Ranking Engine)
// @route   GET /api/location/nearby
// @access  Private (Client only)
export const getNearbyEditors = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 25, skills } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error("Search coordinates are required");
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  // 1. Setup Freshness & Search Constraints
  // Auto-Fade Logic: Only show editors active within last 7 days
  const freshnessLimit = new Date();
  freshnessLimit.setDate(freshnessLimit.getDate() - 7);

  const searchRadiusInMeters = (parseInt(radius) || 25) * 1000;

  // 2. Build Aggregation Pipeline
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [userLng, userLat] },
        distanceField: "distance",
        maxDistance: searchRadiusInMeters,
        query: {
          role: "editor",
          isAvailable: true, // Only show editors who are marked as available
          locationUpdatedAt: { $gte: freshnessLimit }
        },
        spherical: true
      }
    },
    // 3. Join with Profile to get skills and ratings
    {
      $lookup: {
        from: "profiles",
        localField: "_id",
        foreignField: "user",
        as: "profile"
      }
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    // 4. Project & Calculate Combined Relevance Score
    {
      $addFields: {
        // Score = (Distance Weight 40%) + (Rating Weight 25%) + (Suvix Score Weight 35%)
        // Normalized Distance (closer is better)
        distScore: {
          $subtract: [100, { $multiply: [{ $divide: ["$distance", searchRadiusInMeters] }, 100] }]
        },
        relevanceScore: {
          $add: [
            { $multiply: ["$distScore", 0.4] },
            { $multiply: [{ $ifNull: ["$suvixScore.total", 0] }, 0.6] } // Switched to SUVIX score primarily
          ]
        },
        // Privacy Offset (Client-side usually, but we sanitize here)
        isOnline: "$isAvailable",
        skills: { $ifNull: ["$profile.skills", []] },
        ratingStats: "$profile.ratingStats"
      }
    },
    // 5. Sort by Relevance
    { $sort: { relevanceScore: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id: 1,
        name: 1,
        profilePicture: 1,
        location: 1,
        distance: 1,
        relevanceScore: 1,
        isAvailable: 1,
        suvixScore: 1,
        skills: 1,
        ratingStats: 1
      }
    }
  ];

  const editors = await User.aggregate(pipeline);

  // 6. Cold-Start Fallback: If < 3 editors, expand or show remote
  if (editors.length < 3) {
    // TBD: Logic for remote editors expansion
  }

  // 7. Map to Privacy-Safe Output
  const safeEditors = editors.map(editor => {
    // Inject privacy offset of ±150m (approx 0.0015 degrees)
    const offsetLat = (Math.random() - 0.5) * 0.003;
    const offsetLng = (Math.random() - 0.5) * 0.003;
    
    const actualLat = editor.location?.coordinates[1] || userLat;
    const actualLng = editor.location?.coordinates[0] || userLng;

    return {
      _id: editor._id,
      name: editor.name,
      profilePicture: editor.profilePicture,
      relevanceScore: Math.round(editor.relevanceScore),
      distance: (editor.distance / 1000).toFixed(1),
      isOnline: editor.isOnline,
      approxLocation: {
        lat: actualLat + offsetLat,
        lng: actualLng + offsetLng
      },
      skills: editor.skills || [],
      ratingStats: editor.ratingStats || { averageRating: 0, totalReviews: 0 }
    };
  });

  res.status(200).json({
    success: true,
    count: safeEditors.length,
    editors: safeEditors
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
