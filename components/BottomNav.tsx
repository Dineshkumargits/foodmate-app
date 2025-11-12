import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  role: 'seller' | 'consumer';
}

const sellerTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'add-food', label: 'Add Food', icon: '➕' },
  { id: 'payments', label: 'Payments', icon: '💵' },
  { id: 'summary', label: 'Summary', icon: '📊' },
];

const consumerTabs = [
  { id: 'meals', label: 'Meals', icon: '🍽️' },
  { id: 'expenses', label: 'Expenses', icon: '💰' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export function BottomNav({ activeTab, onTabChange, role }: BottomNavProps) {
  const tabs = role === 'seller' ? sellerTabs : consumerTabs;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.15)',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  activeLabel: {
    color: '#22c55e',
    fontFamily: 'Poppins-SemiBold',
  },
});
