// src/components/Dropdown.js
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

export default function Dropdown({
  items = [],
  placeholder = "Select an option",
  value,
  onChange,
  containerStyle = null,
  style = null,
  dropDownContainerStyle = null,
  zIndex = 1000,
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.container, containerStyle, { zIndex }]}>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={(cb) => onChange && onChange(cb(value))}
        setItems={() => {}}
        placeholder={placeholder}
        listMode="SCROLLVIEW"
        style={[styles.dropdown, style]}
        dropDownContainerStyle={[
          styles.dropdownContainer,
          dropDownContainerStyle,
        ]}
        textStyle={styles.text}
        labelStyle={styles.label}
        dropDownDirection="AUTO"
        closeAfterSelecting={true}
        maxHeight={150} // fit to content, not full screen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  dropdown: {
    borderRadius: 12,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    minHeight: 48,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  dropdownContainer: {
    borderColor: "#eee",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  label: {
    color: "#333",
    fontWeight: "500",
  },
  arrowIcon: {
    tintColor: "#888",
  },
  tickIcon: {
    tintColor: "#2196f3",
  },
});
