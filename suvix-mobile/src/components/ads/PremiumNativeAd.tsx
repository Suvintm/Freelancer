import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity } from 'react-native';
import {
  NativeAd,
  NativeAdView,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * 💎 PREMIUM INSTAGRAM-STYLE NATIVE AD (v15 API)
 * Designed to look like a natural social post in the UnifiedFeed.
 * Updated for AdMob v15 Manual Loading API.
 */

// 🆔 AD UNIT ID
const NATIVE_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_NATIVE_UNIT_ID || 'ca-app-pub-3940256099942544/2247696110';

interface PremiumNativeAdProps {
  preloadedAd?: NativeAd | null;
}

export const PremiumNativeAd = ({ preloadedAd }: PremiumNativeAdProps) => {
  const { theme } = useTheme();
  const [ad, setAd] = useState<NativeAd | null>(preloadedAd || null);

  // 📡 1. SYNC WITH PRELOADED AD
  useEffect(() => {
    if (preloadedAd) {
      setAd(preloadedAd);
    }
  }, [preloadedAd]);

  // ⏳ 2. PLACEHOLDER / LOADING STATE
  if (!ad) {
    return (
      <View style={[s.container, s.placeholder, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Loading Sponsored Content...</Text>
      </View>
    );
  }

  return (
    <NativeAdView
      nativeAd={ad}
      style={[s.container, { backgroundColor: theme.secondary, borderColor: theme.border }]}
    >
      <View style={{ width: '100%' }}>
        
        {/* 👤 1. HEADER (Instagram Post Style) */}
        <View style={s.header}>
          <View style={s.vignette}>
            {ad.icon ? (
              <Image source={{ uri: ad.icon.url }} style={s.icon} />
            ) : (
              <View style={[s.icon, { backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="star" size={20} color="#FFF" />
              </View>
            )}
          </View>
          <View style={s.headerText}>
            <Text style={[s.advertiser, { color: theme.text }]} numberOfLines={1}>
              {ad.advertiser || ad.headline}
            </Text>
            <View style={s.tagRow}>
              <Text style={[s.sponsored, { color: theme.accent }]}>Sponsored</Text>
              <View style={[s.dot, { backgroundColor: theme.textSecondary }]} />
              <MaterialCommunityIcons name="earth" size={10} color={theme.textSecondary} />
            </View>
          </View>
          <MaterialCommunityIcons name="dots-horizontal" size={20} color={theme.textSecondary} />
        </View>

        {/* 🖼️ 2. CENTER MEDIA (Visual Content) */}
        <NativeMediaView style={s.mediaView} />

        {/* 📝 3. FOOTER & CTA (The "Engagement" Zone) */}
        <View style={s.footer}>
          
          <View style={s.textZone}>
            <Text style={[s.headline, { color: theme.text }]} numberOfLines={1}>
              {ad.headline}
            </Text>
            <Text 
               numberOfLines={2} 
               style={[s.tagline, { color: theme.textSecondary }]} 
            >
              {ad.body || ad.advertiser}
            </Text>
          </View>

          {/* ⚡ PREMIUM CALL TO ACTION BUTTON */}
          <View style={[s.ctaButton, { backgroundColor: theme.accent }]}>
             <Text style={s.ctaText}>{ad.callToAction || 'Learn More'}</Text>
          </View>

        </View>
      </View>
    </NativeAdView>
  );
};

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  placeholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vignette: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  icon: {
    width: 36,
    height: 36,
  },
  headerText: {
    flex: 1,
  },
  advertiser: {
    fontSize: 14,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  sponsored: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 2,
  },
  mediaView: {
    width: '100%',
    aspectRatio: 1.2, // Matches Instagram landscape/square posts
    minHeight: 180, // Required for video ads to trigger
    backgroundColor: '#000',
  },
  footer: {
    padding: 16,
    gap: 12,
  },
  textZone: {
    gap: 4,
  },
  headline: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  ctaButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    })
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
