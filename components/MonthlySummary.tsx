import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import authFetch from "../lib/api/api";
import { formatAmount } from "../lib/utils/amountFormatter";
import Dropdown from "./ui/dropdown";

interface MonthlySummaryProps {}

interface ReportsData {
  month: string;
  consumerId: number;
  totalRevenue: number;
  totalPaid: number;
  pendingAmount: number;
  totalItems: number;
  avgPerItem: number;
  collectionRate: number;
  breakdown: IBreakdown[];
  stats: IStats[];
}

interface IBreakdown {
  id: number;
  totalRevenue: string;
  consumerId: number;
  consumerName: string;
}

interface IStats {
  label: string;
  value: number;
  color: string;
  bg: string;
  isAmount: boolean;
}

const MONTHS = [
  {label: "January", value: "January"},
  {label: "February", value: "February"},
  {label: "March", value: "March"},
  {label: "April", value: "April"},
  {label: "May", value: "May"},
  {label: "June", value: "June"},
  {label: "July", value: "July"},
  {label: "August", value: "August"},
  {label: "September", value: "September"},
  {label: "October", value: "October"},
  {label: "November", value: "November"},
  {label: "December", value: "December"},
];

export function MonthlySummary({}: MonthlySummaryProps) {
  const [data, setData] = useState<ReportsData>();
  const [loading, setLoading] = useState(true);
  const [consumer, setConsumer] = useState("");
  const [consumers, setConsumers] = useState([]);
  const [consumerLoading, setConsumerLoading] = useState(true);
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()].value);

  useEffect(() => {
    fetchConsumers();
  },[])

  useEffect(() => {
    fetchStats();
  }, [month, consumer]);

  const fetchStats = async () => {
    try {
      const res = await authFetch(
        `/reports/seller/monthly-stats?month=${month}&consumerId=${consumer}`,
        {
          method: "GET",
        }
      );
      setData(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.title}>Monthly Summary</Text>
            <Text style={styles.subtitle}>Overview for {data?.month}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5, width: "100%" }}>
            <View style={{ width: "50%" }}>
              {consumerLoading ? (
                <ActivityIndicator size={"small"} />
              ) : (
                <Dropdown
                  items={consumers}
                  value={consumer}
                  onChange={setConsumer}
                  placeholder="Select consumer"
                />
              )}
            </View>
            <View style={{ width: "50%" }}>
              <Dropdown
                items={MONTHS}
                value={month}
                onChange={setMonth}
                placeholder="Select Month"
              />
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size={"large"} />
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
              <Text style={styles.cardTitle}>Monthly Breakdown</Text>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Average per item</Text>
                <Text style={styles.breakdownValue}>
                  {formatAmount(data?.avgPerItem)}
                </Text>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Collection rate</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        data?.collectionRate >= 80 ? "#22c55e" : "#64748b",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {Math.round(data?.collectionRate)}%
                  </Text>
                </View>
              </View>

              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Items this month</Text>
                <Text style={styles.breakdownValue}>
                  {data?.totalItems} items
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fdf9",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 20,
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#1a1a1a",
  },
  breakdownValue: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: "#1a1a1a",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Poppins-SemiBold",
    color: "#ffffff",
  },
  datePickerButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#f0fdf4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
});
