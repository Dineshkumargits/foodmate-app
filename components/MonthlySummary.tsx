import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { FoodItem, Payment } from '../App';

interface MonthlySummaryProps {
  foodItems: FoodItem[];
  payments: Payment[];
}

export function MonthlySummary({ foodItems, payments }: MonthlySummaryProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyFoodItems = foodItems.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
  });

  const monthlyPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
  });

  const totalRevenue = monthlyFoodItems.reduce((sum, item) => sum + item.price, 0);
  const totalPaid = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = totalRevenue - totalPaid;
  const totalItems = monthlyFoodItems.length;

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const avgPerItem = totalItems > 0 ? totalRevenue / totalItems : 0;
  const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Collected', value: `₹${totalPaid.toFixed(2)}`, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Pending', value: `₹${pendingAmount.toFixed(2)}`, color: '#f97316', bg: '#fed7aa' },
    { label: 'Total Items', value: totalItems.toString(), color: '#a855f7', bg: '#f3e8ff' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Monthly Summary</Text>
          <Text style={styles.subtitle}>Overview for {monthName}</Text>
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
          <Text style={styles.cardTitle}>Monthly Breakdown</Text>

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Average per item</Text>
            <Text style={styles.breakdownValue}>₹{avgPerItem.toFixed(2)}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Collection rate</Text>
            <View style={[styles.badge, { backgroundColor: collectionRate >= 80 ? '#22c55e' : '#64748b' }]}>
              <Text style={styles.badgeText}>{Math.round(collectionRate)}%</Text>
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Items this month</Text>
            <Text style={styles.breakdownValue}>{totalItems} items</Text>
          </View>
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
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1a1a1a',
  },
  breakdownValue: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
});
