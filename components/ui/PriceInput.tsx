import React from "react";
import { StyleSheet, Text, View } from "react-native";
import CurrencyInput from "react-native-currency-input";

interface IPriceInput {
  value: number;
  onChange: (value: number) => void;
}

export default function PriceInput(props: IPriceInput) {
  const { onChange, value } = props;


  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Price (₹)</Text>
      <CurrencyInput
        value={value}
        onChangeValue={(value: number) => {
          onChange(value);
        }}
        prefix="₹"
        delimiter=","
        separator="."
        precision={0}
        keyboardType="number-pad"
        minValue={0}
        style={styles.input}
        placeholder="0.00"
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  subtext: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
  },
});
