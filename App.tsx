import React, { useState, useEffect, createContext } from "react";
import { StatusBar, Platform, LogBox } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type User = {
  id: number;
  name: string;
  email: string;
  role: "seller" | "consumer";
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

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse((await AsyncStorage.getItem("user")) || "null");
      setState({
        user,
        token,
        loading: false,
        activeTab: user.role === "seller" ? "dashboard" : "meals",
      });
    })();
  }, []);

  const auth = {
    signIn: async (data: any) => {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        activeTab: data.user.role === "seller" ? "dashboard" : "meals",
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
  };

  LogBox.ignoreAllLogs(true);

  // OR ignore specific ones
  LogBox.ignoreLogs([
    "Require cycle:",
    "Warning: Each child should have a unique key",
  ]);

  // Load data from AsyncStorage
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

  // Save to AsyncStorage
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

  const handleAddFood = (food: Omit<FoodItem, "id">) => {
    const newFood: FoodItem = {
      id: Date.now().toString(),
      ...food,
    };
    setFoodItems([newFood, ...foodItems]);
  };

  const handleAddPayment = (payment: Omit<Payment, "id">) => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      ...payment,
    };
    setPayments([newPayment, ...payments]);
  };

  if (loading) {
    return null;
  }

  const renderContent = () => {
    if (state.user.role === "seller") {
      switch (activeTab) {
        case "dashboard":
          return <SellerDashboard foodItems={foodItems} payments={payments} />;
        case "add-food":
          return <AddFoodForm onAddFood={handleAddFood} />;
        case "payments":
          return (
            <PaymentsList payments={payments} onAddPayment={handleAddPayment} />
          );
        case "summary":
          return <MonthlySummary foodItems={foodItems} payments={payments} />;
        default:
          return <SellerDashboard foodItems={foodItems} payments={payments} />;
      }
    } else {
      console.log("role====", state.user.role);
      switch (activeTab) {
        case "meals":
          return <ConsumerMeals foodItems={foodItems} />;
        case "expenses":
          return (
            <ConsumerExpenses
              foodItems={foodItems}
              payments={payments}
              consumerName={consumerName}
            />
          );
        case "profile":
          return <ConsumerProfile />;
        default:
          return <ConsumerMeals foodItems={foodItems} />;
      }
    }
  };

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ ...state, ...auth }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fdf9" }}>
            {state.user == null ? (
              <>
                <StatusBar barStyle="dark-content" backgroundColor="#f8fdf9" />
                <LoginScreen />
              </>
            ) : (
              <>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
