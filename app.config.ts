import 'dotenv/config' // allows use of .env

export default {
  expo: {
    name: 'Foodmate',
    slug: 'foodmate',
    version: '1.0.0',
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#ffffff',
          mode: 'production',
        },
      ],
    ],
    extra: {
      apiUrl: process.env.API_BASE_URL,
      env: process.env.APP_ENV || 'development',
      eas: {
        projectId: 'ff6ed863-bfd2-4c47-ac5b-ff8d37baff13',
      },
    },
    android: {
      package: 'com.cindy.foodmate',
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#FFFFFF',
      },
      useNextNotificationsApi: true,
      googleServicesFile: './google-services.json',
      permissions: [
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'POST_NOTIFICATIONS',
        'USE_FULL_SCREEN_INTENT',
        'SCHEDULE_EXACT_ALARM',
      ],
    },
    ios: {
      bundleIdentifier: 'com.cindy.foodmate',
      infoPlist: {
        NSUserNotificationUsageDescription:
          'Allow notifications to receive alerts',
      },
    },
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
  },
}
