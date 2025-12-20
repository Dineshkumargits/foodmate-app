import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native'
import authFetch from '../lib/api/api'
import { formatAmount } from '../lib/utils/amountFormatter'
import { formatDate } from '../lib/utils/dateFormatter'
import { IFoodEntries } from './ConsumerMeals'

interface IPayments {
  id: number
  amount: string
  date: string
}

interface ConsumerExpensesProps {
  foodItems: IFoodEntries[]
  payments: IPayments[]
}

export const ConsumerExpenses = () => {
  const [data, setData] = useState<{
    foodItems: IFoodEntries[]
    payments: IPayments[]
  }>()
  const [loading, setLoading] = useState(true)
  const [monthlyBills, setMonthlyBills] = useState<any[]>([])
  const [selectedMonthData, setSelectedMonthData] = useState<any>(null)
  const [viewingMonth, setViewingMonth] = useState<{
    month: number
    year: number
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await authFetch(`/my/data`, {
        method: 'GET',
      })
      setData(res)
      organizeMonthlyBills(res.foodItems, res.payments)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const organizeMonthlyBills = (
    foodItems: IFoodEntries[],
    payments: IPayments[],
  ) => {
    const monthsMap = new Map()

    // Group food items by month
    foodItems?.forEach((item) => {
      const date = new Date(item.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          foodItems: [],
          payments: [],
          totalDue: 0,
          totalPaid: 0,
        })
      }
      const monthData = monthsMap.get(key)
      monthData.foodItems.push(item)
      monthData.totalDue += Number(item.amount)
    })

    // Group payments by month
    payments?.forEach((payment) => {
      const date = new Date(payment.date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          foodItems: [],
          payments: [],
          totalDue: 0,
          totalPaid: 0,
        })
      }
      const monthData = monthsMap.get(key)
      monthData.payments.push(payment)
      monthData.totalPaid += Number(payment.amount)
    })

    // Convert to array, filter out current month (incomplete), and sort by date (newest first)
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const monthsArray = Array.from(monthsMap.values())
      .filter((m) => {
        // Only include completed months (not the current month)
        if (m.year === currentYear && m.month === currentMonth) {
          return false
        }
        return true
      })
      .map((m) => ({ ...m, balance: m.totalDue - m.totalPaid }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    setMonthlyBills(monthsArray)
  }

  const viewMonthDetails = (monthData: any) => {
    setSelectedMonthData(monthData)
    setViewingMonth({ month: monthData.month, year: monthData.year })
  }

  const closeMonthView = () => {
    setSelectedMonthData(null)
    setViewingMonth(null)
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', {
      month: 'long',
    })
  }

  return loading ? (
    <ActivityIndicator size={'large'} />
  ) : selectedMonthData ? (
    <MonthDetailsView
      monthData={selectedMonthData}
      onClose={closeMonthView}
      getMonthName={getMonthName}
    />
  ) : (
    <ConsumerExpensesHelper
      foodItems={data?.foodItems}
      payments={data?.payments}
      monthlyBills={monthlyBills}
      onViewMonth={viewMonthDetails}
      getMonthName={getMonthName}
    />
  )
}

