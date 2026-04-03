import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getBookings } from '../../api/bookingService';
import { colors, formatDate, formatCurrency, formatStatus, statusColors, shadows } from '../../theme';

const STATUSES = ['All', 'Pending_License', 'Awaiting_Payment', 'Confirmed', 'Completed', 'Cancelled'];

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');

  const fetchBookings = async () => {
    try {
      const filters = {};
      if (activeTab !== 'All') filters.status = activeTab;
      const res = await getBookings(filters);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchBookings();
  }, [activeTab]));

  const getStatusIcon = (status) => {
    const icons = {
      Pending_License: 'time-outline',
      Awaiting_Payment: 'card-outline',
      Confirmed: 'checkmark-circle-outline',
      Completed: 'trophy-outline',
      Cancelled: 'close-circle-outline',
    };
    return icons[status] || 'help-outline';
  };

  const renderBooking = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.Cancelled;
    const v = item.vehicleId;
    return (
      <TouchableOpacity
        style={[styles.bookingCard, shadows.small]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item._id })}
      >
        <View style={styles.bookingHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{v?.make} {v?.model}</Text>
            <Text style={styles.vehicleYear}>{v?.year} • {v?.licensePlate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Ionicons name={getStatusIcon(item.status)} size={12} color={sc.text} />
            <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{formatDate(item.startDate)} → {formatDate(item.endDate)}</Text>
          </View>
          <Text style={styles.priceText}>{formatCurrency(item.totalPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.bgCircle1} />

      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      <View style={{ maxHeight: 50, marginBottom: 8 }}>
        <FlatList
          horizontal
          data={STATUSES}
          keyExtractor={(i) => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item && styles.tabActive]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, activeTab === item && styles.tabTextActive]}>
                {item === 'All' ? 'All' : formatStatus(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  bgCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(168, 85, 247, 0.05)', top: -60, right: -60 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  bookingCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: colors.text },
  vehicleYear: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  bookingDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: colors.textSecondary },
  priceText: { fontSize: 16, fontWeight: '800', color: colors.primary },
});

export default MyBookingsScreen;
