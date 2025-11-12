import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { FoodItem } from '../App';

interface ConsumerMealsProps {
  foodItems: FoodItem[];
}

export function ConsumerMeals({ foodItems }: ConsumerMealsProps) {
  const today = new Date().toDateString();
  const todayMeals = foodItems.filter(
    (item) => new Date(item.date).toDateString() === today
  );

  // Group meals by date
  const mealsByDate = foodItems.reduce((acc, item) => {
    const dateKey = new Date(item.date).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  const sortedDates = Object.keys(mealsByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Meals</Text>
          <Text style={styles.subtitle}>View your daily food menu</Text>
        </View>

        {todayMeals.length > 0 && (
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <Text style={styles.todayTitle}>Today's Menu</Text>
              <View style={styles.freshBadge}>
                <Text style={styles.freshText}>Fresh</Text>
              </View>
            </View>
            <View style={styles.mealsList}>
              {todayMeals.map((meal) => (
                <View key={meal.id} style={styles.todayMeal}>
                  <View style={styles.mealIcon}>
                    <Text style={styles.iconEmoji}>🍽️</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealPrice}>₹{meal.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal History</Text>
          {foodItems.length === 0 ? (
            <Text style={styles.emptyText}>No meals available yet</Text>
          ) : (
            <View style={styles.historyList}>
              {sortedDates.slice(0, 10).map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateIcon}>📅</Text>
                    <Text style={styles.dateText}>{date}</Text>
                  </View>
                  {mealsByDate[date].map((meal) => (
                    <View key={meal.id} style={styles.historyMeal}>
                      <View style={styles.historyMealIcon}>
                        <Text style={styles.iconEmoji}>🍽️</Text>
                      </View>
                      <Text style={styles.historyMealName}>{meal.name}</Text>
                      <Text style={styles.historyMealPrice}>₹{meal.price.toFixed(2)}</Text>
                    </View>
                  ))}
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
  todayCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#1a1a1a',
  },
  freshBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freshText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  mealsList: {
    gap: 10,
  },
  todayMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 20,
  },
  mealName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
  },
  mealPrice: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
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
  historyList: {
    gap: 16,
  },
  dateGroup: {
    gap: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748b',
  },
  historyMeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 12,
  },
  historyMealIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyMealName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
  },
  historyMealPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#22c55e',
  },
});
