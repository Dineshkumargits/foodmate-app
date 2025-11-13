import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { login } from "../lib/api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../App";

interface LoginScreenProps {
  onLogin: (role: "seller" | "consumer") => void;
}

const { width } = Dimensions.get("window");

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.access_token) {
        await AsyncStorage.setItem("token", res.access_token);
        await AsyncStorage.setItem("user", JSON.stringify(res.data));
        auth.signIn({ token: res.access_token, user: res.data });
      } else {
        alert(res.error || "login failed");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.logo}>🍽️ FoodMate</Text>
            <Text style={styles.subtitle}>Track meals & manage expenses</Text>
          </View>
          <View style={styles.tabContent}>
            <View style={styles.roleInfo}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  keyboardType="visible-password"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={loading}
            >
                {loading ? <ActivityIndicator style={{marginRight: 5}} /> : <></>}
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <View style={styles.features}>
              <Text style={styles.feature}>✓ View daily meal menu</Text>
              <Text style={styles.feature}>✓ Track total spending</Text>
              <Text style={styles.feature}>✓ Monitor pending balance</Text>
              <Text style={styles.feature}>✓ View payment history</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fdf9",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 24,
  },
  logo: {
    fontSize: 42,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#22c55e",
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Poppins-Medium",
  },
  activeTabText: {
    color: "#22c55e",
    fontFamily: "Poppins-SemiBold",
  },
  tabContent: {
    padding: 24,
  },
  roleInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 40,
  },
  roleTitle: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    fontFamily: "Poppins-Regular",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  features: {
    alignSelf: "stretch",
    backgroundColor: "#f8fdf9",
    borderRadius: 12,
    padding: 16,
  },
  feature: {
    fontSize: 13,
    color: "#16a34a",
    fontFamily: "Poppins-Regular",
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: "center",
    flexDirection: 'row',
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  inputGroup: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: "#1a1a1a",
  },
});
