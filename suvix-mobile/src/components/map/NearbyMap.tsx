import React, { useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Editor } from '../../types/editor';

MapLibreGL.setAccessToken(null);

interface NearbyMapProps {
  userLocation: { lat: number; lng: number } | null;
  editors: Editor[];
  theme: any;
}

/**
 * STABLE OSM MAP (LEAFLET LOOK)
 * Fixed: Camera stability to prevent "Request Canceled" errors.
 */
export const NearbyMap: React.FC<NearbyMapProps> = ({ userLocation, editors, theme }) => {
  // Memoize the style so it doesn't cause re-renders
  const osmStyle = useMemo(() => ({
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap',
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  }), []);

  if (!userLocation) return null;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={JSON.stringify(osmStyle)}
        logoEnabled={false}
        attributionEnabled={false}
      >
        {/* STABLE CAMERA: Set to level 15 and locked to prevent jitter */}
        <MapLibreGL.Camera
          zoomLevel={15}
          centerCoordinate={[userLocation.lng, userLocation.lat]}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* 15KM RADIUS CIRCLE */}
        <MapLibreGL.ShapeSource
          id="radiusSource"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [userLocation.lng, userLocation.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="radiusLayer"
            style={{
              circleRadius: 120, 
              circleColor: 'rgba(0, 150, 255, 0.1)',
              circleStrokeColor: 'rgba(0, 150, 255, 0.4)',
              circleStrokeWidth: 1,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* USER LOCATION MARKER */}
        <MapLibreGL.PointAnnotation
          id="userLocation"
          coordinate={[userLocation.lng, userLocation.lat]}
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </MapLibreGL.PointAnnotation>

        {/* EDITOR MARKERS */}
        {editors.map((editor) => (
          <MapLibreGL.PointAnnotation
            key={editor._id}
            id={editor._id}
            coordinate={[editor.displayLocation.lng, editor.displayLocation.lat]}
          >
            <View style={styles.editorMarker}>
              <Image 
                source={{ uri: editor.profilePicture || 'https://via.placeholder.com/100' }} 
                style={styles.editorImage}
              />
              {editor.isOnline && <View style={styles.onlineBadge} />}
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
  },
  editorMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
});
