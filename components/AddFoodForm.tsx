import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AuthContext } from "../App";
import authFetch from "../lib/api/api";
import Dropdown from "./ui/dropdown";
import PriceInput from "./ui/PriceInput";
import { formatDate } from "../lib/utils/dateFormatter";

interface AddFoodFormProps {}

export function AddFoodForm({}: AddFoodFormProps) {
  const auth = useContext(AuthContext);

  const [foodName, setFoodName] = useState("");
  const [price, setPrice] = useState(0);
  const [date, setDate] = useState(new Date().toISOString());
  const [datePickerShow, setDatePickerShow] = useState(false);
  const [mealType, setMealType] = useState("Lunch");
  const [consumer, setConsumer] = useState("");
  const [consumers, setConsumers] = useState([]);
  const [consumerLoading, setConsumerLoading] = useState(true);
  const mealOptions = [
    { label: "Lunch", value: "Lunch" },
    { label: "Dinner", value: "Dinner" },
  ];

  useEffect(() => {
    fetchConsumers();
  }, []);

  useEffect(() => {
    if (mealType === "Lunch") {
      setPrice(100);
    } else {
      setPrice(50);
    }
  }, [mealType]);

  const fetchConsumers = async () => {
    try {
      const res = await authFetch("/user/consumers", {
        method: "GET",
      });
      const options = res?.data?.map((r) => ({ label: r.name, value: r.id }));
      setConsumers(options);
      setConsumer(options[0]?.value);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConsumerLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!foodName.trim() || !price) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const priceNum = parseFloat(String(price));
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    try {
      const response = await authFetch("/entries", {
        method: "POST",
        body: JSON.stringify({
          consumer_id: consumer,
          date,
          meal_type: mealType,
          food_name: foodName,
          amount: Number(price),
        }),
      });

      if (response) {
        // Send push notification to consumer
        try {
          await authFetch("/notifications/meal-added", {
            method: "POST",
            body: JSON.stringify({
              consumer_id: consumer,
              food_name: foodName,
              amount: Number(price),
              meal_type: mealType,
              date: date,
            }),
          });
          console.log("Notification sent to consumer");
        } catch (notifError) {
          console.error("Failed to send notification:", notifError);
          // Don't block the main flow if notification fails
        }

        Alert.alert("Success", "Food item added successfully!");
        setFoodName("");
        setPrice(0);
        setDate(new Date().toISOString().split("T")[0]);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const isDisabled = useMemo(() => {
    return !foodName || !price || !date || !mealType || !consumer;
  }, [foodName, price, date, mealType, consumer]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Add Food Item</Text>
          <Text style={styles.subtitle}>Add meals to your consumer</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Food Item</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Consumer</Text>
            <Dropdown
              items={consumers}
              value={consumer}
              onChange={setConsumer}
              placeholder="Select consumer"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Food Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Chicken Biryani"
              placeholderTextColor="#94a3b8"
              value={foodName}
              onChangeText={setFoodName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal Type</Text>
            <Dropdown
              items={mealOptions}
              value={mealType}
              onChange={setMealType}
              placeholder="Select meal type"
            />
          </View>

          <PriceInput value={price} onChange={setPrice} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setDatePickerShow(true);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ marginLeft: 12 }}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {datePickerShow && (
              <DateTimePicker
                testID="dateTimePicker"
                value={new Date(date)}
                mode={"date"}
                onChange={(date) => {
                  setDate(new Date(date.nativeEvent.timestamp).toISOString());
                  setDatePickerShow(false);
                }}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isDisabled}
          >
            {consumerLoading && (
              <ActivityIndicator style={{ marginRight: 5 }} />
            )}
            <Text style={styles.buttonText}>➕ Add Food Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Quick Tips:</Text>
          <Text style={styles.tipText}>
            • Add food items daily for accurate tracking
          </Text>
          <Text style={styles.tipText}>• Set fair prices for your meals</Text>
          <Text style={styles.tipText}>
            • Update dates if adding past items
          </Text>
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
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 20,
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
  datePickerButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#f0fdf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },
  tipsCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#16a34a",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: "#16a34a",
    marginBottom: 6,
  },
});
