import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * NATIVE AD BANNER
 * A styled wrapper for Google AdMob Banner Ads.
 * Designed to feel like a premium, integrated part of the feed.
 */

// 🆔 AD UNIT ID (Reading from environment with Test Fallback)
const AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID || TestIds.BANNER;

export const NativeAdBanner = () => {
  const { theme } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
      {/* 🏷️ SPONSORED LABEL (Premium Aesthetic) */}
      <View style={s.header}>
        <View style={s.labelRow}>
          <MaterialCommunityIcons name="information-outline" size={12} color={theme.textSecondary} />
          <Text style={[s.sponsoredText, { color: theme.textSecondary }]}>SPONSORED</Text>
        </View>
        <MaterialCommunityIcons name="dots-horizontal" size={18} color={theme.textSecondary} />
      </View>

      <View style={s.adContainer}>
        <BannerAd
          unitId={AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => console.log('✅ [ADS] Banner Ad Loaded Successfully!')}
          onAdFailedToLoad={(error) => console.error('❌ [ADS] Ad Failed to Load:', error)}
        />
      </View>

      <View style={s.footer}>
        <Text style={[s.footerText, { color: theme.textSecondary }]}>
          Support SuviX by viewing tailored advertisements.
        </Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sponsoredText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adContainer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
});
