import React, { useContext, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../App";
import authFetch from "../lib/api/api";

interface ConsumerProfileProps {}

export function ConsumerProfile({}: ConsumerProfileProps) {
  const auth = useContext(AuthContext);
  const [consumerName, setConsumerName] = useState(auth.user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentSecure, setCurrentSecure] = useState(true);
  const [newSecure, setNewSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);

  const handleUpdate = async () => {
    try {
      await authFetch("/user", {
        method: "PATCH",
        body: JSON.stringify({
          name: consumerName,
        }),
      });
      await auth.updateUser({ ...auth.user, name: consumerName });
      Alert.alert("Success", "Name Updated");
    } catch (e: any) {
      alert(e.message);
    }
  };
  const isDisabled = consumerName == auth.user.name;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert(
        "Error",
        "New password must be different from current password"
      );
      return;
    }
    try {
      await authFetch("/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      Alert.alert("Success", "Password Changed");
      setConfirmPassword("");
      setCurrentPassword("");
      setNewPassword("");
      setCurrentSecure(true);
      setNewSecure(true);
      setConfirmSecure(true);
    } catch (e: any) {
      alert(JSON.parse(e.message).message || e.message);
    }
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your account settings</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {auth.user.name || "Guest User"}
              </Text>
              <Text style={styles.profileRole}>Consumer Account</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.settingsIcon}>⚙️</Text>
            <Text style={styles.cardTitle}>Account Settings</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#94a3b8"
                value={consumerName}
                onChangeText={setConsumerName}
              />

              <TouchableOpacity
                style={{
                  ...styles.updateButton,
                  opacity: isDisabled ? 0.5 : 1,
                }}
                onPress={handleUpdate}
                activeOpacity={0.8}
                disabled={isDisabled}
              >
                <Text style={styles.logoutButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              This name will be used for payment tracking
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.settingsIcon}>🔒</Text>
            <Text style={styles.cardTitle}>Change Password</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={{ ...styles.input, paddingRight: 16 }}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={currentSecure}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.showHideButton}
                onPress={() => setCurrentSecure(!currentSecure)}
              >
                <Text style={styles.showHideText}>
                  {currentSecure ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={{ ...styles.input, paddingRight: 16 }}
                placeholder="Enter new password"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={newSecure}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.showHideButton}
                onPress={() => setNewSecure(!newSecure)}
              >
                <Text style={styles.showHideText}>
                  {newSecure ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={{ ...styles.input, paddingRight: 16 }}
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={confirmSecure}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.showHideButton}
                onPress={() => setConfirmSecure(!confirmSecure)}
              >
                <Text style={styles.showHideText}>
                  {confirmSecure ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={{
              ...styles.changePasswordButton,
              opacity:
                !currentPassword || !newPassword || !confirmPassword ? 0.5 : 1,
            }}
            onPress={handleChangePassword}
            activeOpacity={0.8}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            <Text style={styles.logoutButtonText}>Change</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About FoodMate</Text>
          <Text style={styles.infoText}>
            FoodMate helps you track daily meals and manage expenses between
            sellers and consumers. Keep your food expenses organized and
            transparent.
          </Text>
          <View style={styles.infoFooter}>
            <Text style={styles.infoVersion}>Version 1.0.0</Text>
            <Text style={styles.infoMade}>Made with 💚 for food lovers</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => auth.signOut()}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>
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
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarIcon: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#1a1a1a",
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
    paddingRight: 100,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  infoCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#16a34a",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#16a34a",
    lineHeight: 20,
    marginBottom: 16,
  },
  infoFooter: {
    gap: 4,
  },
  infoVersion: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  infoMade: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  updateButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    // paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: "absolute",
    right: 16,
    height: "70%",
    width: "20%",
    justifyContent: "center",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  changePasswordButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  showHideButton: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
  },

  showHideText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
});
