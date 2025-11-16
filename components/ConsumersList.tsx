import { useEffect, useState } from "react";
import authFetch from "../lib/api/api";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import ConsumerFormModal from "./AddConsumerModal";

export const ConsumersList = () => {
  const [consumers, setConsumers] = useState([]);
  const [editingConsumer, setEditingConsumer] = useState();
  const [consumerLoading, setConsumerLoading] = useState(true);
  const [addConsumerModalVisible, setAddConsumerModalVisible] = useState(false);
  useEffect(() => {
    fetchConsumers();
  }, []);

  const fetchConsumers = async () => {
    try {
      const res = await authFetch("/user/consumers", {
        method: "GET",
      });
      setConsumers(res?.data || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConsumerLoading(false);
    }
  };

  const handleAddConsumer = async (data) => {
    const body = JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone,
    });
    try {
      if (data.isEdit) {
        await authFetch(`/user/updateConsumer/${data.id}`, {
          method: "PATCH",
          body,
        });
        Alert.alert("Success", "Consumer updated successfully!");
        fetchConsumers();
      } else {
        await authFetch("/user/add", {
          method: "POST",
          body,
        });
        Alert.alert("Success", "Consumer added successfully!");
        fetchConsumers();
      }
    } catch (e: any) {
      alert(JSON.parse( e.message).error || e.message);
    }finally{
        
    }
  };

  const handleClose = () => {
    setAddConsumerModalVisible(false);
    setEditingConsumer(undefined);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={styles.cardTitle}>Consumers</Text>
          <TouchableOpacity
            style={styles.addConsumerButton}
            onPress={() => setAddConsumerModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.addConsumerText}>➕ Add</Text>
          </TouchableOpacity>
        </View>
        <>
          {consumerLoading ? (
            <ActivityIndicator size={"large"} />
          ) : (
            <>
              {consumers?.length === 0 ? (
                <Text style={styles.emptyText}>No consumers added yet</Text>
              ) : (
                <View style={styles.list}>
                  {consumers?.map((consumer) => (
                    <View key={consumer.id} style={styles.consumerItem}>
                      <View style={styles.consumerIcon}>
                        <Text style={styles.iconText}>👤</Text>
                      </View>
                      <View style={styles.consumerInfo}>
                        <Text style={styles.consumerName}>
                          {consumer?.name || ""}
                        </Text>
                      </View>
                      <View>
                        <TouchableOpacity
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            backgroundColor: "transparent",
                          }}
                          onPress={() => {
                            setEditingConsumer(consumer);
                            setAddConsumerModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.addConsumerText}>✏️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      </View>
      {/* Add Consumer Modal */}
      <ConsumerFormModal
        visible={addConsumerModalVisible}
        onClose={handleClose}
        onSubmit={handleAddConsumer}
        consumer={editingConsumer}
      />
    </ScrollView>
  );
};

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
  card: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
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
  },
  inputGroup: {
    marginBottom: 16,
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
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
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
  consumerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 12,
  },
  consumerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  consumerInfo: {
    flex: 1,
  },
  consumerName: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  paymentAmount: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#16a34a",
  },
  addConsumerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#22c55e",
  },
  addConsumerText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: "#ffffff",
  },
});
