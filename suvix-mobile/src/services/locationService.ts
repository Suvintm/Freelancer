import * as Location from 'expo-location';

/**
 * PRODUCTION-GRADE LOCATION SERVICE
 * Handles device permissions, current positioning, and coordinate utilities.
 */

class LocationService {
  /**
   * Request foreground location permissions
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.error('❌ [LocationService] Permission request failed:', e);
      return false;
    }
  }

  /**
   * Get current device coordinates
   */
  public async getCurrentLocation(): Promise<Location.LocationObjectCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return location.coords;
    } catch (e) {
      console.error('❌ [LocationService] Failed to get location:', e);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers (Haversine formula)
   */
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Add a random offset to coordinates (Fuzzing)
   * approx 0.009 degrees = 1km
   */
  public fuzzCoordinate(coord: number, radiusKm: number = 2): number {
    const offset = (Math.random() - 0.5) * 2 * (radiusKm / 111); 
    return coord + offset;
  }
}

export const locationService = new LocationService();
