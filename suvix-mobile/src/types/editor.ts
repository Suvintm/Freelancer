export interface Editor {
  _id: string;
  name: string;
  profilePicture: string;
  distance?: number; // in km
  isOnline: boolean;
  skills: string[];
  ratingStats: {
    averageRating: number;
    totalReviews: number;
  };
  // Real location (for server-side radius calculation)
  realLocation?: {
    lat: number;
    lng: number;
  };
  // Randomized location (for the map UI)
  displayLocation: {
    lat: number;
    lng: number;
  };
}
