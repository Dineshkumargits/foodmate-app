import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import authFetch from './api/api'
import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Configure notification handler for high priority
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

// Create high-priority notification channel for Android
async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    console.log('Setting up Android notification channels...')

    // High-priority channel for reminders - with Samsung-specific settings
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority Notifications',
      description: 'Important notifications with pop-up alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    })
    console.log('High-priority channel created')

    // Default channel for meal alerts - also high importance for pop-ups
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Meal Alerts',
      description: 'New meal notifications',
      importance: Notifications.AndroidImportance.MAX, // Changed from HIGH to MAX
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    })
    console.log('Default channel created')
    console.log('Notification channels setup complete')
  }
}

// Call this on app initialization
setupNotificationChannel()

const PUSH_TOKEN_KEY = 'expo_push_token'
const TOKEN_TIMESTAMP_KEY = 'push_token_timestamp'
const TOKEN_EXPIRY_DAYS = 30

/**
 * Check if stored push token is expired or needs refresh
 */
async function shouldRefreshToken(): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY)
    if (!timestamp) return true

    const tokenAge = Date.now() - parseInt(timestamp)
    const daysOld = tokenAge / (1000 * 60 * 60 * 24)

    return daysOld >= TOKEN_EXPIRY_DAYS
  } catch (error) {
    return true
  }
}

/**
 * Get stored push token
 */
async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY)
  } catch (error) {
    return null
  }
}

/**
 * Store push token with timestamp
 */
async function storePushToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token)
    await AsyncStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString())
  } catch (error) {
    console.error('Failed to store push token:', error)
  }
}

/**
 * Register device for push notifications and save token to backend
 * Returns true if token was updated, false otherwise
 */
export async function registerForPushToken(
  forceRefresh: boolean = false,
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  try {
    await setupNotificationChannel()

    // 1️⃣ Always re-fetch token once per app launch
    const { status } = await Notifications.getPermissionsAsync()
    let finalStatus = status

    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync()
      finalStatus = req.status
    }

    if (finalStatus !== 'granted') {
      console.log('Notifications permission not granted')

      // Tell backend token is inactive
      const storedToken = await getStoredPushToken()
      if (storedToken) {
        await authFetch('/user/deactivate-push-token', {
          method: 'POST',
          body: JSON.stringify({ pushToken: storedToken }),
        })
      }

      return null
    }

    const { data: newToken } =
      await Notifications.getExpoPushTokenAsync({
        projectId: 'ff6ed863-bfd2-4c47-ac5b-ff8d37baff13',
      })

    const storedToken = await getStoredPushToken()
    const tokenChanged = storedToken !== newToken

    if (tokenChanged || forceRefresh) {
      console.log('🔄 Push token updated')

      await authFetch('/user/push-token', {
        method: 'POST',
        body: JSON.stringify({
          pushToken: newToken,
          oldToken: storedToken,
          deviceInfo: {
            platform: Platform.OS,
            model: Device.modelName,
            osVersion: Device.osVersion,
          },
        }),
      })

      await storePushToken(newToken)
    }

    return newToken
  } catch (error) {
    console.error('Push token registration failed:', error)
    return null
  }
}


/**
 * Verify and refresh push token if needed
 * Call this periodically (e.g., on app foreground)
 */
export async function verifyPushToken(): Promise<void> {
  const needsRefresh = await shouldRefreshToken()
  if (needsRefresh) {
    console.log('Push token expired, refreshing...')
    await registerForPushToken(true)
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalMealNotification(
  mealName: string,
  price: number,
  mealType: string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍽️ New Meal Added!',
      body: `${mealType}: ${mealName} - ₹${price}`,
      data: {
        type: 'meal_added',
        mealName,
        price,
        mealType,
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
    },
    trigger: null,
    identifier: `meal-${Date.now()}`,
  })
}

/**
 * Send high-priority heads-up notification
 */
export async function sendHeadsUpNotification(
  title: string,
  body: string,
  data?: any,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      categoryIdentifier: 'meal-alerts',
    },
    trigger: null,
  })
}

/**
 * Setup notification listeners for foreground and background notifications
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (
    response: Notifications.NotificationResponse,
  ) => void,
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    onNotificationReceived,
  )

  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse,
    )

  return () => {
    notificationListener.remove()
    responseListener.remove()
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}
