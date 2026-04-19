require('dotenv').config();

export default ({ config }) => {
  console.log(`🔨 [BUILD] Configuring AdMob with Android ID: ${process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ? 'DETECTED' : 'MISSING'}`);

  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    },
    plugins: [
      ...(config.plugins || []),
      [
        "react-native-google-mobile-ads",
        {
          "android_app_id": process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
          "androidAppId": process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID,
          "ios_app_id": process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID,
          "iosAppId": process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID
        }
      ]
    ]
  };
};
