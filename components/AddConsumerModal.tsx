import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";

export default function ConsumerFormModal({
  visible,
  onClose,
  onSubmit,
  consumer = { name: "", phone: "", notes: "", email: "", id: undefined },
}) {
  const [name, setName] = React.useState(consumer.name);
  const [email, setEmail] = React.useState(consumer.email);
  const [phone, setPhone] = React.useState(consumer.phone);
  const [notes, setNotes] = React.useState(consumer.notes);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      setName(consumer.name || "");
      setEmail(consumer.email || "");
      setPhone(consumer.phone || "");
      setNotes(consumer.notes || "");
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(30);
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSubmit({
      name,
      email,
      phone,
      notes,
      isEdit: !!consumer.id,
      id: consumer.id,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* BACKDROP */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* BOTTOM SHEET AREA */}
        <KeyboardAvoidingView
          style={styles.bottomWrapper}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
          >
            <Text style={styles.title}>Consumer Details</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notes (optional)"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomWrapper: {
    width: "100%",
  },
  sheet: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  flex: { flex: 1 },
  avoid: {
    flex: 1,
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 10,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    fontSize: 16,
    color: "#111827",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 22,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
