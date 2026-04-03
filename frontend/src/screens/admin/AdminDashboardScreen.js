import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles } from '../../api/vehicleService';
import { getBookings } from '../../api/bookingService';
import { getPayments } from '../../api/paymentService';
import { getTickets } from '../../api/maintenanceService';
import { colors, shadows } from '../../theme';

const AdminDashboardScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [vRes, bRes, pRes, mRes] = await Promise.all([
        getVehicles(),
        getBookings(),
        getPayments(),
        getTickets(),
      ]);
      setStats({
        totalVehicles: vRes.data.length,
        totalBookings: bRes.data.total,
        pendingLicenses: bRes.data.pendingLicenseCount || 0,
        confirmedBookings: (bRes.data.bookings || []).filter(b => b.status === 'Confirmed').length,
        underReview: pRes.data.underReviewCount || 0,
        totalPayments: pRes.data.total,
        underMaintenance: mRes.data.underMaintenanceCount || 0,
        openTickets: (mRes.data.tickets || []).filter(t => t.status === 'Open' || t.status === 'In_Progress').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchStats();
  }, []));

  const statCards = [
    { label: 'Total Vehicles', value: stats.totalVehicles, icon: 'car-sport-outline', color: colors.primary, bg: colors.primaryBg },
    { label: 'Active Bookings', value: stats.confirmedBookings, icon: 'calendar-outline', color: colors.success, bg: colors.successBg },
    { label: 'Pending Licenses', value: stats.pendingLicenses, icon: 'document-text-outline', color: colors.warning, bg: colors.warningBg },
    { label: 'Payments to Review', value: stats.underReview, icon: 'card-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    { label: 'Under Maintenance', value: stats.underMaintenance, icon: 'construct-outline', color: colors.error, bg: colors.errorBg },
    { label: 'Open Tickets', value: stats.openTickets, icon: 'ticket-outline', color: colors.blue, bg: colors.blueBg },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Fleet overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {statCards.map((s, i) => (
            <View key={i} style={[styles.statCard, shadows.small]}>
              <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={22} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value ?? '—'}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.listContainer}>
          {[
            { label: 'Manage Vehicles', icon: 'car-sport', screen: 'Vehicles', color: colors.primary, bg: colors.primaryBg },
            { label: 'View Bookings', icon: 'receipt', screen: 'AdminBookings', color: colors.success, bg: colors.successBg },
            { label: 'Verify Payments', icon: 'card', screen: 'Payments', color: colors.warning, bg: colors.warningBg },
            { label: 'Maintenance', icon: 'construct', screen: 'Maintenance', color: colors.blue, bg: colors.blueBg },
          ].map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.actionListItem, shadows.small]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(a.screen)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(99, 102, 241, 0.05)', top: -100, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(168, 85, 247, 0.04)', bottom: 80, left: -60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.errorBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.errorBorder },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  statCard: { width: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.cardBorder },
  statIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginTop: 28, marginBottom: 14 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  actionListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.cardBorder },
  actionIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
});

export default AdminDashboardScreen;
