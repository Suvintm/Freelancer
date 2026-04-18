export default ({ config }) => {
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
          "android_app_id": "ca-app-pub-5640382821262813~5733993852",
          "androidAppId": "ca-app-pub-5640382821262813~5733993852",
          "ios_app_id": "ca-app-pub-5640382821262813~3174241695",
          "iosAppId": "ca-app-pub-5640382821262813~3174241695"
        }
      ]
    ]
  };
};