function MonthDetailsView({ monthData, onClose, getMonthName }: any) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {getMonthName(monthData.month)} {monthData.year}
          </Text>
          <Text style={styles.subtitle}>Monthly bill details</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>💵</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Due</Text>
                <Text style={[styles.statValue, { color: '#22c55e' }]}>
                  {formatAmount(monthData.totalDue)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>📈</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Paid</Text>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                  {formatAmount(monthData.totalPaid)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statCard,
              monthData.balance > 0 && styles.pendingCard,
            ]}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>
                {monthData.balance > 0 ? '⚠️' : '✅'}
              </Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: monthData.balance > 0 ? '#f97316' : '#22c55e' },
                  ]}
                >
                  {formatAmount(monthData.balance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {monthData.foodItems.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Meals ({monthData.foodItems.length})
            </Text>
            <View style={styles.paymentsList}>
              {monthData.foodItems.map((item: IFoodEntries) => (
                <View key={item.id} style={styles.paymentItem}>
                  <View>
                    <Text style={styles.paymentTitle}>{item.food_name}</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(item.date)} • {item.meal_type}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatAmount(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {monthData.payments.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Payments ({monthData.payments.length})
            </Text>
            <View style={styles.paymentsList}>
              {monthData.payments.map((payment: IPayments) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View>
                    <Text style={styles.paymentTitle}>Payment Received</Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.date)}
                    </Text>
                  </View>
                  <Text style={[styles.paymentAmount, { color: '#3b82f6' }]}>
                    {formatAmount(payment.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export function ConsumerExpensesHelper({
  foodItems,
  payments,
  monthlyBills,
  onViewMonth,
  getMonthName,
}: ConsumerExpensesProps & {
  monthlyBills: any[]
  onViewMonth: any
  getMonthName: any
}) {
  // Calculate total spent and paid only from completed months (exclude current month)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const completedMonthItems = foodItems?.filter((item) => {
    const itemDate = new Date(item.date)
    if (
      itemDate.getFullYear() === currentYear &&
      itemDate.getMonth() === currentMonth
    ) {
      return false // Exclude current month
    }
    return true
  })

  const totalSpent = completedMonthItems.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  )

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  )
  const pendingBalance = totalSpent - totalPaid
  const paymentPercentage = totalSpent > 0 ? (totalPaid / totalSpent) * 100 : 0

  // Current month stats (for reference only, not billable)
  const monthlyItems = foodItems?.filter((item) => {
    const itemDate = new Date(item.date)
    return (
      itemDate.getMonth() === currentMonth &&
      itemDate.getFullYear() === currentYear
    )
  })

  const monthlySpent = monthlyItems.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  )
  const avgPerMeal =
    monthlyItems.length > 0 ? monthlySpent / monthlyItems.length : 0

  const currentMonthCard =
    monthlySpent > 0 ? (
      <View style={[styles.card, styles.currentMonthCard]}>
        <View style={styles.currentMonthHeader}>
          <View>
            <Text style={styles.currentMonthTitle}>Current Month</Text>
            <Text style={styles.currentMonthSubtitle}>
              {new Date().toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}{' '}
              • Not yet billed
            </Text>
          </View>
          <Text style={styles.currentMonthBadge}>In Progress</Text>
        </View>

        <View style={styles.currentMonthAmount}>
          <Text style={styles.currentMonthAmountLabel}>Running Total</Text>
          <Text style={styles.currentMonthAmountValue}>
            {formatAmount(monthlySpent)}
          </Text>
          <Text style={styles.currentMonthAmountNote}>
            {monthlyItems.length} meal{monthlyItems.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.currentMonthStats}>
          <View style={styles.currentMonthStatItem}>
            <Text style={styles.currentMonthStatLabel}>Avg per meal</Text>
            <Text style={styles.currentMonthStatValue}>
              {formatAmount(avgPerMeal)}
            </Text>
          </View>
        </View>
      </View>
    ) : null

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Expenses</Text>
          <Text style={styles.subtitle}>Completed monthly billing cycles</Text>
        </View>

        {pendingBalance <= 0 && currentMonthCard}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>💵</Text>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Total Billed</Text>
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
                <Text style={styles.statLabel}>Total Paid</Text>
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
                <Text style={styles.statLabel}>Outstanding Balance</Text>
                <Text style={[styles.statValue, { color: '#f97316' }]}>
                  {formatAmount(pendingBalance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
          <Text style={styles.cardSubtitle}>
            Based on completed months only
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(paymentPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {paymentPercentage.toFixed(0)}%
            </Text>
          </View>
          <Text style={styles.progressSubtext}>
            You've paid {formatAmount(totalPaid)} out of{' '}
            {formatAmount(totalSpent)}
          </Text>
        </View>

        {monthlyBills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Bills</Text>
            <Text style={styles.cardSubtitle}>Tap to view details</Text>
            <View style={styles.paymentsList}>
              {monthlyBills.map((bill, index) => (
                <TouchableOpacity
                  key={`${bill.year}-${bill.month}`}
                  style={styles.monthlyBillItem}
                  onPress={() => onViewMonth(bill)}
                  activeOpacity={0.7}
                >
                  <View style={styles.monthBillLeft}>
                    <Text style={styles.monthBillTitle}>
                      {getMonthName(bill.month)} {bill.year}
                    </Text>
                    <View style={styles.monthBillStats}>
                      <Text style={styles.monthBillStatText}>
                        {bill.foodItems.length} meals • {bill.payments.length}{' '}
                        payments
                      </Text>
                    </View>
                  </View>
                  <View style={styles.monthBillRight}>
                    <Text
                      style={[
                        styles.monthBillAmount,
                        { color: '#22c55e', fontSize: 12 },
                      ]}
                    >
                      Due: {formatAmount(bill.totalDue)}
                    </Text>
                    <Text
                      style={[
                        styles.monthBillAmount,
                        { color: '#3b82f6', fontSize: 12 },
                      ]}
                    >
                      Paid: {formatAmount(bill.totalPaid)}
                    </Text>
                    <Text
                      style={[
                        styles.monthBillBalance,
                        { color: bill.balance > 0 ? '#f97316' : '#22c55e' },
                      ]}
                    >
                      {bill.balance > 0 ? 'Due: ' : 'Settled'}{' '}
                      {bill.balance > 0 ? formatAmount(bill.balance) : '✓'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {pendingBalance > 0 && currentMonthCard}
      </View>
    </ScrollView>
  )
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
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginTop: -12,
    marginBottom: 12,
  },
  monthlyBillItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  monthBillLeft: {
    flex: 1,
  },
  monthBillTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  monthBillStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthBillStatText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  monthBillRight: {
    alignItems: 'flex-end',
  },
  monthBillAmount: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    marginBottom: 2,
  },
  monthBillBalance: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#22c55e',
  },
  currentMonthCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currentMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentMonthTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
    marginBottom: 4,
  },
  currentMonthSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
  },
  currentMonthBadge: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  currentMonthAmount: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  currentMonthAmountLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
    marginBottom: 4,
  },
  currentMonthAmountValue: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    color: '#6b7280',
    marginBottom: 2,
  },
  currentMonthAmountNote: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
  },
  currentMonthStats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  currentMonthStatItem: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  currentMonthStatLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
    marginBottom: 2,
  },
  currentMonthStatValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
  },
})
