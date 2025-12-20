import React, { useState, useEffect, createContext, useRef } from "react";
import { StatusBar, Platform, LogBox, AppState, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { LoginScreen } from "./components/LoginScreen";
import { SellerDashboard } from "./components/SellerDashboard";
import { AddFoodForm } from "./components/AddFoodForm";
import { PaymentsList } from "./components/PaymentList";
import { MonthlySummary } from "./components/MonthlySummary";
import { ConsumerMeals } from "./components/ConsumerMeals";
import { ConsumerExpenses } from "./components/ConsumerExpenses";
import { ConsumerProfile } from "./components/ConsumerProfile";
import { BottomNav } from "./components/BottomNav";
import { Header } from "./components/Header";
import { ConsumersList } from "./components/ConsumersList";
import { SnowFall } from "./components/SnowFall";
import { isChristmasTime } from "./lib/theme";
import {
  registerForPushToken,
  setupNotificationListeners,
  verifyPushToken,
} from "./lib/notification";
import Constants from "expo-constants";

type User = {
  id: number;
  name: string;
  email: string;
  role: "seller" | "consumer";
  push_token: string | null;
} | null;

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  date: string;
}

export interface Payment {
  id: string;
  consumerName: string;
  amount: number;
  date: string;
}

const SAMPLE_FOOD_ITEMS: FoodItem[] = [
  { id: "1", name: "Chicken Biryani", price: 12.99, date: "2025-11-11" },
  { id: "2", name: "Butter Chicken", price: 14.5, date: "2025-11-11" },
  { id: "3", name: "Vegetable Curry", price: 10.0, date: "2025-11-10" },
  { id: "4", name: "Naan Bread", price: 3.5, date: "2025-11-10" },
];

const SAMPLE_PAYMENTS: Payment[] = [
  { id: "1", consumerName: "John Doe", amount: 25.0, date: "2025-11-10" },
  { id: "2", consumerName: "Jane Smith", amount: 15.0, date: "2025-11-09" },
];

export const AuthContext = createContext<any>(null);

export default function App() {
  const [userRole, setUserRole] = useState<"seller" | "consumer" | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [consumerName, setConsumerName] = useState("John Doe");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<{
    user: User;
    token: string | null;
    loading: boolean;
    activeTab: string;
  }>({ user: null, token: null, loading: true, activeTab: "dashboard" });

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse((await AsyncStorage.getItem("user")) || "null");
      setState({
        user,
        token,
        loading: false,
        activeTab: user?.role === "seller" ? "dashboard" : "meals",
      });

      // Register for push notifications on app load
      if (user) {
        const pushToken = await registerForPushToken();
        if (pushToken && pushToken !== user.push_token) {
          const updatedUser = { ...user, push_token: pushToken };
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          setState((prev) => ({ ...prev, user: updatedUser }));
        }
      }
    })();
  }, []);

  // Monitor app state changes to verify token when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          state.user
        ) {
          if (Constants.executionEnvironment === "storeClient") {
            console.log(
              "Foreground: Expo Go environment, remote push verify skipped."
            );
          } else {
            await verifyPushToken();
          }
        }
        appState.current = nextAppState;
      }
    );
    return () => subscription.remove();
  }, [state.user]);

  // Setup notification listeners
  useEffect(() => {
    if (!state.user) return;

    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log("Notification received:", notification);
        if (notification.request.content.data?.type === "meal_added") {
          setActiveTab("meals");
        }
      },
      (response) => {
        console.log("Notification clicked:", response);
        if (response.notification.request.content.data?.type === "meal_added") {
          setActiveTab("meals");
        }
      }
    );

    return cleanup;
  }, [state.user]);

  const auth = {
    signIn: async (data: any) => {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      // Always refresh push token on sign in
      let userData = data.user;
      const pushToken = await registerForPushToken(true); // Force refresh
      if (pushToken) {
        userData = { ...userData, push_token: pushToken };
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      }

      setState({
        user: userData,
        token: data.token,
        loading: false,
        activeTab: userData.role === "seller" ? "dashboard" : "meals",
      });
    },
    signOut: async () => {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setState({
        user: null,
        token: null,
        loading: false,
        activeTab: "dashboard",
      });
    },
    updateUser: async (user: any) => {
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setState({
        ...state,
        user: user,
      });
    },
  };

  LogBox.ignoreAllLogs(true);

  LogBox.ignoreLogs([
    "Require cycle:",
    "Warning: Each child should have a unique key",
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedFoodItems, savedPayments, savedConsumerName] =
        await Promise.all([
          AsyncStorage.getItem("foodItems"),
          AsyncStorage.getItem("payments"),
          AsyncStorage.getItem("consumerName"),
        ]);

      setFoodItems(
        savedFoodItems ? JSON.parse(savedFoodItems) : SAMPLE_FOOD_ITEMS
      );
      setPayments(savedPayments ? JSON.parse(savedPayments) : SAMPLE_PAYMENTS);
      if (savedConsumerName) setConsumerName(savedConsumerName);
    } catch (error) {
      console.error("Error loading data:", error);
      setFoodItems(SAMPLE_FOOD_ITEMS);
      setPayments(SAMPLE_PAYMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("foodItems", JSON.stringify(foodItems));
    }
  }, [foodItems, loading]);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("payments", JSON.stringify(payments));
    }
  }, [payments, loading]);

  useEffect(() => {
    if (!loading && consumerName) {
      AsyncStorage.setItem("consumerName", consumerName);
    }
  }, [consumerName, loading]);

  if (loading) {
    return null;
  }

  const renderContent = () => {
    if (state.user.role === "seller") {
      switch (activeTab) {
        case "dashboard":
          return <SellerDashboard />;
        case "add-food":
          return <AddFoodForm />;
        case "payments":
          return <PaymentsList />;
        case "summary":
          return <MonthlySummary />;
        case "consumers":
          return <ConsumersList />;
        default:
          return <SellerDashboard />;
      }
    } else {
      switch (activeTab) {
        case "meals":
          return <ConsumerMeals />;
        case "expenses":
          return <ConsumerExpenses />;
        case "profile":
          return <ConsumerProfile />;
        default:
          return <ConsumerMeals />;
      }
    }
  };

  const bgColor = state.user == null ? "#f8fdf9" : "#ffff";

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ ...state, ...auth }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
          {state.user == null ? (
            <>
              <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
              {isChristmasTime() && <SnowFall />}
              <LoginScreen />
            </>
          ) : (
            <>
              <StatusBar barStyle="dark-content" backgroundColor={bgColor} />
              {isChristmasTime() && <SnowFall />}
              <Header />
              {renderContent()}
              <BottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                role={userRole}
              />
            </>
          )}
        </SafeAreaView>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
