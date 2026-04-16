import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSocketStore } from '../store/useSocketStore';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE GLOBAL UPLOAD PROGRESS
 * Listens for Socket.io 'media:progress' events.
 * Stays sticky at the top of the screen (below navbar).
 */
export const UploadProgressBar = () => {
  const { socket, isConnected } = useSocketStore();
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleProgress = (data: { mediaId: string; progress: number }) => {
      console.log('📊 [SOCKET] Media Progress:', data.progress);
      if (!isVisible) {
        setIsVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
      setProgress(data.progress);
      
      Animated.timing(animatedWidth, {
        toValue: (data.progress / 100) * width,
        duration: 400,
        useNativeDriver: false,
      }).start();
    };

    const handleStatus = (data: { mediaId: string; status: string; type?: string; error?: string }) => {
      console.log('🏁 [SOCKET] Media Status:', data.status);
      setStatus(data.status);

      if (data.status === 'READY') {
        // Complete the bar
        Animated.timing(animatedWidth, {
          toValue: width,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          setTimeout(() => {
            hideProgress();
          }, 2000);
        });
      } else if (data.status === 'FAILED') {
        hideProgress();
      }
    };

    socket.on('media:progress', handleProgress);
    socket.on('media:status', handleStatus);

    return () => {
      socket.off('media:progress', handleProgress);
      socket.off('media:status', handleStatus);
    };
  }, [socket, isConnected, isVisible]);

  const hideProgress = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setProgress(0);
      setStatus(null);
      animatedWidth.setValue(0);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.primary, opacity: fadeAnim, borderBottomColor: theme.border }]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.info}>
            <MaterialCommunityIcons 
              name={status === 'READY' ? "check-circle" : "cloud-upload-outline"} 
              size={14} 
              color={status === 'READY' ? "#22C55E" : theme.accent} 
            />
            <Text style={[styles.label, { color: theme.text }]}>
              {status === 'READY' ? 'Upload complete!' : `Processing media... ${progress}%`}
            </Text>
          </View>
        </View>
        
        {/* The Actual Progress Bar */}
        <View style={[styles.barBg, { backgroundColor: theme.secondary }]}>
          <Animated.View 
            style={[
              styles.barFill, 
              { 
                width: animatedWidth, 
                backgroundColor: status === 'READY' ? "#22C55E" : theme.accent 
              }
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 45, // Assuming space for standard top offset
    borderBottomWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  barBg: {
    height: 3,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
