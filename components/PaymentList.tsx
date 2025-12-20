import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import type { Payment } from '../App'
import Dropdown from './ui/dropdown'
import authFetch from '../lib/api/api'
import DateTimePicker from '@react-native-community/datetimepicker'
import { formatDate } from '../lib/utils/dateFormatter'
import PriceInput from './ui/PriceInput'
import { formatAmount } from '../lib/utils/amountFormatter'

const MONTHS = [
  { label: 'January', value: 'January' },
  { label: 'February', value: 'February' },
  { label: 'March', value: 'March' },
  { label: 'April', value: 'April' },
  { label: 'May', value: 'May' },
  { label: 'June', value: 'June' },
  { label: 'July', value: 'July' },
  { label: 'August', value: 'August' },
  { label: 'September', value: 'September' },
  { label: 'October', value: 'October' },
  { label: 'November', value: 'November' },
  { label: 'December', value: 'December' },
]

interface PaymentsListProps {}

export function PaymentsList({}: PaymentsListProps) {
  const [consumer, setConsumer] = useState('')
  const [consumers, setConsumers] = useState([])
  const [consumerLoading, setConsumerLoading] = useState(true)
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()].value)
  const [date, setDate] = useState(new Date().toISOString())
  const [datePickerShow, setDatePickerShow] = useState(false)
  const [price, setPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const [pendingLoading, setPendingLoading] = useState(false)

  useEffect(() => {
    fetchConsumers()
    fetchPayments()
  }, [])

  useEffect(() => {
    if (consumer && month) {
      fetchPendingAmount()
    } else {
      setPendingAmount(null)
    }
  }, [consumer, month])

  const fetchConsumers = async () => {
    try {
      const res = await authFetch('/user/consumers', {
        method: 'GET',
      })
      const options = res?.data?.map((r) => ({ label: r.name, value: r.id }))
      setConsumers(options)
      setConsumer(options[0]?.value)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setConsumerLoading(false)
    }
  }

  const fetchPendingAmount = async () => {
    setPendingLoading(true)
    try {
      // Check if the selected month is the current month
      const currentMonth = MONTHS[new Date().getMonth()].value

      // Only fetch pending amount for completed months (not current month)
      if (month === currentMonth) {
        setPendingAmount(null)
        setPrice(0)
        setPendingLoading(false)
        return
      }

      const res = await authFetch(
        `/reports/seller/monthly-stats?month=${month}&consumerId=${consumer}`,
        {
          method: 'GET',
        },
      )
      if (res?.pendingAmount !== undefined) {
        setPendingAmount(res.pendingAmount)
        // Prefill the amount with pending amount
        if (res.pendingAmount > 0) {
          setPrice(res.pendingAmount)
        } else {
          setPrice(0) // Reset to 0 if settled
        }
      } else {
        setPendingAmount(null)
        setPrice(0)
      }
    } catch (e: any) {
      setPendingAmount(null)
      setPrice(0)
    } finally {
      setPendingLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    if (!consumer || !price) {
      Alert.alert('Error', 'Please fill in all fields')
      setLoading(false)
      return
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const res = await authFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          consumer_id: consumer,
          date,
          amount: price,
        }),
      })
      if (res) {
        fetchPayments()
        Alert.alert('Success', 'Payment recorded successfully!')
        setPrice(0)
        setDate(new Date().toISOString())
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    setPaymentsLoading(true)
    try {
      const res = await authFetch('/payments', {
        method: 'GET',
      })
      setPayments(res)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const isDisabled = useMemo(() => {
    // Disable if basic fields are missing or loading
    if (!consumer || !price || !date || loading || consumerLoading) {
      return true
    }

    // Check if current month is selected
    const currentMonth = MONTHS[new Date().getMonth()].value
    if (month === currentMonth) {
      return true // Disable for current month
    }

    // Disable if no pending amount (month is settled)
    if (pendingAmount === 0 || pendingAmount === null) {
      return true
    }

    return false
  }, [price, date, consumer, loading, consumerLoading, month, pendingAmount])

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchPayments}
          colors={['#22c55e']} // Android spinner color
          tintColor="#22c55e" // iOS spinner color
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Payment Management</Text>
          <Text style={styles.subtitle}>Record and track payments</Text>
        </View>

        <View style={[styles.card, { zIndex: 3000 }]}>
          <Text style={styles.cardTitle}>Record Payment</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Consumer Name</Text>
            <Dropdown
              items={consumers}
              value={consumer}
              onChange={setConsumer}
              placeholder="Select consumer"
              zIndex={3000}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Month</Text>
            <Dropdown
              items={MONTHS}
              value={month}
              onChange={setMonth}
              placeholder="Select month"
              zIndex={2000}
            />
            {pendingLoading ? (
              <ActivityIndicator
                size="small"
                color="#22c55e"
                style={{ marginTop: 8 }}
              />
            ) : pendingAmount !== null && pendingAmount > 0 ? (
              <View style={styles.pendingAmountContainer}>
                <Text style={styles.pendingAmountLabel}>Pending amount:</Text>
                <Text style={styles.pendingAmountValue}>
                  {formatAmount(pendingAmount)}
                </Text>
              </View>
            ) : pendingAmount === 0 ? (
              <View style={styles.pendingAmountContainer}>
                <Text style={styles.settledText}>
                  ✓ All settled for this month
                </Text>
              </View>
            ) : null}
          </View>

          <PriceInput
            value={price}
            onChange={setPrice}
            label="Amount Paid (₹)"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setDatePickerShow(true)
              }}
              activeOpacity={0.8}
            >
              <Text style={{ marginLeft: 12 }}>{formatDate(date)}</Text>
            </TouchableOpacity>
            {datePickerShow && (
              <DateTimePicker
                testID="dateTimePicker"
                value={new Date(date)}
                mode={'date'}
                onChange={(date) => {
                  setDate(new Date(date.nativeEvent.timestamp).toISOString())
                  setDatePickerShow(false)
                }}
              />
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isDisabled && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isDisabled}
          >
            {loading && (
              <ActivityIndicator style={{ marginRight: 5 }} color="#fff" />
            )}
            <Text style={styles.buttonText}>✓ Mark as Paid</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { zIndex: 1 }]}>
          <Text style={styles.cardTitle}>Payment History</Text>
          {paymentsLoading ? (
            <ActivityIndicator size={'large'} color="#22c55e" />
          ) : payments?.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet</Text>
          ) : (
            <View style={styles.list}>
              {payments?.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentIcon}>
                    <Text style={styles.iconText}>💵</Text>
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>
                      {payment?.Consumer?.name || ''}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.date)}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatAmount(payment.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#1a1a1a',
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
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
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
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
  datePickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#f0fdf4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  pendingAmountContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingAmountLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#64748b',
  },
  pendingAmountValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#f97316',
  },
  settledText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#22c55e',
  },
})
