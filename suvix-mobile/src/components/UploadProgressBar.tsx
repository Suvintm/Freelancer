import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useSocketStore } from '../store/useSocketStore';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * PRODUCTION-GRADE GLOBAL UPLOAD PROGRESS
 * Listens for Socket.io 'media:progress' events.
 * Stays sticky at the top of the screen (below navbar).
 */
import { useUploadStore } from '../store/useUploadStore';

/**
 * PRODUCTION-GRADE GLOBAL UPLOAD PROGRESS
 * Reacts to global state changes from useUploadStore.
 * Centralized logic in useSocketStore ensures reliable updates.
 */
export const UploadProgressBar = () => {
  const { theme } = useTheme();
  const { progress, status, message, isVisible, reset } = useUploadStore();
  
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle visibility transitions
  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isVisible]);

  // Handle progress bar animation
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: (progress / 100) * width,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!isVisible) return null;

  const isComplete = status === 'success';
  const isFailed = status === 'failed';

  const hideProgress = () => {
    reset();
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.primary, opacity: fadeAnim, borderBottomColor: theme.border }]}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.info}>
            <View style={[styles.statusDot, { backgroundColor: isComplete ? "#22C55E" : (isFailed ? "#EF4444" : "#FF3040") }]} />
            <Text style={[styles.label, { color: theme.text }]}>
              {message}
            </Text>
            {!isComplete && !isFailed && (
              <Text style={[styles.percentageText, { color: theme.accent || "#FF3040" }]}>
                {Math.round(progress)}%
              </Text>
            )}
          </View>

          {/* ❌ MANUAL DISMISS BUTTON */}
          <TouchableOpacity onPress={hideProgress} style={styles.dismissBtn}>
            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* The Actual Progress Bar */}
        <View style={[styles.barBg, { backgroundColor: theme.secondary }]}>
          <Animated.View 
            style={[
              styles.barFill, 
              { 
                width: animatedWidth, 
                backgroundColor: isComplete ? "#22C55E" : (isFailed ? "#EF4444" : "#FF3040") 
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
    zIndex: 10000, // Higher than headers
    paddingTop: Platform.OS === 'ios' ? 45 : 35,
    borderBottomWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
    fontVariant: ['tabular-nums'],
  },
  dismissBtn: {
    padding: 4,
  },
  barBg: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
