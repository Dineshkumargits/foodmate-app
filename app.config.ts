import 'dotenv/config' // allows use of .env

const isChristmasTime = () => {
  const now = new Date()
  const month = now.getMonth()
  const day = now.getDate()
  return month === 11 || (month === 0 && day <= 5)
}

const iconPath = isChristmasTime()
  ? './assets/icon-christmas.png'
  : './assets/icon.png'

export default {
  expo: {
    name: 'Foodmate',
    slug: 'foodmate',
    version: '1.0.0',
    plugins: [
      [
        'expo-notifications',
        {
          icon: iconPath,
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
        foregroundImage: iconPath,
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
