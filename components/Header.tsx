import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../App";

interface HeaderProps {}

export function Header({}: HeaderProps) {
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    auth.signOut();
  };
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>🍽️ FoodMate</Text>
        <Text style={styles.subtitle}>
          {auth.user.role === "seller" ? "Seller Dashboard" : "Consumer View"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34, 197, 94, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  logoutText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#64748b",
  },
});
