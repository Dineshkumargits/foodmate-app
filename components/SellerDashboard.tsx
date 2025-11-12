import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { FoodItem, Payment } from '../App';

interface SellerDashboardProps {
  foodItems: FoodItem[];
  payments: Payment[];
}

export function SellerDashboard({ foodItems, payments }: SellerDashboardProps) {
  const totalRevenue = foodItems.reduce((sum, item) => sum + item.price, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = totalRevenue - totalPaid;
  const todayItems = foodItems.filter(
    (item) => new Date(item.date).toDateString() === new Date().toDateString()
  ).length;

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Amount Paid', value: `₹${totalPaid.toFixed(2)}`, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Pending Balance', value: `₹${pendingAmount.toFixed(2)}`, color: '#f97316', bg: '#fed7aa' },
    { label: 'Items Today', value: todayItems.toString(), color: '#a855f7', bg: '#f3e8ff' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Seller Dashboard</Text>
          <Text style={styles.subtitle}>Track your daily food business</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Food Items</Text>
          {foodItems.length === 0 ? (
            <Text style={styles.emptyText}>No food items added yet</Text>
          ) : (
            <View style={styles.list}>
              {foodItems.slice(0, 5).map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf9',
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
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
  },
});
