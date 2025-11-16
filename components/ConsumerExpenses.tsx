import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import authFetch from '../lib/api/api';
import { formatAmount } from '../lib/utils/amountFormatter';
import { formatDate } from '../lib/utils/dateFormatter';
import { IFoodEntries } from './ConsumerMeals';

interface IPayments {
  id: number
  amount: string;
  date: string;
}

interface ConsumerExpensesProps {
  foodItems: IFoodEntries[];
  payments: IPayments[];
}

export const ConsumerExpenses = () => {
  const [data, setData] = useState<{foodItems: IFoodEntries[], payments: IPayments[]}>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  },[])

  const fetchData = async () => {
    try {
      const res = await authFetch(`/my/data`, {
        method: "GET",
      });
      setData(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return loading ? (
    <ActivityIndicator size={"large"}/>
  ) : (
    <ConsumerExpensesHelper foodItems={data?.foodItems} payments={data?.payments}/>
  )

}

export function ConsumerExpensesHelper({ foodItems, payments }: ConsumerExpensesProps) {
  const totalSpent = foodItems.reduce((sum, item) => sum + Number(item.amount), 0);

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingBalance = totalSpent - totalPaid;
  const paymentPercentage = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0;

  // Monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyItems = foodItems.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
  });

  const monthlySpent = monthlyItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const avgPerMeal = monthlyItems.length > 0 ? monthlySpent / monthlyItems.length : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Expenses</Text>
          <Text style={styles.subtitle}>Track your spending and balance</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>💵</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>
                  {formatAmount(totalSpent)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>📈</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Amount Paid</Text>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                  {formatAmount(totalPaid)}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.statCard, styles.pendingCard]}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>⚠️</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Pending Balance</Text>
                <Text style={[styles.statValue, { color: '#f97316' }]}>
                  {formatAmount(pendingBalance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(paymentPercentage, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{paymentPercentage.toFixed(0)}%</Text>
          </View>
          <Text style={styles.progressSubtext}>
            You've paid {formatAmount(totalPaid)} out of {formatAmount(totalSpent)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Month</Text>

          <View style={styles.monthlyItem}>
            <View style={styles.monthlyLabel}>
              <Text style={styles.monthlyEmoji}>📅</Text>
              <Text style={styles.monthlyText}>Monthly Spending</Text>
            </View>
            <Text style={styles.monthlyValue}>{formatAmount(monthlySpent)}</Text>
          </View>

          <View style={styles.monthlyItem}>
            <Text style={styles.monthlyText}>Average per meal</Text>
            <Text style={styles.monthlyValue}>{formatAmount(avgPerMeal)}</Text>
          </View>

          <View style={styles.monthlyItem}>
            <Text style={styles.monthlyText}>Total meals</Text>
            <Text style={styles.monthlyValue}>{monthlyItems.length} items</Text>
          </View>
        </View>

        {payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment History</Text>
            <View style={styles.paymentsList}>
              {payments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View>
                    <Text style={styles.paymentTitle}>Payment Received</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.date)}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>{formatAmount(payment.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  statsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#fdba74',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginBottom: 10,
  },
  monthlyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthlyEmoji: {
    fontSize: 16,
  },
  monthlyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#1a1a1a',
  },
  monthlyValue: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
  },
  paymentsList: {
    gap: 10,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
  },
  paymentTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  paymentAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#16a34a',
  },
});
