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

const AdminBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [pendingCount, setPendingCount] = useState(0);

  const fetchBookings = async () => {
    try {
      const filters = {};
      if (activeTab !== 'All') filters.status = activeTab;
      const res = await getBookings(filters);
      setBookings(res.data.bookings || []);
      setPendingCount(res.data.pendingLicenseCount || 0);
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

  const renderBooking = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.Cancelled;
    const v = item.vehicleId;
    const u = item.userId;
    return (
      <TouchableOpacity
        style={[styles.card, shadows.small]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AdminBookingDetail', { bookingId: item._id })}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName}>{v?.make} {v?.model}</Text>
            <Text style={styles.customerName}>{u?.name} • {u?.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
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

      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        {pendingCount > 0 && (
          <View style={[styles.pendingBadge, shadows.small]}>
            <Ionicons name="alert-circle" size={14} color={colors.warning} />
            <Text style={styles.pendingText}>{pendingCount} pending</Text>
          </View>
        )}
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
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: colors.warningBorder },
  pendingText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive: { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  list: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.cardBorder },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: colors.text },
  customerName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: colors.textSecondary },
  priceText: { fontSize: 17, fontWeight: '800', color: colors.primary },
});

export default AdminBookingsScreen;
