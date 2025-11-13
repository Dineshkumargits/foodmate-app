import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import type { Payment } from '../App';
import Dropdown from './ui/dropdown';
import authFetch from '../lib/api/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '../lib/utils/dateFormatter';
import PriceInput from './ui/PriceInput';
import { formatAmount } from '../lib/utils/amountFormatter';

interface PaymentsListProps {
}

export function PaymentsList({  }: PaymentsListProps) {
  const [consumer, setConsumer] = useState("");
  const [consumers, setConsumers] = useState([]);
  const [consumerLoading, setConsumerLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString());
  const [datePickerShow, setDatePickerShow] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  useEffect(() => {
    fetchConsumers();
    fetchPayments();
  }, []);

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
    setLoading(true)
    if (!consumer || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(false)

    try {
      const res = await authFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          consumer_id: consumer,
          date,
          amount: price,
        })
      });
      fetchPayments();
      Alert.alert('Success', 'Payment recorded successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setConsumerLoading(false);
      setLoading(false)
    }

    setConsumer('');
    setPrice(0);
    setDate(new Date().toISOString())


  };

  const fetchPayments = async () => {
    setPaymentsLoading(true)
    try {
      const res = await authFetch("/payments", {
        method: "GET",
      });
      setPayments(res)
      Alert.alert('Success', 'Payment recorded successfully!');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPaymentsLoading(false)
    }
  }

  const isDisabled = useMemo(() => {
    return !consumer || !price || !date || loading || consumerLoading;
  }, [price, date, consumer]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Payment Management</Text>
          <Text style={styles.subtitle}>Record and track payments</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Record Payment</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Consumer Name</Text>
            <Dropdown
              items={consumers}
              value={consumer}
              onChange={setConsumer}
              placeholder="Select consumer"
            />
          </View>

          <PriceInput value={price} onChange={setPrice} label='Amount Paid (₹)' />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => { setDatePickerShow(true) }}
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
                  setDate(new Date(date.nativeEvent.timestamp).toISOString()); setDatePickerShow(false)
                }}
              />
            )}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8} disabled={isDisabled}>
            {(consumerLoading || loading) && (
              <ActivityIndicator style={{ marginRight: 5 }} />
            )}
            <Text style={styles.buttonText}>✓ Mark as Paid</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment History</Text>
          <>
            {paymentsLoading ? (
              <ActivityIndicator size={"large"} />
            ) : (
              <>
                {payments?.length === 0 ? (
                  <Text style={styles.emptyText}>No payments recorded yet</Text>
                ) : (
                  <View style={styles.list}>
                    {payments?.map((payment) => (
                      <View key={payment.id} style={styles.paymentItem}>
                        <View style={styles.paymentIcon}>
                          <Text style={styles.iconText}>💵</Text>
                        </View>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentName}>{payment?.Consumer?.name || ''}</Text>
                          <Text style={styles.paymentDate}>
                            {formatDate(payment.date)}
                          </Text>
                        </View>
                        <Text style={styles.paymentAmount}>{formatAmount(payment.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
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
    justifyContent: "center",
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
});
