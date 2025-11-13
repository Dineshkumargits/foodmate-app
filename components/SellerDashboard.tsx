import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { AuthContext, type FoodItem, type Payment } from "../App";
import authFetch from "../lib/api/api";
import { formatAmount } from "../lib/utils/amountFormatter";
import { formatDate } from "../lib/utils/dateFormatter";

interface SellerDashboardProps {}

const stats = [
  {
    label: "Total Revenue",
    key: "totalRevenue",
    color: "#22c55e",
    bg: "#dcfce7",
    type: "amount",
  },
  {
    label: "Amount Paid",
    key: "amountPaid",
    color: "#3b82f6",
    bg: "#dbeafe",
    type: "amount",
  },
  {
    label: "Pending Balance",
    key: "pendingBalance",
    color: "#f97316",
    bg: "#fed7aa",
    type: "amount",
  },
  {
    label: "Items Today",
    key: "todayFoodItems",
    color: "#a855f7",
    bg: "#f3e8ff",
  },
];

export function SellerDashboard({}: SellerDashboardProps) {
  const auth = useContext(AuthContext);
  const [data, setData] = useState();
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodItemsLoading, setFoodItemsLoading] = useState(true);

  useEffect(() => {
    fetchFoodItems();
    fetchDashboardData();
  }, [auth.user]);

  const fetchDashboardData = async () => {
    try {
      const res = await authFetch("/reports/dashboard", {
        method: "GET",
      });
      setData(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const res = await authFetch("/entries", {
        method: "GET",
      });
      setFoodItems(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setFoodItemsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Seller Dashboard</Text>
          <Text style={styles.subtitle}>Track your daily food business</Text>
        </View>
        <View style={styles.statsGrid}>
          {loading ? (
            <ActivityIndicator size={"large"} />
          ) : (
            <>
              {data &&
                stats.map((stat, index) => {
                  return (
                    <View
                      key={index}
                      style={[styles.statCard, { backgroundColor: stat.bg }]}
                    >
                      <Text style={[styles.statValue, { color: stat.color }]}>
                        {stat?.type === "amount"
                          ? formatAmount(data?.[stat.key])
                          : data?.[stat.key] || "-"}
                      </Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  );
                })}
            </>
          )}
        </View>

        <View style={styles.card}>
          {foodItemsLoading ? (
            <ActivityIndicator size={"large"} />
          ) : (
            <>
              <Text style={styles.cardTitle}>Recent Food Items</Text>
              {foodItems.length === 0 ? (
                <Text style={styles.emptyText}>No food items added yet</Text>
              ) : (
                <View style={styles.list}>
                  {foodItems?.slice(0, 5).map((item) => (
                    <View key={item.id} style={styles.listItem}>
                      <View>
                        <Text style={styles.itemName}>{item.food_name}</Text>
                        <Text style={styles.itemDate}>
                          {formatDate(item?.date)}
                        </Text>
                      </View>
                      <Text style={styles.itemPrice}>
                        {formatAmount(item?.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fdf9",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 20,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#22c55e",
  },
});
