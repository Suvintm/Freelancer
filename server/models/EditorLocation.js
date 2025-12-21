import mongoose from "mongoose";

const editorLocationSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each editor can have only one location record
    },

    // Location details (user-entered)
    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: "India",
      },
      // Approximate coordinates in GeoJSON format (required for 2dsphere index)
      approxCoordinates: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude] order (GeoJSON standard!)
          required: true,
          validate: {
            validator: function(coords) {
              return coords.length === 2 && 
                     coords[0] >= -180 && coords[0] <= 180 && // lng
                     coords[1] >= -90 && coords[1] <= 90; // lat
            },
            message: "Invalid coordinates format [lng, lat]"
          }
        },
      },
    },

    // Visibility settings (opt-in)
    visibility: {
      enabled: {
        type: Boolean,
        default: false, // Privacy-first: default OFF
      },
      level: {
        type: String,
        enum: ["city", "region", "country"],
        default: "city",
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Auto-disable if editor inactive
    lastActiveCheck: {
      type: Date,
      default: Date.now,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Auto-manage createdAt/updatedAt
  }
);

// Geospatial index for efficient nearby queries (MUST be on GeoJSON Point)
editorLocationSchema.index({
  "location.approxCoordinates": "2dsphere",
});

// Index for visibility queries
editorLocationSchema.index({ "visibility.enabled": 1 });

// Index for user lookups
editorLocationSchema.index({ userId: 1 });

// Pre-save hook to update timestamps
editorLocationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (this.isModified("visibility")) {
    this.visibility.lastUpdated = Date.now();
  }
  next();
});

// Method to check if editor should be visible
editorLocationSchema.methods.isVisible = function () {
  return this.visibility.enabled;
};

// Static method to get nearby editors
editorLocationSchema.statics.findNearby = async function (lat, lng, radiusKm = 25) {
  // Convert km to meters for MongoDB geospatial query
  const radiusMeters = radiusKm * 1000;

  return this.find({
    "visibility.enabled": true,
    "location.approxCoordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat], // [longitude, latitude] order for GeoJSON
        },
        $maxDistance: radiusMeters,
      },
    },
  }).populate("userId", "name profilePhoto suvixScore availability rating skills");
};

const EditorLocation = mongoose.model("EditorLocation", editorLocationSchema);

export default EditorLocation;
