import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Pdf from 'react-native-pdf'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import Constants from 'expo-constants'
import authFetch from '../lib/api/api'
import { formatAmount } from '../lib/utils/amountFormatter'
import { formatDate } from '../lib/utils/dateFormatter'
import Dropdown from './ui/dropdown'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface MonthlySummaryProps {}

interface ReportsData {
  month: string
  consumerId: number
  totalRevenue: number
  totalPaid: number
  pendingAmount: number
  totalItems: number
  avgPerItem: number
  collectionRate: number
  breakdown: IBreakdown[]
  stats: IStats[]
}

interface IBreakdown {
  id: number
  totalRevenue: string
  consumerId: number
  consumerName: string
}

interface IStats {
  label: string
  value: number
  color: string
  bg: string
  isAmount: boolean
}

interface ConsumerSummary {
  consumerId: number
  consumerName: string
  totalDue: number
  totalPaid: number
  balance: number
  monthlyBills: MonthlyBill[]
}

interface MonthlyBill {
  month: number
  year: number
  totalDue: number
  totalPaid: number
  balance: number
  foodEntries: any[]
  payments: any[]
}

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

export function MonthlySummary({}: MonthlySummaryProps) {
  const [data, setData] = useState<ReportsData>()
  const [loading, setLoading] = useState(true)
  const [consumer, setConsumer] = useState('')
  const [consumers, setConsumers] = useState([])
  const [consumerLoading, setConsumerLoading] = useState(true)
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()].value)
  const [consumerSummaries, setConsumerSummaries] = useState<ConsumerSummary[]>(
    [],
  )
  const [summariesLoading, setSummariesLoading] = useState(true)
  const [selectedConsumerDetail, setSelectedConsumerDetail] =
    useState<ConsumerSummary | null>(null)
  const [selectedMonthDetail, setSelectedMonthDetail] =
    useState<MonthlyBill | null>(null)
  const [foodEntries, setFoodEntries] = useState<any[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [generatingBill, setGeneratingBill] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewPdfUri, setPreviewPdfUri] = useState('')
  const [previewPdfBase64, setPreviewPdfBase64] = useState('')

  useEffect(() => {
    fetchConsumers()
    fetchConsumerSummaries()
  }, [])

  useEffect(() => {
    fetchStats()
    fetchFoodEntries()
  }, [month, consumer])

  const fetchStats = async () => {
    try {
      const res = await authFetch(
        `/reports/seller/monthly-stats?month=${month}&consumerId=${consumer}`,
        {
          method: 'GET',
        },
      )
      setData(res)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFoodEntries = async () => {
    if (!consumer || !month) {
      setFoodEntries([])
      setEntriesLoading(false)
      return
    }

    setEntriesLoading(true)
    try {
      const res = await authFetch('/entries', {
        method: 'GET',
      })

      // Filter entries by consumer and month
      const filtered = (res || []).filter((entry: any) => {
        const entryDate = new Date(entry.date)
        const entryMonth = MONTHS[entryDate.getMonth()].value
        return entry.consumer_id === Number(consumer) && entryMonth === month
      })

      setFoodEntries(filtered)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setEntriesLoading(false)
    }
  }

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

  const getConsumerName = useCallback(
    (id: number) => {
      const consumer = consumers.find((c: any) => c.value == id)
      return consumer.label || 'Consumer'
    },
    [consumers],
  )

  const fetchConsumerSummaries = async () => {
    setSummariesLoading(true)
    try {
      const consumersRes = await authFetch('/user/consumers', { method: 'GET' })
      const allConsumers = consumersRes?.data || []

      const entriesRes = await authFetch('/entries', { method: 'GET' })
      const paymentsRes = await authFetch('/payments', { method: 'GET' })

      const foodEntries = entriesRes || []
      const allPayments = paymentsRes || []

      const summaries: ConsumerSummary[] = allConsumers.map((cons: any) => {
        const consumerEntries = foodEntries.filter(
          (e: any) => e.consumer_id === cons.id,
        )
        const consumerPayments = allPayments.filter(
          (p: any) => p.consumer_id === cons.id,
        )

        const monthsMap = new Map()
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        consumerEntries.forEach((entry: any) => {
          const entryDate = new Date(entry.date)
          const month = entryDate.getMonth() + 1
          const year = entryDate.getFullYear()

          if (year === currentYear && month === currentMonth) return

          const key = `${year}-${month}`
          if (!monthsMap.has(key)) {
            monthsMap.set(key, {
              month,
              year,
              foodEntries: [],
              payments: [],
              totalDue: 0,
              totalPaid: 0,
            })
          }
          const monthData = monthsMap.get(key)
          monthData.foodEntries.push(entry)
          monthData.totalDue += Number(entry.amount)
        })

        consumerPayments.forEach((payment: any) => {
          const paymentDate = new Date(payment.date)
          const month = paymentDate.getMonth() + 1
          const year = paymentDate.getFullYear()

          if (year === currentYear && month === currentMonth) return

          const key = `${year}-${month}`
          if (!monthsMap.has(key)) {
            monthsMap.set(key, {
              month,
              year,
              foodEntries: [],
              payments: [],
              totalDue: 0,
              totalPaid: 0,
            })
          }
          const monthData = monthsMap.get(key)
          monthData.payments.push(payment)
          monthData.totalPaid += Number(payment.amount)
        })

        const monthlyBills: MonthlyBill[] = Array.from(monthsMap.values())
          .map((m: any) => ({ ...m, balance: m.totalDue - m.totalPaid }))
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year
            return b.month - a.month
          })

        const totalDue = monthlyBills.reduce((sum, m) => sum + m.totalDue, 0)
        const totalPaid = monthlyBills.reduce((sum, m) => sum + m.totalPaid, 0)

        return {
          consumerId: cons.id,
          consumerName: cons.name,
          totalDue,
          totalPaid,
          balance: totalDue - totalPaid,
          monthlyBills,
        }
      })

      const filteredSummaries = summaries
        .filter((s) => s.balance > 0)
        .sort((a, b) => b.balance - a.balance)

      setConsumerSummaries(filteredSummaries)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSummariesLoading(false)
    }
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', {
      month: 'long',
    })
  }

  const viewConsumerDetail = (summary: ConsumerSummary) => {
    setSelectedConsumerDetail(summary)
  }

  const viewMonthDetail = (monthBill: MonthlyBill) => {
    setSelectedMonthDetail(monthBill)
  }

  const closeConsumerDetail = () => {
    setSelectedConsumerDetail(null)
  }

  const closeMonthDetail = () => {
    setSelectedMonthDetail(null)
  }

  const handleGenerateBill = async () => {
    if (!consumer || !month) {
      Alert.alert('Error', 'Please select both consumer and month')
      return
    }

    setGeneratingBill(true)
    try {
      // Use authFetch with returnBlob option for binary data
      const response = await authFetch(
        `/reports/generate-bill?consumerId=${consumer}&month=${month}`,
        {
          method: 'GET',
          returnBlob: true,
        },
      )

      // Use legacy FileSystem API for stability
      const fileName = `Bill-${month}-${getConsumerName(Number(consumer))}.pdf`
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`

      const arrayBuffer = await response.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          '',
        ),
      )

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      })

      setPreviewPdfUri(fileUri)
      setPreviewPdfBase64(base64)
      setPreviewModalVisible(true)
    } catch (error: any) {
      console.log('error 1', error)
      Alert.alert('Error', error.message || 'Failed to generate bill')
    } finally {
      setGeneratingBill(false)
    }
  }

  const handleShareBill = async () => {
    try {
      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(previewPdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Bill for ${month}`,
          UTI: 'com.adobe.pdf',
        })
      } else {
        Alert.alert('Error', 'Sharing is not available on this device')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share bill')
    }
  }

  const closePreview = () => {
    setPreviewModalVisible(false)
    setPreviewPdfUri('')
    setPreviewPdfBase64('')
  }

  if (selectedMonthDetail && selectedConsumerDetail) {
    return (
      <MonthDetailView
        monthData={selectedMonthDetail}
        consumerName={selectedConsumerDetail.consumerName}
        onClose={closeMonthDetail}
        getMonthName={getMonthName}
      />
    )
  }

  if (selectedConsumerDetail) {
    return (
      <ConsumerDetailView
        summary={selectedConsumerDetail}
        onClose={closeConsumerDetail}
        onViewMonth={viewMonthDetail}
        getMonthName={getMonthName}
      />
    )
  }

  return (
    <>
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <SafeAreaView style={styles.pdfPreviewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              onPress={closePreview}
              style={styles.pdfCloseButton}
            >
              <Text style={styles.pdfCloseButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Bill Preview</Text>
            <TouchableOpacity
              onPress={handleShareBill}
              style={styles.pdfShareButton}
            >
              <Text style={styles.pdfShareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
          <Pdf
            trustAllCerts={false}
            source={{ uri: previewPdfUri, cache: true }}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`Number of pages: ${numberOfPages}`)
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}`)
            }}
            onError={(error) => {
              console.log('PDF Error:', error)
              Alert.alert('Error', 'Failed to load PDF preview')
            }}
            style={styles.pdf}
          />
        </SafeAreaView>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.card, styles.priorityCard]}>
            <View style={styles.priorityHeader}>
              <Text style={styles.priorityIcon}>⚠️</Text>
              <View>
                <Text style={styles.cardTitle}>Outstanding Balances</Text>
                <Text style={styles.cardSubtitle}>
                  Pending payments by consumer
                </Text>
              </View>
            </View>
            {summariesLoading ? (
              <ActivityIndicator size={'large'} color="#22c55e" />
            ) : consumerSummaries.length === 0 ? (
              <View style={styles.settledContainer}>
                <Text style={styles.settledIcon}>✅</Text>
                <Text style={styles.settledText}>All payments settled!</Text>
              </View>
            ) : (
              <View style={styles.summariesList}>
                {consumerSummaries.map((summary) => (
                  <TouchableOpacity
                    key={summary.consumerId}
                    style={styles.summaryCard}
                    onPress={() => viewConsumerDetail(summary)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.summaryHeader}>
                      <View style={styles.summaryIcon}>
                        <Text style={styles.summaryIconText}>👤</Text>
                      </View>
                      <View style={styles.summaryInfo}>
                        <Text style={styles.summaryName} numberOfLines={2}>
                          {summary.consumerName}
                        </Text>
                        <Text style={styles.summaryMeta}>
                          {summary.monthlyBills.length} month
                          {summary.monthlyBills.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.summaryAmounts}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Due:</Text>
                        <Text
                          style={[styles.summaryValue, { color: '#22c55e' }]}
                        >
                          {formatAmount(summary.totalDue)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Paid:</Text>
                        <Text
                          style={[styles.summaryValue, { color: '#3b82f6' }]}
                        >
                          {formatAmount(summary.totalPaid)}
                        </Text>
                      </View>
                      <View
                        style={[styles.summaryRow, styles.summaryBalanceRow]}
                      >
                        <Text style={styles.summaryBalanceLabel}>Balance:</Text>
                        <Text
                          style={[
                            styles.summaryBalanceValue,
                            {
                              color:
                                summary.balance > 0 ? '#f97316' : '#22c55e',
                            },
                          ]}
                        >
                          {formatAmount(summary.balance)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <View style={styles.titleSection}>
            <View>
              <Text style={styles.title}>Monthly Summary</Text>
              <Text style={styles.subtitle}>Overview for {data?.month}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 5, width: '100%' }}>
              <View style={{ width: '50%' }}>
                {consumerLoading ? (
                  <ActivityIndicator size={'small'} />
                ) : (
                  <Dropdown
                    items={consumers}
                    value={consumer}
                    onChange={setConsumer}
                    placeholder="Select consumer"
                  />
                )}
              </View>
              <View style={{ width: '50%' }}>
                <Dropdown
                  items={MONTHS}
                  value={month}
                  onChange={setMonth}
                  placeholder="Select Month"
                />
              </View>
            </View>
          </View>

          {consumer && month && (
            <TouchableOpacity
              style={[
                styles.generateBillButton,
                generatingBill && styles.buttonDisabled,
              ]}
              onPress={handleGenerateBill}
              disabled={generatingBill}
              activeOpacity={0.8}
            >
              {generatingBill ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              ) : (
                <Text style={styles.billIcon}>📄</Text>
              )}
              <Text style={styles.generateBillText}>
                {generatingBill ? 'Generating Bill...' : 'Generate Bill'}
              </Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator size={'large'} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                {data?.stats.map((stat, index) => (
                  <View
                    key={index}
                    style={[styles.statCard, { backgroundColor: stat.bg }]}
                  >
                    <Text style={[styles.statValue, { color: stat.color }]}>
                      {stat.isAmount ? formatAmount(stat.value) : stat.value}
                    </Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Food Entries</Text>
                <Text style={styles.cardSubtitle}>
                  {consumer
                    ? `Meals for selected consumer and month`
                    : 'Select a consumer to view entries'}
                </Text>
                {entriesLoading ? (
                  <ActivityIndicator size={'large'} color="#22c55e" />
                ) : !consumer ? (
                  <Text style={styles.emptyText}>Please select a consumer</Text>
                ) : foodEntries.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No food entries for this month
                  </Text>
                ) : (
                  <View style={styles.detailsList}>
                    {foodEntries.map((entry: any) => (
                      <View key={entry.id} style={styles.detailItem}>
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailTitle} numberOfLines={1}>
                            {entry.food_name}
                          </Text>
                          <Text style={styles.detailDate}>
                            {formatDate(entry.date)} • {entry.meal_type}
                          </Text>
                        </View>
                        <Text style={styles.detailAmount}>
                          {formatAmount(entry.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  )
}

function ConsumerDetailView({
  summary,
  onClose,
  onViewMonth,
  getMonthName,
}: any) {
  const paymentPercentage =
    summary.totalDue > 0 ? (summary.totalPaid / summary.totalDue) * 100 : 0

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Summary</Text>
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{summary.consumerName}</Text>
          <Text style={styles.subtitle}>
            Payment history & outstanding balance
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCardLarge}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>💵</Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Total Billed</Text>
                <Text style={[styles.statValueLarge, { color: '#22c55e' }]}>
                  {formatAmount(summary.totalDue)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCardLarge}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>📈</Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Total Paid</Text>
                <Text style={[styles.statValueLarge, { color: '#3b82f6' }]}>
                  {formatAmount(summary.totalPaid)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statCardLarge,
              summary.balance > 0 && styles.pendingCard,
            ]}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>
                {summary.balance > 0 ? '⚠️' : '✅'}
              </Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Outstanding Balance</Text>
                <Text
                  style={[
                    styles.statValueLarge,
                    { color: summary.balance > 0 ? '#f97316' : '#22c55e' },
                  ]}
                >
                  {formatAmount(summary.balance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ ...styles.card, marginBottom: 20 }}>
          <Text style={styles.cardTitle}>Payment Summary</Text>
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
            Received {formatAmount(summary.totalPaid)} out of{' '}
            {formatAmount(summary.totalDue)}
          </Text>
        </View>

        {summary.monthlyBills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Bills</Text>
            <Text style={styles.cardSubtitle}>Tap to view details</Text>
            <View style={styles.monthlyBillsList}>
              {summary.monthlyBills.map((bill: MonthlyBill) => (
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
                        {bill.foodEntries.length} meals • {bill.payments.length}{' '}
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
      </View>
    </ScrollView>
  )
}

function MonthDetailView({
  monthData,
  consumerName,
  onClose,
  getMonthName,
}: any) {
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
          <Text style={styles.subtitle}>{consumerName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCardLarge}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>💵</Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Total Due</Text>
                <Text style={[styles.statValueLarge, { color: '#22c55e' }]}>
                  {formatAmount(monthData.totalDue)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statCardLarge}>
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>📈</Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Paid</Text>
                <Text style={[styles.statValueLarge, { color: '#3b82f6' }]}>
                  {formatAmount(monthData.totalPaid)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.statCardLarge,
              monthData.balance > 0 && styles.pendingCard,
            ]}
          >
            <View style={styles.statHeader}>
              <Text style={styles.statEmoji}>
                {monthData.balance > 0 ? '⚠️' : '✅'}
              </Text>
              <View style={styles.statInfoLarge}>
                <Text style={styles.statLabelLarge}>Balance</Text>
                <Text
                  style={[
                    styles.statValueLarge,
                    { color: monthData.balance > 0 ? '#f97316' : '#22c55e' },
                  ]}
                >
                  {formatAmount(monthData.balance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {monthData.foodEntries.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Meals ({monthData.foodEntries.length})
            </Text>
            <View style={styles.detailsList}>
              {monthData.foodEntries.map((item: any) => (
                <View key={item.id} style={styles.detailItem}>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailTitle} numberOfLines={1}>
                      {item.food_name}
                    </Text>
                    <Text style={styles.detailDate}>
                      {formatDate(item.date)} • {item.meal_type}
                    </Text>
                  </View>
                  <Text style={styles.detailAmount}>
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
            <View style={styles.detailsList}>
              {monthData.payments.map((payment: any) => (
                <View key={payment.id} style={styles.detailItem}>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailTitle}>Payment Received</Text>
                    <Text style={styles.detailDate}>
                      {formatDate(payment.date)}
                    </Text>
                  </View>
                  <Text style={[styles.detailAmount, { color: '#3b82f6' }]}>
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
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 10,
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
  priorityCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#f97316',
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  priorityIcon: {
    fontSize: 28,
  },
  settledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  settledIcon: {
    fontSize: 32,
  },
  settledText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
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
  datePickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#f0fdf4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 20,
  },
  summariesList: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryIconText: {
    fontSize: 20,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  summaryMeta: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  summaryAmounts: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryBalanceRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.2)',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  summaryBalanceLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  summaryBalanceValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statCardLarge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  statInfoLarge: {
    flex: 1,
  },
  statLabelLarge: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  statValueLarge: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
    textAlign: 'right',
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  monthlyBillsList: {
    gap: 12,
  },
  monthlyBillItem: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  monthBillLeft: {
    flex: 1,
  },
  monthBillTitle: {
    fontSize: 15,
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
    gap: 2,
  },
  monthBillAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  monthBillBalance: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  backButton: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    gap: 12,
  },
  detailInfo: {
    flex: 1,
    flexShrink: 1,
  },
  detailTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  detailAmount: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#22c55e',
  },
  generateBillButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  billIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  generateBillText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#dc2626',
  },
  billSummaryContent: {
    padding: 24,
    alignItems: 'center',
  },
  billInfoCard: {
    width: '100%',
    backgroundColor: '#f8fdf9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  billInfoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  billInfoValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  successIconText: {
    fontSize: 32,
    color: '#22c55e',
  },
  billMessage: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  billSubMessage: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#64748b',
  },
  shareButtonLarge: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonLargeText: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pdfCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  pdfCloseButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#dc2626',
  },
  pdfShareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#22c55e',
  },
  pdfShareButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
})
