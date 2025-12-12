import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authFetch from "./api/api";
import { Platform } from "react-native";
import Constants from "expo-constants";

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
});

// Create high-priority notification channel for Android
async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("meal-alerts", {
      name: "Meal Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }
}

// Call this on app initialization
setupNotificationChannel();

const PUSH_TOKEN_KEY = "expo_push_token";
const TOKEN_TIMESTAMP_KEY = "push_token_timestamp";
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Check if stored push token is expired or needs refresh
 */
async function shouldRefreshToken(): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem(TOKEN_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const tokenAge = Date.now() - parseInt(timestamp);
    const daysOld = tokenAge / (1000 * 60 * 60 * 24);

    return daysOld >= TOKEN_EXPIRY_DAYS;
  } catch (error) {
    return true;
  }
}

/**
 * Get stored push token
 */
async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Store push token with timestamp
 */
async function storePushToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    await AsyncStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error("Failed to store push token:", error);
  }
}

/**
 * Register device for push notifications and save token to backend
 * Returns true if token was updated, false otherwise
 */
export async function registerForPushToken(
  forceRefresh: boolean = false
): Promise<string | null> {
  if (Constants.executionEnvironment === "storeClient") {
    console.log(
      "Skipping push token registration: Expo Go (remote push unsupported in SDK 53+)"
    );
    return null;
  }

  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  try {
    // Setup notification channel first
    await setupNotificationChannel();

    // Check if we need to refresh the token
    if (!forceRefresh) {
      const storedToken = await getStoredPushToken();
      const needsRefresh = await shouldRefreshToken();

      if (storedToken && !needsRefresh) {
        console.log("Using cached push token");
        return storedToken;
      }
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission denied for notifications");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "ff6ed863-bfd2-4c47-ac5b-ff8d37baff13",
    });
    const newToken = tokenData.data;

    // Check if token has changed
    const storedToken = await getStoredPushToken();
    const tokenChanged = storedToken !== newToken;

    if (tokenChanged || forceRefresh) {
      console.log("Push token updated:", newToken);

      // Save token to backend
      try {
        await authFetch("/user/push-token", {
          method: "POST",
          body: JSON.stringify({
            pushToken: newToken,
            oldToken: storedToken,
            deviceInfo: {
              platform: Platform.OS,
              model: Device.modelName,
              osVersion: Device.osVersion,
            },
          }),
        });

        // Store locally with timestamp
        await storePushToken(newToken);
        console.log("Push token saved to backend and local storage");
      } catch (error) {
        console.error("Failed to save push token to backend:", error);
      }
    } else {
      console.log("Push token unchanged");
    }

    return newToken;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Verify and refresh push token if needed
 * Call this periodically (e.g., on app foreground)
 */
export async function verifyPushToken(): Promise<void> {
  const needsRefresh = await shouldRefreshToken();
  if (needsRefresh) {
    console.log("Push token expired, refreshing...");
    await registerForPushToken(true);
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalMealNotification(
  mealName: string,
  price: number,
  mealType: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🍽️ New Meal Added!",
      body: `${mealType}: ${mealName} - ₹${price}`,
      data: {
        type: "meal_added",
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
  });
}

/**
 * Send high-priority heads-up notification
 */
export async function sendHeadsUpNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      categoryIdentifier: "meal-alerts",
    },
    trigger: null,
  });
}

/**
 * Setup notification listeners for foreground and background notifications
 */
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse
    );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Check if notifications are enabled
 */
export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
